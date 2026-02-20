import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
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
    const githubToken = this.node.tryGetContext('githubToken');

    // Log configuration
    console.log(`Deploying CincyMuse Backend for environment: ${environment}`);
    
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
          allowedOrigins: ['http://localhost:3000'], // Will add Amplify URL later
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
    new bedrock.CfnDataSource(this, 'CincyMuseumWebCrawler', {
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
    new bedrock.CfnDataSource(this, 'SupportCMCWebCrawler', {
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
    new bedrock.CfnDataSource(this, 'PDFDataSource', {
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
    new bedrock.CfnDataSource(this, 'PodcastDataSource', {
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
        AWS_REGION: this.region,
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

    // Add Function URL for Chat Handler
    const chatFunctionUrl = chatHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['http://localhost:3000'], // Will add Amplify URL later
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
        allowedHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });
    
    // Infrastructure resources will be added in subsequent tasks
    // Task 3: S3 buckets
    // Task 4: Bedrock Knowledge Base
    // Task 5: Cognito User Pool
    // Tasks 7-15: Lambda functions
    // Task 17: CloudWatch alarms
    // Task 27: Amplify deployment
  }
}
