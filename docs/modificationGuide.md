# Project Modification Guide

This guide is for developers who want to extend, customize, or modify the CincyMuse Chatbot.

---

## Introduction

This document provides guidance on how to modify and extend the CincyMuse Chatbot. Whether you want to add new features, change existing behavior, or customize the application for your needs, this guide will help you understand the codebase and make changes effectively.

---

## Table of Contents

- [Project Structure Overview](#project-structure-overview)
- [Frontend Modifications](#frontend-modifications)
- [Backend Modifications](#backend-modifications)
- [Adding New Features](#adding-new-features)
- [Changing AI/ML Models](#changing-aiml-models)
- [Database Modifications](#database-modifications)
- [Best Practices](#best-practices)

---

## Project Structure Overview

```
cincymuse-chatbot/
├── backend/
│   ├── bin/backend.ts                    # CDK app entry point
│   ├── lib/backend-stack.ts              # Infrastructure definitions (DynamoDB, Lambda, Bedrock, etc.)
│   ├── lambda/
│   │   ├── chat-handler/                 # Chat API Lambda
│   │   │   ├── index.py                  # Main handler
│   │   │   └── requirements.txt
│   │   ├── admin-handler/                # Admin dashboard API Lambda
│   │   │   ├── index.py
│   │   │   └── requirements.txt
│   │   ├── collections-connector/        # Collections API sync Lambda
│   │   ├── podcast-ingestion/            # Podcast RSS sync Lambda
│   │   ├── kb-sync-handler/              # Knowledge Base sync trigger Lambda
│   │   └── shared/                       # Shared utilities layer
│   │       └── pii_redactor.py           # PII redaction utilities
│   ├── cdk.json                          # CDK configuration
│   ├── package.json                      # CDK dependencies
│   └── tsconfig.json                     # TypeScript config
├── frontend/
│   ├── app/
│   │   ├── page.tsx                      # Chat interface (home page)
│   │   ├── admin/
│   │   │   └── page.tsx                  # Admin dashboard page
│   │   ├── layout.tsx                    # Root layout with i18n
│   │   ├── globals.css                   # Global styles (Tailwind)
│   │   └── AmplifyConfigProvider.tsx     # Cognito auth config
│   ├── components/
│   │   ├── ChatContainer.tsx             # Main chat UI component
│   │   ├── MessageInput.tsx              # Chat input with language selector
│   │   ├── admin/
│   │   │   ├── ConversationLogs.tsx      # Conversation logs viewer
│   │   │   ├── PDFManager.tsx            # PDF upload/delete UI
│   │   │   ├── FeedbackReview.tsx        # Feedback analytics
│   │   │   └── SystemHealth.tsx          # CloudWatch metrics dashboard
│   │   └── ...
│   ├── lib/                              # Utility functions
│   ├── public/                           # Static assets
│   ├── package.json                      # Frontend dependencies
│   └── tailwind.config.ts                # Tailwind CSS configuration
└── docs/                                 # Documentation
```

---

## Frontend Modifications

### Changing the UI Theme

**Location**: `frontend/app/globals.css` and `frontend/tailwind.config.ts`

The CincyMuse chatbot uses Tailwind CSS for styling with a custom color palette.

**To change colors**:

1. Edit `frontend/tailwind.config.ts`:
```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#your-primary-color',    // Main brand color
        secondary: '#your-secondary-color', // Accent color
        background: '#your-bg-color',       // Background
        foreground: '#your-text-color',     // Text color
      },
    },
  },
}
```

2. Update CSS variables in `frontend/app/globals.css`:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
}
```

**To change fonts**:

1. Import font in `frontend/app/layout.tsx`:
```typescript
import { Inter, Roboto } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

2. Apply to body: `<body className={inter.className}>`

### Adding New Pages

**Location**: `frontend/app/`

Next.js 15 uses the App Router with file-based routing.

**Example: Add a "Help" page**

1. Create directory: `frontend/app/help/`
2. Create page file: `frontend/app/help/page.tsx`
```typescript
export default function HelpPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Help Center</h1>
      <p>Frequently asked questions and support information.</p>
    </div>
  );
}
```
3. Access at: `https://your-domain.com/help`

**With dynamic routes**:

Create `frontend/app/help/[topic]/page.tsx`:
```typescript
export default function HelpTopicPage({ params }: { params: { topic: string } }) {
  return <div>Help topic: {params.topic}</div>;
}
```

### Modifying Components

**Location**: `frontend/components/`

**Example: Modify ChatContainer.tsx to add a welcome message**

1. Open `frontend/components/ChatContainer.tsx`
2. Add state for welcome message:
```typescript
const [showWelcome, setShowWelcome] = useState(true);
```
3. Add welcome UI before message list:
```typescript
{showWelcome && (
  <div className="bg-blue-50 p-4 rounded-lg mb-4">
    <h2 className="text-xl font-bold">Welcome to CincyMuse!</h2>
    <p>Ask me anything about the museum.</p>
    <button onClick={() => setShowWelcome(false)}>Got it</button>
  </div>
)}
```

**Example: Add a new admin dashboard tab**

1. Create component: `frontend/components/admin/NewFeature.tsx`
```typescript
export function NewFeature() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">New Feature</h2>
      {/* Your feature UI */}
    </div>
  );
}
```

2. Import in `frontend/app/admin/page.tsx`:
```typescript
import { NewFeature } from '@/components/admin/NewFeature';
```

3. Add tab to dashboard:
```typescript
<Tabs defaultValue="logs">
  <TabsList>
    <TabsTrigger value="logs">Logs</TabsTrigger>
    <TabsTrigger value="pdfs">PDFs</TabsTrigger>
    <TabsTrigger value="new">New Feature</TabsTrigger>
  </TabsList>
  <TabsContent value="new">
    <NewFeature />
  </TabsContent>
</Tabs>
```

---

## Backend Modifications

### Adding New Lambda Functions

**Location**: `backend/lambda/`

**Example: Add a "Notification Handler" Lambda**

1. Create directory: `backend/lambda/notification-handler/`

2. Create handler: `backend/lambda/notification-handler/index.py`
```python
import json
import os
import boto3

# AWS clients at module level for reuse
sns = boto3.client('sns')

def lambda_handler(event, context):
    """Send notifications to users."""
    topic_arn = os.environ.get('TOPIC_ARN')
    if not topic_arn:
        return {'statusCode': 500, 'body': json.dumps({'error': 'TOPIC_ARN not set'})}
    
    try:
        message = event.get('message', '')
        sns.publish(TopicArn=topic_arn, Message=message)
        return {'statusCode': 200, 'body': json.dumps({'status': 'sent'})}
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
```

3. Create dependencies: `backend/lambda/notification-handler/requirements.txt`
```
boto3>=1.28.0
```

4. Add to CDK stack in `backend/lib/backend-stack.ts`:
```typescript
import * as os from 'os';
import * as path from 'path';

// Detect architecture
const hostArch = os.arch();
const lambdaArch = hostArch === 'arm64' ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;

// Create SNS topic
const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
  displayName: 'CincyMuse Notifications',
});

// Create Lambda function
const notificationHandler = new lambda.Function(this, 'NotificationHandler', {
  runtime: lambda.Runtime.PYTHON_3_13,
  handler: 'index.lambda_handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'notification-handler')),
  timeout: cdk.Duration.seconds(30),
  architecture: lambdaArch,
  environment: {
    TOPIC_ARN: notificationTopic.topicArn,
  },
});

// Grant permissions
notificationTopic.grantPublish(notificationHandler);

// Add Function URL (optional)
const notificationUrl = notificationHandler.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: corsAllowedOrigins,
    allowedMethods: [lambda.HttpMethod.POST],
  },
});

// Output URL
new cdk.CfnOutput(this, 'NotificationFunctionUrl', {
  value: notificationUrl.url,
  description: 'Notification Handler Function URL',
});
```

5. Deploy: `cd backend && cdk deploy`

### Modifying the CDK Stack

**Location**: `backend/lib/backend-stack.ts`

**Example: Add a new DynamoDB table**

```typescript
// Add after existing tables
const feedbackTable = new dynamodb.Table(this, 'FeedbackTable', {
  partitionKey: { name: 'feedbackId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
});

// Grant access to Lambda
feedbackTable.grantReadWriteData(chatHandler);

// Pass table name to Lambda
chatHandler.addEnvironment('FEEDBACK_TABLE', feedbackTable.tableName);

// Output table name
new cdk.CfnOutput(this, 'FeedbackTableName', {
  value: feedbackTable.tableName,
  description: 'Feedback DynamoDB table name',
});
```

**Example: Add a new S3 bucket**

```typescript
const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
  enforceSSL: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  lifecycleRules: [
    {
      expiration: cdk.Duration.days(90), // Auto-delete after 90 days
    },
  ],
});

// Grant access
reportsBucket.grantReadWrite(adminHandler);
```

### Adding New API Endpoints

**Option 1: Add route to existing Lambda**

Modify `backend/lambda/admin-handler/index.py`:

```python
def lambda_handler(event, context):
    path = event.get('rawPath', '')
    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    
    # Add new route
    if path == '/reports' and method == 'GET':
        return handle_reports(event)
    elif path == '/conversations' and method == 'GET':
        return handle_conversations(event)
    # ... existing routes

def handle_reports(event):
    """New endpoint handler."""
    # Your logic here
    return create_response(200, {'reports': []})
```

**Option 2: Create new Lambda with Function URL** (see "Adding New Lambda Functions" above)

---

## Adding New Features

### Feature: Add Multi-Language Support (Beyond English/Spanish)

**Files to modify**:
- `backend/lambda/chat-handler/index.py` - Add language prompts
- `frontend/components/MessageInput.tsx` - Add language selector options
- `frontend/app/layout.tsx` - Add i18n configuration

**Steps**:

1. **Add language to backend prompts** (`backend/lambda/chat-handler/index.py`):
```python
system_prompts = {
    'en': 'You are CincyMuse, a helpful assistant...',
    'es': 'Eres CincyMuse, un asistente útil...',
    'fr': 'Vous êtes CincyMuse, un assistant utile...', # New French prompt
}

fallback_messages = {
    'en': "You've asked a great question...",
    'es': "Has hecho una gran pregunta...",
    'fr': "Vous avez posé une excellente question...", # New French fallback
}
```

2. **Update language validation**:
```python
language = body.get('language', 'en')
if language not in ['en', 'es', 'fr']:  # Add 'fr'
    return create_response(400, {'error': 'Language must be "en", "es", or "fr"'})
```

3. **Add language option to frontend** (`frontend/components/MessageInput.tsx`):
```typescript
<select value={language} onChange={(e) => setLanguage(e.target.value)}>
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="fr">Français</option>
</select>
```

4. **Deploy**: `cd backend && cdk deploy`

### Feature: Add Email Notifications for Admin Alerts

**Files to modify**:
- `backend/lib/backend-stack.ts` - Add SNS email subscription
- `backend/lambda/admin-handler/index.py` - Add notification trigger

**Steps**:

1. **Add email subscription to SNS topic** (`backend/lib/backend-stack.ts`):
```typescript
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// After creating alarmTopic
alarmTopic.addSubscription(
  new subscriptions.EmailSubscription('[email]')
);
```

2. **Deploy and confirm subscription**:
```bash
cd backend
cdk deploy
# Check email for confirmation link
```

3. **Add custom notification trigger** (optional):
```typescript
// In admin-handler Lambda
import boto3
sns = boto3.client('sns')

def send_admin_alert(message: str):
    topic_arn = os.environ.get('ALARM_TOPIC_ARN')
    sns.publish(
        TopicArn=topic_arn,
        Subject='CincyMuse Admin Alert',
        Message=message
    )
```

### Feature: Add Conversation Export (CSV Download)

**Files to modify**:
- `backend/lambda/admin-handler/index.py` - Add export endpoint
- `frontend/components/admin/ConversationLogs.tsx` - Add export button

**Steps**:

1. **Add export handler** (`backend/lambda/admin-handler/index.py`):
```python
import csv
from io import StringIO

def handle_export_conversations(event):
    """Export conversations as CSV."""
    table = dynamodb.Table(os.environ.get('TABLE_NAME'))
    
    # Query conversations
    response = table.scan()
    items = response.get('Items', [])
    
    # Generate CSV
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=['conversationId', 'timestamp', 'question', 'response', 'language', 'confidence'])
    writer.writeheader()
    writer.writerows(items)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=conversations.csv',
        },
        'body': output.getvalue(),
    }
```

2. **Add route**:
```python
if path == '/export' and method == 'GET':
    return handle_export_conversations(event)
```

3. **Add export button** (`frontend/components/admin/ConversationLogs.tsx`):
```typescript
<button
  onClick={() => {
    window.location.href = `${adminApiUrl}/export`;
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Export CSV
</button>
```

---

## Changing AI/ML Models

### Switching Bedrock Models

**Location**: `backend/lib/backend-stack.ts` and `backend/lambda/chat-handler/index.py`

The chatbot currently uses **Claude 3 Sonnet** for response generation. You can switch to other Bedrock models.

**Available models**:
- `anthropic.claude-3-sonnet-20240229-v1:0` (current - balanced performance/cost)
- `anthropic.claude-3-haiku-20240307-v1:0` (faster, cheaper, less capable)
- `anthropic.claude-3-opus-20240229-v1:0` (most capable, slower, expensive)
- `anthropic.claude-3-5-sonnet-20240620-v1:0` (latest, improved reasoning)

**Steps to switch models**:

1. **Update CDK stack** (`backend/lib/backend-stack.ts`):

Find the Knowledge Base configuration (around line 150):
```typescript
knowledgeBaseConfiguration: {
  knowledgeBaseId: KB_ID,
  modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0', // Changed
  // ... rest of config
}
```

2. **Update IAM permissions** (around line 440):
```typescript
chatHandler.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0`, // Changed
    ],
  })
);
```

3. **Update Lambda handler** (`backend/lambda/chat-handler/index.py`):
```python
response = bedrock_agent_runtime.retrieve_and_generate(
    input={'text': message},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': KB_ID,
            'modelArn': f'arn:aws:bedrock:{REGION}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0', # Changed
            # ... rest of config
        },
    },
)
```

4. **Deploy**: `cd backend && cdk deploy`

**Cost considerations**:
- Haiku: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
- Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Opus: ~$15 per 1M input tokens, ~$75 per 1M output tokens

### Modifying Prompts

**Location**: `backend/lambda/chat-handler/index.py`

Prompts control the chatbot's behavior and response style.

**Current prompts** (around line 60):
```python
system_prompts = {
    'en': 'You are CincyMuse, a helpful assistant for Cincinnati Museum Center. Provide accurate, friendly responses about exhibits, collections, events, tickets, memberships, and support opportunities. Keep responses concise and informative.',
    'es': 'Eres CincyMuse, un asistente útil para el Cincinnati Museum Center. Proporciona respuestas precisas y amigables sobre exhibiciones, colecciones, eventos, boletos, membresías y oportunidades de apoyo. Mantén las respuestas concisas e informativas.',
}
```

**Example modifications**:

**Make responses more detailed**:
```python
system_prompts = {
    'en': 'You are CincyMuse, an expert guide for Cincinnati Museum Center. Provide comprehensive, engaging responses with specific details about exhibits, collections, events, tickets, memberships, and support opportunities. Include relevant dates, prices, and locations when available.',
}
```

**Add personality**:
```python
system_prompts = {
    'en': 'You are CincyMuse, an enthusiastic and knowledgeable assistant for Cincinnati Museum Center! Share your passion for history, science, and culture while providing accurate information about exhibits, collections, events, tickets, and memberships. Use a warm, conversational tone.',
}
```

**Add response format instructions**:
```python
system_prompts = {
    'en': '''You are CincyMuse, a helpful assistant for Cincinnati Museum Center.

Response format:
- Start with a direct answer
- Provide 2-3 supporting details
- End with a call-to-action (visit, call, or explore)
- Keep responses under 150 words

Topics: exhibits, collections, events, tickets, memberships, support opportunities.''',
}
```

**Deploy changes**: `cd backend && cdk deploy --hotswap` (faster for Lambda-only changes)

### Adjusting Confidence Threshold

**Location**: `backend/lambda/chat-handler/index.py`

The chatbot uses a confidence threshold (0.7) to determine when to show a fallback message.

**Current logic** (around line 110):
```python
if confidence < 0.7:
    fallback_messages = {
        'en': "You've asked a great question, but it's one I don't have the details for just yet. For the most accurate information, please contact our team at (513) 287-7000.",
        'es': "Has hecho una gran pregunta, pero es una para la que aún no tengo los detalles. Para obtener la información más precisa, comunícate con nuestro equipo al (513) 287-7000.",
    }
    output_text = fallback_messages[language]
    sources = []
```

**To make more conservative** (fewer fallbacks, more AI responses):
```python
if confidence < 0.5:  # Lower threshold
```

**To make more cautious** (more fallbacks, fewer uncertain responses):
```python
if confidence < 0.85:  # Higher threshold
```

**To add confidence tiers**:
```python
if confidence < 0.5:
    # Very low confidence - fallback
    output_text = fallback_messages[language]
elif confidence < 0.7:
    # Medium confidence - add disclaimer
    output_text = f"⚠️ I'm not entirely certain, but here's what I found:\n\n{output_text}"
else:
    # High confidence - use as-is
    pass
```

---

## Database Modifications

### Adding New DynamoDB Tables

**Location**: `backend/lib/backend-stack.ts`

**Example: Add a "UserPreferences" table**

```typescript
// Add after existing tables (around line 80)
const userPreferencesTable = new dynamodb.Table(this, 'UserPreferencesTable', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true,
});

// Grant access to Lambda
userPreferencesTable.grantReadWriteData(chatHandler);

// Pass table name to Lambda
chatHandler.addEnvironment('PREFERENCES_TABLE', userPreferencesTable.tableName);

// Output table name
new cdk.CfnOutput(this, 'UserPreferencesTableName', {
  value: userPreferencesTable.tableName,
  description: 'User preferences table name',
});
```

**Deploy**: `cd backend && cdk deploy`

### Adding Global Secondary Indexes (GSI)

**Example: Add a GSI to query conversations by confidence score**

```typescript
// Add to existing ConversationLogs table
conversationLogsTable.addGlobalSecondaryIndex({
  indexName: 'ConfidenceIndex',
  partitionKey: { name: 'confidence', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});
```

**Query using GSI** (in Lambda):
```python
table = dynamodb.Table(TABLE_NAME)
response = table.query(
    IndexName='ConfidenceIndex',
    KeyConditionExpression='confidence = :conf',
    ExpressionAttributeValues={':conf': 'low'}
)
```

### Modifying Table Schema

**Adding new attributes** (no schema change needed - DynamoDB is schemaless):

Just start writing the new attribute in your Lambda code:
```python
table.put_item(
    Item={
        'conversationId': conversation_id,
        'timestamp': timestamp,
        'question': question,
        'response': response,
        'newAttribute': 'new_value',  # New attribute
    }
)
```

**Changing partition/sort keys** (requires new table):

1. Create new table with desired keys
2. Migrate data using DynamoDB Streams or batch write
3. Update Lambda environment variables
4. Delete old table

**Example migration script**:
```python
import boto3

dynamodb = boto3.resource('dynamodb')
old_table = dynamodb.Table('OldTable')
new_table = dynamodb.Table('NewTable')

# Scan old table
response = old_table.scan()
items = response['Items']

# Write to new table
with new_table.batch_writer() as batch:
    for item in items:
        batch.put_item(Item=item)
```

### Adding Time-to-Live (TTL)

**Enable TTL for automatic data expiration**:

```typescript
const logsTable = new dynamodb.Table(this, 'LogsTable', {
  // ... other config
  timeToLiveAttribute: 'ttl',  // Attribute name for TTL
});
```

**Set TTL in Lambda** (Unix timestamp):
```python
from datetime import datetime, timedelta

# Expire after 90 days
ttl = int((datetime.utcnow() + timedelta(days=90)).timestamp())

table.put_item(
    Item={
        'id': 'item-123',
        'data': 'some data',
        'ttl': ttl,  # DynamoDB will auto-delete when current time > ttl
    }
)
```

---

## Best Practices

1. **Test locally before deploying**
   - Use `cdk synth` to validate CDK changes without deploying
   - Test Lambda functions locally with sample events
   - Run frontend locally: `cd frontend && npm run dev`

2. **Use environment variables** - Never hardcode values
   ```typescript
   // ❌ Bad
   const apiUrl = 'https://abc123.lambda-url.us-east-1.on.aws/';
   
   // ✅ Good
   const apiUrl = process.env.NEXT_PUBLIC_CHAT_FUNCTION_URL;
   ```

3. **Follow existing patterns** - Maintain consistency
   - Lambda handlers: Always `lambda_handler(event, context)`
   - CDK constructs: Use PascalCase (`MyTable`, `ChatHandler`)
   - Python files: Use snake_case (`pii_redactor.py`)
   - TypeScript files: Use camelCase (`chatHandler.ts`)

4. **Update documentation** - Keep docs in sync with code
   - Update `docs/APIDoc.md` when adding endpoints
   - Update `docs/architectureDeepDive.md` for architectural changes
   - Add ADRs for significant decisions

5. **Version control** - Make small, focused commits
   ```bash
   git add backend/lambda/chat-handler/index.py
   git commit -m "feat: add confidence threshold adjustment"
   ```

6. **Security first**
   - Use CDK grant methods: `table.grantReadWriteData(fn)`
   - Never use wildcard IAM permissions: `Action: "*"`
   - Redact PII from logs
   - Enable encryption on all data stores

7. **Cost optimization**
   - Use ARM64 Lambda architecture (20% cheaper)
   - Set appropriate Lambda timeouts (don't use default 3s or max 15min)
   - Use DynamoDB on-demand billing for variable workloads
   - Enable S3 lifecycle policies for old data

8. **Monitor and alert**
   - Add CloudWatch alarms for new critical functions
   - Use structured logging (JSON) for easier querying
   - Set up SNS email notifications for production alarms

---

## Testing Your Changes

### Local Testing

**Frontend**:
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

**Backend (CDK synthesis)**:
```bash
cd backend
npm install
cdk synth  # Validates CDK code without deploying
```

**Lambda function testing** (local invocation):

Create test event: `backend/lambda/chat-handler/test-event.json`
```json
{
  "body": "{\"message\": \"What are the museum hours?\", \"language\": \"en\"}"
}
```

Test locally (requires AWS credentials):
```bash
cd backend/lambda/chat-handler
python3 -c "
import json
from index import lambda_handler
with open('test-event.json') as f:
    event = json.load(f)
result = lambda_handler(event, None)
print(json.dumps(result, indent=2))
"
```

### Deployment Testing

**Hotswap deployment** (faster for Lambda-only changes):
```bash
cd backend
cdk deploy --hotswap
# Skips CloudFormation for Lambda code updates
```

**Full deployment**:
```bash
cd backend
cdk deploy
# Deploys all infrastructure changes
```

**Diff before deploying** (see what will change):
```bash
cd backend
cdk diff
# Shows resource additions, modifications, deletions
```

### Integration Testing

**Test chat API**:
```bash
curl -X POST https://your-chat-function-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the museum hours?", "language": "en"}'
```

**Test admin API** (requires JWT token):
```bash
# Get token from Cognito (use AWS Console or Amplify UI)
TOKEN="your-jwt-token"

curl -X GET https://your-admin-function-url.lambda-url.us-east-1.on.aws/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### Monitoring Deployments

**Check CloudWatch Logs**:
```bash
# View recent logs
aws logs tail /aws/lambda/CincyMuse-ChatHandler --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/CincyMuse-ChatHandler \
  --filter-pattern "ERROR"
```

**Check CloudWatch Metrics**:
```bash
# Lambda invocations (last hour)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=CincyMuse-ChatHandler \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

---

## Conclusion

The CincyMuse chatbot is designed to be extensible and maintainable. The serverless architecture allows you to add features without managing infrastructure, and the modular codebase makes it easy to modify specific components.

**Key modification patterns**:
- **Frontend changes**: Edit components in `frontend/components/`, pages in `frontend/app/`
- **Backend logic**: Modify Lambda handlers in `backend/lambda/*/index.py`
- **Infrastructure**: Update CDK stack in `backend/lib/backend-stack.ts`
- **AI behavior**: Adjust prompts and models in `backend/lambda/chat-handler/index.py`

**Getting help**:
- Review [Architecture Deep Dive](./architectureDeepDive.md) for system understanding
- Check [API Documentation](./APIDoc.md) for endpoint details
- See [Deployment Guide](./deploymentGuide.md) for deployment procedures
- Consult AWS documentation for service-specific questions

**Contributing**:
If you create useful extensions or improvements, consider documenting them in this guide for future developers. Add ADRs to `architectureDeepDive.md` for significant architectural decisions.

For questions or support, contact the development team or open an issue in the project repository.

