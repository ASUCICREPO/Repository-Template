# CIC Pattern Updates for CincyMuse Design

This document outlines the key updates needed to align the design with CIC architectural standards from the steering files.

## 1. API Architecture Change

**Current**: API Gateway with REST endpoints
**Updated**: Lambda Function URLs (simpler, built-in streaming support)

### Benefits:
- No API Gateway needed (simpler architecture, lower cost)
- Built-in HTTPS and CORS support
- Native SSE streaming support
- Direct Lambda invocation

### Implementation:
```typescript
// CDK Stack
const chatFunction = new lambda.Function(this, 'ChatFunction', {
  // ... config
});

const chatFunctionUrl = chatFunction.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: [amplifyAppUrl, 'http://localhost:3000'],
    allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
    allowedHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization'],
    maxAge: cdk.Duration.seconds(300),
  },
});

new cdk.CfnOutput(this, 'ChatFunctionUrl', {
  value: chatFunctionUrl.url,
  description: 'Chat Lambda Function URL'
});
```

## 2. Lambda Handler Pattern

**Key Requirements**:
- AWS clients at module level (reused across warm invocations)
- Use `os.environ.get()` never `[]`
- Validate env vars at start
- Consistent response shape with CORS headers
- `print()` for logging (CloudWatch captures stdout)
- Keep handlers thin
- Handle OPTIONS for CORS preflight

### Standard Handler Template:
```python
import json
import boto3
import os
from typing import Dict, Any

# AWS clients at module level
bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handler for Lambda Function URL"""
    
    # Validate environment variables
    table_name = os.environ.get('CONVERSATION_TABLE_NAME')
    if not table_name:
        return create_error_response(500, "Configuration error")
    
    try:
        # Handle OPTIONS for CORS preflight
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
            return create_cors_response(200, {})
        
        body = json.loads(event.get('body', '{}'))
        
        # Business logic here
        result = process_request(body)
        
        return create_cors_response(200, result)
        
    except ValueError as e:
        return create_error_response(400, str(e))
    except Exception as e:
        print(f"Error: {str(e)}")  # CloudWatch logging
        return create_error_response(500, str(e))

def create_cors_response(status_code: int, body: dict) -> dict:
    """Create response with CORS headers (required for ALL responses)"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Restrict to Amplify URL in production
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        'body': json.dumps(body)
    }

def create_error_response(status_code: int, error_message: str) -> dict:
    """Create error response with CORS headers"""
    return create_cors_response(status_code, {'error': error_message})
```

## 3. CDK Lambda Configuration

**Key Requirements**:
- Python 3.13+ runtime
- Detect host architecture dynamically (ARM64/x86_64 compatibility)
- Explicit timeout
- Pass resource names via environment (not ARNs)

### Standard Lambda Definition:
```typescript
import * as os from 'os';
import * as path from 'path';

const hostArch = os.arch();
const lambdaArch = hostArch === "arm64" 
  ? lambda.Architecture.ARM_64 
  : lambda.Architecture.X86_64;

const chatFunction = new lambda.Function(this, "ChatFunction", {
  runtime: lambda.Runtime.PYTHON_3_13,
  handler: "index.lambda_handler",
  code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda", "chat")),
  timeout: cdk.Duration.minutes(5),
  architecture: lambdaArch,
  environment: {
    CONVERSATION_TABLE_NAME: conversationTable.tableName,
    OPENSEARCH_ENDPOINT: opensearchCollection.attrCollectionEndpoint,
    // Pass names, not ARNs
  },
});
```

## 4. Session ID Format

**Requirement**: Minimum 33 characters for AWS AgentCore compatibility

### Implementation:
```typescript
// Frontend
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  let sessionId = `session_${timestamp}_${random1}${random2}`;
  
  // Ensure minimum 33 characters
  while (sessionId.length < 33) {
    sessionId += Math.random().toString(36).substring(2, 1);
  }
  
  return sessionId;
}

// Store in sessionStorage (cleared on tab close)
const SESSION_KEY = 'cincymuse_session_id';
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
```

## 5. SSE Streaming Event Types

**Standard Event Types** (from CIC patterns):
- `text-delta` / `content`: Incremental text → append to message
- `thinking` / `reasoning-delta`: Agent reasoning → collapsible block
- `tool-input-available`: Tool start → show loading
- `tool-output-available`: Tool results → parse and display
- `sources` / `citations`: References → citation list
- `finish` / `final_result`: Completion → end streaming
- `error`: Error → show error message

### Frontend Handler:
```typescript
const handleStreamEvent = (event: StreamEvent) => {
  switch (event.type) {
    case 'text-delta':
    case 'content':
      appendToMessage(event.data);
      break;
    case 'thinking':
    case 'reasoning-delta':
      updateThinkingBlock(event.data);
      break;
    case 'sources':
    case 'citations':
      displayCitations(event.data);
      break;
    case 'finish':
    case 'final_result':
      completeMessage();
      break;
    case 'error':
      handleError(event.error);
      break;
  }
};
```

## 6. DynamoDB Configuration

**Requirements**:
- `PAY_PER_REQUEST` billing mode
- Point-in-time recovery enabled
- Encryption enabled (AWS managed)
- `RETAIN` removal policy for user data
- Use CDK grant methods

### Standard Table Definition:
```typescript
const conversationTable = new dynamodb.Table(this, "ConversationLogs", {
  partitionKey: { name: "conversationId", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,  // DESTROY only for dev
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  timeToLiveAttribute: 'ttl',  // For 90-day retention
});

// Use grant methods (not manual IAM policies)
conversationTable.grantReadWriteData(chatFunction);
```

## 7. S3 Configuration

**Requirements**:
- Always `enforceSSL: true`
- Block public access
- Encryption enabled
- Add CORS only when frontend needs direct access
- Use CDK grant methods

### Standard Bucket Definition:
```typescript
const pdfBucket = new s3.Bucket(this, "PDFRepository", {
  bucketName: `cincymuse-pdfs-${cdk.Aws.ACCOUNT_ID}`,
  enforceSSL: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  versioned: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  cors: [
    {
      allowedOrigins: [amplifyAppUrl, 'http://localhost:3000'],
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
      allowedHeaders: ['*'],
      maxAge: 3000,
    },
  ],
});

// Use grant methods
pdfBucket.grantRead(chatFunction);
pdfBucket.grantReadWrite(adminFunction);
```

## 8. Amplify Configuration

**Requirements**:
- Include SPA rewrite rule (catch-all → index.html)
- Construct `amplifyAppUrl` from `appId` for CORS
- Pass backend URLs via `addEnvironment`
- Auto-trigger build on deploy

### Standard Amplify Setup:
```typescript
const githubToken = this.node.tryGetContext("githubToken");
if (!githubToken) throw new Error("Missing githubToken context variable");

const githubTokenSecret = secretsmanager.Secret.fromSecretNameV2(
  this, "GitHubToken", githubToken
);

const amplifyApp = new amplify.App(this, "CincyMuseFrontend", {
  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
    owner: "your-org",
    repository: "cincymuse-frontend",
    oauthToken: githubTokenSecret.secretValue,
  }),
  customRules: [
    {
      source: "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
      target: "/index.html",
      status: amplify.RedirectStatus.REWRITE,
    },
  ],
});

const mainBranch = amplifyApp.addBranch("main");

// Construct Amplify URL for CORS
const amplifyAppUrl = `https://main.${amplifyApp.appId}.amplifyapp.com`;

// Pass backend URLs to frontend
mainBranch.addEnvironment('NEXT_PUBLIC_CHAT_URL', chatFunctionUrl.url);
mainBranch.addEnvironment('NEXT_PUBLIC_ADMIN_URL', adminFunctionUrl.url);

// Auto-trigger build on deploy
new cr.AwsCustomResource(this, "TriggerAmplifyBuild", {
  onCreate: {
    service: "Amplify",
    action: "startJob",
    parameters: {
      appId: amplifyApp.appId,
      branchName: "main",
      jobType: "RELEASE",
    },
    physicalResourceId: cr.PhysicalResourceId.of(`${amplifyApp.appId}-main-${Date.now()}`),
  },
  onUpdate: {
    service: "Amplify",
    action: "startJob",
    parameters: {
      appId: amplifyApp.appId,
      branchName: "main",
      jobType: "RELEASE",
    },
    physicalResourceId: cr.PhysicalResourceId.of(`${amplifyApp.appId}-main-${Date.now()}`),
  },
  policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    resources: [amplifyApp.arn],
  }),
});
```

## 9. IAM Security

**Requirements**:
- Use CDK grant methods first
- For Bedrock: explicit policy with specific model ARNs (never wildcard)
- Least privilege always
- No `Action: "*"` or `Resource: "*"`

### Bedrock Permissions:
```typescript
// Correct: Specific model ARNs
chatFunction.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'bedrock:InvokeModel',
    'bedrock:InvokeModelWithResponseStream',
  ],
  resources: [
    `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/amazon.titan-embed-text-v1`,
    `arn:aws:bedrock:${cdk.Aws.REGION}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
  ],
}));

// WRONG: Wildcard
// actions: ['bedrock:*'],  // Never do this
// resources: ['*'],  // Never do this
```

## 10. Security Scanning with cdk-nag

**Requirement**: Integrate cdk-nag for security validation

### Installation:
```bash
cd backend
npm install cdk-nag
```

### Integration (backend/bin/backend.ts):
```typescript
import { App, Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { CincyMuseStack } from '../lib/cincymuse-stack';

const app = new App();
const stack = new CincyMuseStack(app, 'CincyMuseStack');

// Add security checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// Suppress findings with justification
NagSuppressions.addResourceSuppressions(
  stack,
  [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'AWS managed policy required for CloudWatch Logs. See ADR in architectureDeepDive.md',
    },
  ],
  true  // Apply to all resources in stack
);

app.synth();
```

## 11. Error Handling & Resilience

**Requirements**:
- Structured logging with JSON
- DLQs for all async processes
- Retry with exponential backoff
- CloudWatch alarms

### Retry Pattern:
```python
import time
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        print(f"Function {func.__name__} failed after {max_retries} attempts: {str(e)}")
                        raise
                    
                    delay = base_delay * (2 ** attempt)
                    print(f"Attempt {attempt + 1} failed, retrying in {delay}s: {str(e)}")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_with_backoff(max_retries=3, base_delay=1)
def query_opensearch(query_vector):
    # Implementation
    pass
```

### DLQ Configuration:
```typescript
const dlq = new sqs.Queue(this, 'PDFProcessingDLQ', {
  queueName: 'cincymuse-pdf-processing-dlq',
  retentionPeriod: cdk.Duration.days(14),
});

pdfBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(pdfProcessorFunction, {
    deadLetterQueue: dlq,
  })
);
```

## 12. CfnOutput for All Resources

**Requirement**: Export every resource frontend/other stacks consume

### Standard Outputs:
```typescript
new cdk.CfnOutput(this, 'ChatFunctionUrl', {
  value: chatFunctionUrl.url,
  description: 'Chat Lambda Function URL',
});

new cdk.CfnOutput(this, 'AdminFunctionUrl', {
  value: adminFunctionUrl.url,
  description: 'Admin Lambda Function URL',
});

new cdk.CfnOutput(this, 'AmplifyAppUrl', {
  value: amplifyAppUrl,
  description: 'Amplify Frontend URL',
});

new cdk.CfnOutput(this, 'ConversationTableName', {
  value: conversationTable.tableName,
  description: 'DynamoDB Conversation Logs Table',
});

new cdk.CfnOutput(this, 'PDFBucketName', {
  value: pdfBucket.bucketName,
  description: 'S3 PDF Repository Bucket',
});
```

## Summary of Key Changes

1. **API Gateway → Lambda Function URLs** (simpler, built-in streaming)
2. **FastAPI → Standard Lambda handler** (CIC pattern with CORS)
3. **Dynamic architecture detection** (ARM64/x86_64 compatibility)
4. **Session ID format** (33+ characters for AWS AgentCore)
5. **SSE event types** (standardized: text-delta, thinking, finish, error)
6. **DynamoDB PAY_PER_REQUEST** (with point-in-time recovery)
7. **S3 enforceSSL** (always true)
8. **Amplify SPA rewrite rule** (catch-all → index.html)
9. **CDK grant methods** (instead of manual IAM policies)
10. **cdk-nag integration** (security validation)
11. **Structured error handling** (with DLQs and retry logic)
12. **CfnOutput for all resources** (frontend consumption)

These patterns ensure the implementation follows CIC architectural standards for security, maintainability, and operational excellence.
