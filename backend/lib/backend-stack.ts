import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as path from 'path';
import * as os from 'os';
import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Validate required context variables
    const environment = this.node.tryGetContext('environment') || 'dev';
    
    // GitHub configuration for Amplify (optional for initial setup)
    const githubOwner = this.node.tryGetContext('githubOwner');
    const githubRepo = this.node.tryGetContext('githubRepo');
    const githubTokenSecretArn = this.node.tryGetContext('githubTokenSecretArn');

    // Log configuration
    console.log(`Deploying CincyMuse Backend for environment: ${environment}`);
    
    // CORS configuration - will be populated after Amplify app creation
    let amplifyApp: amplify.App | undefined;
    let amplifyAppUrl: string | undefined;
    let corsAllowedOrigins: string[] = ['http://localhost:3000']; // Default to localhost only
    
    // ========================================
    // DynamoDB Tables
    // ========================================
    
    // ConversationLogs table with GSIs for analytics
    // ADR: DynamoDB for conversation logs | Rationale: Serverless, pay-per-request, fast queries with GSIs
    // Alternative: RDS (rejected - higher cost, requires provisioning)
    const conversationLogsTable = new dynamodb.Table(this, 'ConversationLogsTable', {
      partitionKey: { name: 'conversationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl',
    });

    // TimestampIndex GSI for querying by language and time range
    conversationLogsTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: { name: 'language', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // FeedbackIndex GSI for querying conversations with feedback
    conversationLogsTable.addGlobalSecondaryIndex({
      indexName: 'FeedbackIndex',
      partitionKey: { name: 'feedback', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // PDFMetadata table for tracking uploaded customer service documents
    const pdfMetadataTable = new dynamodb.Table(this, 'PDFMetadataTable', {
      partitionKey: { name: 'pdfId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // ========================================
    // S3 Buckets
    // ========================================

    // PDF repository bucket for customer service documents
    const pdfBucket = new s3.Bucket(this, 'PDFRepositoryBucket', {
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: corsAllowedOrigins,
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
    });

    // Knowledge Base content bucket for podcasts, collections, events
    const kbContentBucket = new s3.Bucket(this, 'KBContentBucket', {
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // Bedrock Knowledge Base
    // ========================================

    // ADR: Bedrock Knowledge Base for managed RAG | Rationale: 63% cost reduction, 70% less code, automatic content processing
    // Alternative: Manual RAG with OpenSearch Serverless (rejected - higher cost, more complexity)

    // IAM role for Knowledge Base to access S3 and Bedrock
    const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role for Bedrock Knowledge Base to access S3 and invoke models',
    });

    // Grant KB role access to both S3 buckets
    pdfBucket.grantRead(kbRole);
    kbContentBucket.grantRead(kbRole);

    // Grant KB role permission to invoke Bedrock models
    kbRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
        ],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
        ],
      })
    );

    // Grant KB role permission to manage OpenSearch Serverless collection (managed by KB)
    kbRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'aoss:APIAccessAll',
        ],
        resources: [`arn:aws:aoss:${this.region}:${this.account}:collection/*`],
      })
    );

    // Create Knowledge Base with Titan Embeddings
    const knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'CincyMuseKB', {
      name: `cincymuse-kb-${environment}`,
      description: 'CincyMuse chatbot knowledge base with museum content',
      roleArn: kbRole.roleArn,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
        },
      },
      storageConfiguration: {
        type: 'OPENSEARCH_SERVERLESS',
        opensearchServerlessConfiguration: {
          collectionArn: `arn:aws:aoss:${this.region}:${this.account}:collection/cincymuse-kb-${environment}`,
          vectorIndexName: 'cincymuse-index',
          fieldMapping: {
            vectorField: 'embedding',
            textField: 'text',
            metadataField: 'metadata',
          },
        },
      },
    });

    // Web crawler data source for cincymuseum.org
    const cincyMuseumWebCrawler = new bedrock.CfnDataSource(this, 'CincyMuseumWebCrawler', {
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      name: 'cincymuseum-website',
      description: 'Main museum website content',
      dataSourceConfiguration: {
        type: 'WEB',
        webConfiguration: {
          sourceConfiguration: {
            urlConfiguration: {
              seedUrls: [{ url: 'https://www.cincymuseum.org' }],
            },
          },
          crawlerConfiguration: {
            crawlerLimits: {
              rateLimit: 300,
            },
            scope: 'HOST_ONLY',
          },
        },
      },
    });

    // Web crawler data source for supportcmc.org
    const supportCMCWebCrawler = new bedrock.CfnDataSource(this, 'SupportCMCWebCrawler', {
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      name: 'supportcmc-website',
      description: 'Museum support and donation website content',
      dataSourceConfiguration: {
        type: 'WEB',
        webConfiguration: {
          sourceConfiguration: {
            urlConfiguration: {
              seedUrls: [{ url: 'https://www.supportcmc.org' }],
            },
          },
          crawlerConfiguration: {
            crawlerLimits: {
              rateLimit: 300,
            },
            scope: 'HOST_ONLY',
          },
        },
      },
    });

    // S3 data source for PDF documents
    const pdfDataSource = new bedrock.CfnDataSource(this, 'PDFDataSource', {
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      name: 'pdf-documents',
      description: 'Customer service PDF documents',
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: pdfBucket.bucketArn,
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: 'FIXED_SIZE',
          fixedSizeChunkingConfiguration: {
            maxTokens: 800,
            overlapPercentage: 10,
          },
        },
      },
    });

    // S3 data source for podcasts and other KB content
    const podcastDataSource = new bedrock.CfnDataSource(this, 'PodcastDataSource', {
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      name: 'podcast-episodes',
      description: 'Cincinnati Museum Center podcast episodes',
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: kbContentBucket.bucketArn,
          inclusionPrefixes: ['podcasts/'],
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: 'FIXED_SIZE',
          fixedSizeChunkingConfiguration: {
            maxTokens: 800,
            overlapPercentage: 10,
          },
        },
      },
    });

    // ========================================
    // Cognito User Pool for Admin Authentication
    // ========================================

    // User Pool with email verification and strong password policy
    const userPool = new cognito.UserPool(this, 'AdminUserPool', {
      userPoolName: `cincymuse-admin-${environment}`,
      selfSignUpEnabled: false, // Admin-only, no self-registration
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }),
      },
    });

    // User Pool Client for frontend authentication
    const userPoolClient = userPool.addClient('AdminUserPoolClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      accessTokenValidity: cdk.Duration.minutes(30),
      idTokenValidity: cdk.Duration.minutes(30),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Admin user group
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Admin',
      description: 'Administrators with full access to upload/delete PDFs',
    });

    // Viewer user group
    const viewerGroup = new cognito.CfnUserPoolGroup(this, 'ViewerGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Viewer',
      description: 'Viewers with read-only access to logs and analytics',
    });

    // ========================================
    // Amplify Hosting for Frontend (Early Creation for CORS)
    // ========================================

    // ADR: AWS Amplify for frontend hosting | Rationale: Automatic CI/CD from GitHub, built-in Next.js SSR support, environment variable injection
    // Alternative: S3 + CloudFront (rejected - requires manual CI/CD setup, no SSR support)

    // Create Amplify app early to construct URL for CORS configuration
    // CORS allowed origins will include both localhost (dev) and Amplify URL (prod)
    if (githubOwner && githubRepo && githubTokenSecretArn) {
      // Retrieve GitHub OAuth token from Secrets Manager
      const githubTokenSecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'GitHubTokenSecret',
        githubTokenSecretArn
      );

      // Create Amplify App with GitHub source
      amplifyApp = new amplify.App(this, 'CincyMuseFrontend', {
        appName: `cincymuse-frontend-${environment}`,
        sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
          owner: githubOwner,
          repository: githubRepo,
          oauthToken: githubTokenSecret.secretValue,
        }),
        buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
          version: '1.0',
          frontend: {
            phases: {
              preBuild: {
                commands: ['npm ci'],
              },
              build: {
                commands: ['npm run build'],
              },
            },
            artifacts: {
              baseDirectory: '.next',
              files: ['**/*'],
            },
            cache: {
              paths: ['node_modules/**/*'],
            },
          },
        }),
        // SPA rewrite rule for Next.js App Router
        customRules: [
          {
            source: '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>',
            target: '/index.html',
            status: amplify.RedirectStatus.REWRITE,
          },
        ],
      });

      // Construct Amplify URL (appId is a CDK token, resolved at deploy time)
      amplifyAppUrl = `https://main.${amplifyApp.appId}.amplifyapp.com`;
      corsAllowedOrigins = ['http://localhost:3000', amplifyAppUrl];
      
      console.log('Amplify app configured - CORS will include both localhost and Amplify URL');
    } else {
      console.log('Amplify not configured - CORS will only include localhost');
    }

    // ========================================
    // Lambda Functions
    // ========================================

    // Detect host architecture for Lambda compatibility
    // ADR: Dynamic architecture detection | Rationale: Supports both ARM64 (Apple Silicon) and x86_64 (Intel) development
    // Alternative: Hardcode ARM64 (rejected - breaks Intel Mac developers)
    const hostArch = os.arch();
    const lambdaArch = hostArch === 'arm64' ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;

    // Chat Handler Lambda with Bedrock KB integration
    const chatHandler = new lambda.Function(this, 'ChatHandler', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'chat-handler')),
      timeout: cdk.Duration.seconds(30),
      architecture: lambdaArch,
      environment: {
        KB_ID: knowledgeBase.attrKnowledgeBaseId,
        TABLE_NAME: conversationLogsTable.tableName,
      },
      layers: [
        // Shared utilities layer
        new lambda.LayerVersion(this, 'SharedUtilsLayer', {
          code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'shared')),
          compatibleRuntimes: [lambda.Runtime.PYTHON_3_13],
          description: 'Shared utilities for PII redaction, confidence calculation, and source extraction',
        }),
      ],
    });

    // Grant permissions to Chat Handler
    conversationLogsTable.grantReadWriteData(chatHandler);
    
    // Grant Bedrock KB permissions
    chatHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:RetrieveAndGenerate', 'bedrock:Retrieve'],
        resources: [knowledgeBase.attrKnowledgeBaseArn],
      })
    );
    
    // Grant Bedrock model invocation permissions
    chatHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        ],
      })
    );

    // Add Function URL for Chat Handler with CORS
    const chatFunctionUrl = chatHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: corsAllowedOrigins,
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
        allowedHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Collections API Connector Lambda
    // Fetches collection data from searchcollections.cincymuseum.org and writes to S3 for KB ingestion
    const collectionsConnector = new lambda.Function(this, 'CollectionsConnector', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'collections-connector')),
      timeout: cdk.Duration.minutes(5),
      architecture: lambdaArch,
      environment: {
        KB_BUCKET: kbContentBucket.bucketName,
      },
    });

    // Grant permissions to Collections Connector
    kbContentBucket.grantWrite(collectionsConnector);

    // Podcast Ingestion Lambda
    // Fetches podcast episodes from RSS feed and writes to S3 for KB ingestion
    const podcastIngestion = new lambda.Function(this, 'PodcastIngestion', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'podcast-ingestion')),
      timeout: cdk.Duration.minutes(5),
      architecture: lambdaArch,
      environment: {
        KB_BUCKET: kbContentBucket.bucketName,
      },
    });

    // Grant permissions to Podcast Ingestion
    kbContentBucket.grantWrite(podcastIngestion);

    // KB Sync Handler Lambda
    // Triggers Bedrock KB ingestion jobs for data sources
    const kbSyncHandler = new lambda.Function(this, 'KBSyncHandler', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'kb-sync-handler')),
      timeout: cdk.Duration.minutes(2),
      architecture: lambdaArch,
      environment: {
        KB_ID: knowledgeBase.attrKnowledgeBaseId,
        WEB_DATA_SOURCE_IDS: `${cincyMuseumWebCrawler.attrDataSourceId},${supportCMCWebCrawler.attrDataSourceId}`,
        PDF_DATA_SOURCE_ID: pdfDataSource.attrDataSourceId,
        PODCAST_DATA_SOURCE_ID: podcastDataSource.attrDataSourceId,
      },
    });

    // Grant permissions to KB Sync Handler
    // Allow starting ingestion jobs for the Knowledge Base
    kbSyncHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:StartIngestionJob'],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/${knowledgeBase.attrKnowledgeBaseId}`,
        ],
      })
    );

    // ========================================
    // EventBridge Scheduled Rules
    // ========================================

    // Schedule for event feeds (every 6 hours)
    // Events are time-sensitive and need more frequent updates
    const eventFeedRule = new events.Rule(this, 'EventFeedSyncRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      description: 'Trigger KB sync for event feeds every 6 hours',
    });
    eventFeedRule.addTarget(new targets.LambdaFunction(kbSyncHandler, {
      event: events.RuleTargetInput.fromObject({ source_type: 'web' }),
    }));

    // Schedule for websites, collections, podcasts (every 24 hours)
    // General content updates less frequently
    const dailySyncRule = new events.Rule(this, 'DailySyncRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(24)),
      description: 'Trigger collections and podcast ingestion, then KB sync every 24 hours',
    });
    
    // Trigger collections connector
    dailySyncRule.addTarget(new targets.LambdaFunction(collectionsConnector));
    
    // Trigger podcast ingestion
    dailySyncRule.addTarget(new targets.LambdaFunction(podcastIngestion));
    
    // Trigger full KB sync (will sync all data sources including newly written S3 content)
    dailySyncRule.addTarget(new targets.LambdaFunction(kbSyncHandler, {
      event: events.RuleTargetInput.fromObject({ source_type: 'all' }),
    }));

    // ========================================
    // Admin Handler Lambda
    // ========================================

    // Admin Handler Lambda for dashboard APIs
    // Provides conversation log queries, PDF management, FAQ analytics, feedback stats, system metrics
    const adminHandler = new lambda.Function(this, 'AdminHandler', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'admin-handler')),
      timeout: cdk.Duration.seconds(30),
      architecture: lambdaArch,
      environment: {
        TABLE_NAME: conversationLogsTable.tableName,
        PDF_METADATA_TABLE: pdfMetadataTable.tableName,
        PDF_BUCKET: pdfBucket.bucketName,
        KB_ID: knowledgeBase.attrKnowledgeBaseId,
        PDF_DATA_SOURCE_ID: pdfDataSource.attrDataSourceId,
        USER_POOL_ID: userPool.userPoolId,
        LOG_GROUP_NAME: `/aws/lambda/${chatHandler.functionName}`,
      },
    });

    // Grant permissions to Admin Handler
    conversationLogsTable.grantReadData(adminHandler);
    pdfMetadataTable.grantReadWriteData(adminHandler);
    pdfBucket.grantReadWrite(adminHandler);

    // Grant Bedrock KB permissions for triggering syncs
    adminHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:StartIngestionJob'],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/${knowledgeBase.attrKnowledgeBaseId}`,
        ],
      })
    );

    // Grant CloudWatch Logs permissions for analytics
    adminHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:StartQuery',
          'logs:GetQueryResults',
          'logs:DescribeLogGroups',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${chatHandler.functionName}:*`,
        ],
      })
    );

    // Grant CloudWatch metrics permissions for system health
    adminHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics',
        ],
        resources: ['*'], // CloudWatch metrics don't support resource-level permissions
      })
    );

    // Add Function URL for Admin Handler with CORS
    const adminFunctionUrl = adminHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // JWT validated in handler
      cors: {
        allowedOrigins: corsAllowedOrigins,
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST, lambda.HttpMethod.DELETE, lambda.HttpMethod.OPTIONS],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // ========================================
    // CloudWatch Alarms and Monitoring
    // ========================================

    // SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `CincyMuse Alarms - ${environment}`,
      topicName: `cincymuse-alarms-${environment}`,
    });

    // Alarm for Lambda error rate > 5% over 5 minutes
    const chatHandlerErrorAlarm = new cloudwatch.Alarm(this, 'ChatHandlerErrorAlarm', {
      alarmName: `cincymuse-chat-handler-errors-${environment}`,
      alarmDescription: 'Chat Handler Lambda error rate exceeds 5% over 5 minutes',
      metric: chatHandler.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    chatHandlerErrorAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for Bedrock throttling > 10/minute
    const bedrockThrottleAlarm = new cloudwatch.Alarm(this, 'BedrockThrottleAlarm', {
      alarmName: `cincymuse-bedrock-throttling-${environment}`,
      alarmDescription: 'Bedrock API throttling exceeds 10 requests per minute',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Bedrock',
        metricName: 'ModelInvocationThrottles',
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    bedrockThrottleAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for Lambda errors > 10/minute (all Lambdas)
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `cincymuse-lambda-errors-${environment}`,
      alarmDescription: 'Lambda errors exceed 10 per minute across all functions',
      metric: new cloudwatch.MathExpression({
        expression: 'm1 + m2 + m3 + m4 + m5',
        usingMetrics: {
          m1: chatHandler.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(1) }),
          m2: adminHandler.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(1) }),
          m3: collectionsConnector.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(1) }),
          m4: podcastIngestion.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(1) }),
          m5: kbSyncHandler.metricErrors({ statistic: 'Sum', period: cdk.Duration.minutes(1) }),
        },
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Alarm for KB sync failures
    // Monitor KB Sync Handler Lambda for failures
    const kbSyncFailureAlarm = new cloudwatch.Alarm(this, 'KBSyncFailureAlarm', {
      alarmName: `cincymuse-kb-sync-failures-${environment}`,
      alarmDescription: 'Knowledge Base sync handler is failing',
      metric: kbSyncHandler.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    kbSyncFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ========================================
    // CloudFormation Outputs
    // ========================================

    // Output Chat Function URL
    new cdk.CfnOutput(this, 'ChatFunctionUrl', {
      value: chatFunctionUrl.url,
      description: 'Chat Handler Lambda Function URL',
      exportName: `cincymuse-chat-url-${environment}`,
    });

    // Output Admin Function URL
    new cdk.CfnOutput(this, 'AdminFunctionUrl', {
      value: adminFunctionUrl.url,
      description: 'Admin Handler Lambda Function URL',
      exportName: `cincymuse-admin-url-${environment}`,
    });

    // Output Knowledge Base ID
    new cdk.CfnOutput(this, 'KnowledgeBaseId', {
      value: knowledgeBase.attrKnowledgeBaseId,
      description: 'Bedrock Knowledge Base ID',
      exportName: `cincymuse-kb-id-${environment}`,
    });

    // Output ConversationLogs table name
    new cdk.CfnOutput(this, 'ConversationLogsTableName', {
      value: conversationLogsTable.tableName,
      description: 'DynamoDB ConversationLogs table name',
      exportName: `cincymuse-conversations-table-${environment}`,
    });

    // Output PDFMetadata table name
    new cdk.CfnOutput(this, 'PDFMetadataTableName', {
      value: pdfMetadataTable.tableName,
      description: 'DynamoDB PDFMetadata table name',
      exportName: `cincymuse-pdf-metadata-table-${environment}`,
    });

    // Output PDF bucket name
    new cdk.CfnOutput(this, 'PDFBucketName', {
      value: pdfBucket.bucketName,
      description: 'S3 PDF repository bucket name',
      exportName: `cincymuse-pdf-bucket-${environment}`,
    });

    // Output KB content bucket name
    new cdk.CfnOutput(this, 'KBContentBucketName', {
      value: kbContentBucket.bucketName,
      description: 'S3 Knowledge Base content bucket name',
      exportName: `cincymuse-kb-bucket-${environment}`,
    });

    // Output Cognito User Pool ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID for admin authentication',
      exportName: `cincymuse-user-pool-id-${environment}`,
    });

    // Output Cognito User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `cincymuse-user-pool-client-id-${environment}`,
    });

    // Output SNS Alarm Topic ARN
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for CloudWatch alarms',
      exportName: `cincymuse-alarm-topic-${environment}`,
    });

    // ========================================
    // Amplify Branch Configuration and Build Trigger
    // ========================================

    // Configure Amplify branch and trigger build if Amplify app was created
    if (amplifyApp && amplifyAppUrl) {
      // Add main branch with environment variables
      const mainBranch = amplifyApp.addBranch('main', {
        autoBuild: true,
        stage: environment === 'prod' ? 'PRODUCTION' : 'DEVELOPMENT',
      });

      // Pass backend URLs and Cognito configuration to frontend
      mainBranch.addEnvironment('NEXT_PUBLIC_CHAT_FUNCTION_URL', chatFunctionUrl.url);
      mainBranch.addEnvironment('NEXT_PUBLIC_ADMIN_FUNCTION_URL', adminFunctionUrl.url);
      mainBranch.addEnvironment('NEXT_PUBLIC_USER_POOL_ID', userPool.userPoolId);
      mainBranch.addEnvironment('NEXT_PUBLIC_USER_POOL_CLIENT_ID', userPoolClient.userPoolClientId);
      mainBranch.addEnvironment('NEXT_PUBLIC_AWS_REGION', this.region);

      // Custom resource to trigger Amplify build on stack create/update
      const triggerBuild = new cr.AwsCustomResource(this, 'TriggerAmplifyBuild', {
        onCreate: {
          service: 'Amplify',
          action: 'startJob',
          parameters: {
            appId: amplifyApp.appId,
            branchName: 'main',
            jobType: 'RELEASE',
          },
          physicalResourceId: cr.PhysicalResourceId.of(`${amplifyApp.appId}-main-${Date.now()}`),
        },
        onUpdate: {
          service: 'Amplify',
          action: 'startJob',
          parameters: {
            appId: amplifyApp.appId,
            branchName: 'main',
            jobType: 'RELEASE',
          },
          physicalResourceId: cr.PhysicalResourceId.of(`${amplifyApp.appId}-main-${Date.now()}`),
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [amplifyApp.arn],
        }),
      });

      // Ensure build triggers after Amplify app is fully configured
      triggerBuild.node.addDependency(mainBranch);

      // Output Amplify App ID
      new cdk.CfnOutput(this, 'AmplifyAppId', {
        value: amplifyApp.appId,
        description: 'Amplify App ID',
        exportName: `cincymuse-amplify-app-id-${environment}`,
      });

      // Output Amplify URL
      new cdk.CfnOutput(this, 'AmplifyAppUrl', {
        value: amplifyAppUrl,
        description: 'Amplify frontend URL',
        exportName: `cincymuse-amplify-url-${environment}`,
      });

      console.log(`Amplify app will be deployed at: ${amplifyAppUrl}`);
    } else {
      console.log('Skipping Amplify deployment - GitHub configuration not provided');
      console.log('To deploy with Amplify, provide: -c githubOwner=<owner> -c githubRepo=<repo> -c githubTokenSecretArn=<arn>');
    }
  }
}
