# CincyMuse Environment Configuration

This document describes all configuration parameters required for deploying the CincyMuse chatbot backend infrastructure.

## Table of Contents

- [CDK Context Variables](#cdk-context-variables)
- [AWS Secrets Manager](#aws-secrets-manager)
- [Environment Variables](#environment-variables)
- [Configuration Validation](#configuration-validation)
- [Environment-Specific Settings](#environment-specific-settings)

---

## CDK Context Variables

CDK context variables are passed during deployment via the `-c` flag or defined in `cdk.json`. These variables configure environment-specific resources.

### Required Context Variables

#### `environment`
- **Description**: Deployment environment identifier
- **Type**: String
- **Valid Values**: `dev`, `staging`, `prod`
- **Default**: `dev`
- **Usage**: `cdk deploy -c environment=prod`
- **Purpose**: Used for resource naming, tagging, and environment-specific configurations

### Optional Context Variables (Amplify Deployment)

If you want to deploy the frontend with AWS Amplify, provide these three variables:

#### `githubOwner`
- **Description**: GitHub repository owner (organization or username)
- **Type**: String
- **Required For**: Amplify deployment
- **Example**: `cincinnati-museum-center`
- **Usage**: `cdk deploy -c githubOwner=myorg`

#### `githubRepo`
- **Description**: GitHub repository name
- **Type**: String
- **Required For**: Amplify deployment
- **Example**: `cincymuse-chatbot`
- **Usage**: `cdk deploy -c githubRepo=cincymuse-chatbot`

#### `githubTokenSecretArn`
- **Description**: ARN of AWS Secrets Manager secret containing GitHub OAuth token
- **Type**: String (ARN)
- **Required For**: Amplify deployment
- **Example**: `arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token-abc123`
- **Usage**: `cdk deploy -c githubTokenSecretArn=arn:aws:secretsmanager:...`
- **Setup Instructions**: See [GitHub OAuth Token Setup](#github-oauth-token-setup)

### Example Deployment Commands

**Development (without Amplify)**:
```bash
cdk deploy -c environment=dev
```

**Production (with Amplify)**:
```bash
cdk deploy \
  -c environment=prod \
  -c githubOwner=cincinnati-museum-center \
  -c githubRepo=cincymuse-chatbot \
  -c githubTokenSecretArn=arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token-abc123
```

**Using cdk.json** (alternative to command-line flags):
```json
{
  "context": {
    "environment": "dev",
    "githubOwner": "cincinnati-museum-center",
    "githubRepo": "cincymuse-chatbot",
    "githubTokenSecretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token-abc123"
  }
}
```

---

## AWS Secrets Manager

The CincyMuse backend uses AWS Secrets Manager for storing sensitive credentials that should never be hardcoded.

### GitHub OAuth Token (Required for Amplify)

**Secret Name**: User-defined (you provide the ARN)

**Purpose**: Allows AWS Amplify to access your GitHub repository for CI/CD

**Setup Instructions**:

1. **Create GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Generate token and copy it (you won't see it again)

2. **Store Token in AWS Secrets Manager**:
   ```bash
   aws secretsmanager create-secret \
     --name github-oauth-token \
     --description "GitHub OAuth token for Amplify deployment" \
     --secret-string "ghp_your_token_here" \
     --region us-east-1
   ```

3. **Get the Secret ARN**:
   ```bash
   aws secretsmanager describe-secret \
     --secret-id github-oauth-token \
     --region us-east-1 \
     --query ARN \
     --output text
   ```

4. **Use the ARN in deployment**:
   ```bash
   cdk deploy -c githubTokenSecretArn=arn:aws:secretsmanager:us-east-1:123456789012:secret:github-oauth-token-abc123
   ```

**Security Notes**:
- ✅ Token is encrypted at rest in Secrets Manager
- ✅ Token is never exposed in CloudFormation templates or logs
- ✅ CDK retrieves token at deployment time using `secretValue`
- ✅ Amplify uses token to authenticate with GitHub
- ⚠️ Rotate token regularly (every 90 days recommended)
- ⚠️ Use least privilege: only grant `repo` scope

---

## Environment Variables

Lambda functions receive configuration via environment variables set by CDK. These are **automatically configured** during deployment and do not require manual setup.

### Chat Handler Lambda

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `KB_ID` | Bedrock Knowledge Base ID | CDK: `knowledgeBase.attrKnowledgeBaseId` | `ABCDEFGHIJ` |
| `TABLE_NAME` | DynamoDB ConversationLogs table name | CDK: `conversationLogsTable.tableName` | `BackendStack-ConversationLogsTable-ABC123` |

### Admin Handler Lambda

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `TABLE_NAME` | DynamoDB ConversationLogs table name | CDK: `conversationLogsTable.tableName` | `BackendStack-ConversationLogsTable-ABC123` |
| `PDF_METADATA_TABLE` | DynamoDB PDFMetadata table name | CDK: `pdfMetadataTable.tableName` | `BackendStack-PDFMetadataTable-ABC123` |
| `PDF_BUCKET` | S3 PDF repository bucket name | CDK: `pdfBucket.bucketName` | `backendstack-pdfrepositorybucket-abc123` |
| `KB_ID` | Bedrock Knowledge Base ID | CDK: `knowledgeBase.attrKnowledgeBaseId` | `ABCDEFGHIJ` |
| `PDF_DATA_SOURCE_ID` | Bedrock PDF data source ID | CDK: `pdfDataSource.attrDataSourceId` | `KLMNOPQRST` |
| `USER_POOL_ID` | Cognito User Pool ID | CDK: `userPool.userPoolId` | `us-east-1_ABC123DEF` |
| `LOG_GROUP_NAME` | CloudWatch log group for analytics | CDK: `/aws/lambda/${chatHandler.functionName}` | `/aws/lambda/BackendStack-ChatHandler-ABC123` |

### Collections Connector Lambda

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `KB_BUCKET` | S3 Knowledge Base content bucket name | CDK: `kbContentBucket.bucketName` | `backendstack-kbcontentbucket-abc123` |

### Podcast Ingestion Lambda

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `KB_BUCKET` | S3 Knowledge Base content bucket name | CDK: `kbContentBucket.bucketName` | `backendstack-kbcontentbucket-abc123` |

### KB Sync Handler Lambda

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `KB_ID` | Bedrock Knowledge Base ID | CDK: `knowledgeBase.attrKnowledgeBaseId` | `ABCDEFGHIJ` |
| `WEB_DATA_SOURCE_IDS` | Comma-separated web crawler data source IDs | CDK: `${cincyMuseumWebCrawler.attrDataSourceId},${supportCMCWebCrawler.attrDataSourceId}` | `UVWXYZ1234,ABCDEF5678` |
| `PDF_DATA_SOURCE_ID` | Bedrock PDF data source ID | CDK: `pdfDataSource.attrDataSourceId` | `KLMNOPQRST` |
| `PODCAST_DATA_SOURCE_ID` | Bedrock podcast data source ID | CDK: `podcastDataSource.attrDataSourceId` | `GHIJKLMNOP` |

### Frontend Environment Variables (Amplify)

These are automatically injected by CDK into the Amplify build environment:

| Variable | Description | Source | Example |
|----------|-------------|--------|---------|
| `NEXT_PUBLIC_CHAT_FUNCTION_URL` | Chat Lambda Function URL | CDK: `chatFunctionUrl.url` | `https://abc123.lambda-url.us-east-1.on.aws/` |
| `NEXT_PUBLIC_ADMIN_FUNCTION_URL` | Admin Lambda Function URL | CDK: `adminFunctionUrl.url` | `https://def456.lambda-url.us-east-1.on.aws/` |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID | CDK: `userPool.userPoolId` | `us-east-1_ABC123DEF` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID | CDK: `userPoolClient.userPoolClientId` | `1a2b3c4d5e6f7g8h9i0j` |
| `NEXT_PUBLIC_AWS_REGION` | AWS region | CDK: `this.region` | `us-east-1` |

---

## Configuration Validation

### Pre-Deployment Validation

The CDK stack validates required context variables at synthesis time:

```typescript
const environment = this.node.tryGetContext('environment') || 'dev';

// Amplify configuration is optional
const githubOwner = this.node.tryGetContext('githubOwner');
const githubRepo = this.node.tryGetContext('githubRepo');
const githubTokenSecretArn = this.node.tryGetContext('githubTokenSecretArn');

// If any Amplify variable is provided, all must be provided
if ((githubOwner || githubRepo || githubTokenSecretArn) && 
    !(githubOwner && githubRepo && githubTokenSecretArn)) {
  throw new Error('All Amplify variables must be provided together: githubOwner, githubRepo, githubTokenSecretArn');
}
```

### Runtime Validation

Lambda functions validate environment variables at startup:

```python
def lambda_handler(event, context):
    # Validate required environment variables
    kb_id = os.environ.get('KB_ID')
    table_name = os.environ.get('TABLE_NAME')
    
    if not kb_id:
        raise ValueError("KB_ID environment variable is not set")
    if not table_name:
        raise ValueError("TABLE_NAME environment variable is not set")
    
    # Continue with handler logic...
```

### Verification Checklist

Before deploying, verify:

- [ ] **No hardcoded credentials** in source code
- [ ] **No hardcoded API keys** in Lambda functions
- [ ] **No hardcoded bucket names** or table names
- [ ] **GitHub token stored in Secrets Manager** (if using Amplify)
- [ ] **Environment variable** used for all configuration
- [ ] **CDK context variables** provided for environment-specific settings

### Scanning for Hardcoded Secrets

Run these commands to verify no secrets are hardcoded:

```bash
# Search for potential API keys
grep -r "api[_-]key" backend/lambda/ --include="*.py" || echo "✓ No API keys found"

# Search for potential passwords
grep -r "password.*=" backend/lambda/ --include="*.py" || echo "✓ No passwords found"

# Search for potential tokens
grep -r "token.*=" backend/lambda/ --include="*.py" || echo "✓ No tokens found"

# Search for AWS access keys (should never be in code)
grep -r "AKIA" backend/ --include="*.py" --include="*.ts" || echo "✓ No AWS keys found"
```

---

## Environment-Specific Settings

### Development Environment

**Purpose**: Local development and testing

**Configuration**:
```bash
cdk deploy -c environment=dev
```

**Characteristics**:
- Minimal Amplify configuration (optional)
- Relaxed CORS (includes localhost:3000)
- CloudWatch log retention: 30 days
- DynamoDB: PAY_PER_REQUEST (cost-effective for low traffic)
- Knowledge Base sync: Every 24 hours
- Removal policy: RETAIN (to prevent accidental data loss)

**Cost Estimate**: ~$50-100/month

### Staging Environment

**Purpose**: Pre-production testing and QA

**Configuration**:
```bash
cdk deploy \
  -c environment=staging \
  -c githubOwner=cincinnati-museum-center \
  -c githubRepo=cincymuse-chatbot \
  -c githubTokenSecretArn=arn:aws:secretsmanager:...
```

**Characteristics**:
- Full Amplify deployment
- Production-like configuration
- CloudWatch log retention: 30 days
- DynamoDB: PAY_PER_REQUEST
- Knowledge Base sync: Every 24 hours
- Removal policy: RETAIN

**Cost Estimate**: ~$100-200/month

### Production Environment

**Purpose**: Live production system

**Configuration**:
```bash
cdk deploy \
  -c environment=prod \
  -c githubOwner=cincinnati-museum-center \
  -c githubRepo=cincymuse-chatbot \
  -c githubTokenSecretArn=arn:aws:secretsmanager:...
```

**Characteristics**:
- Full Amplify deployment with production branch
- Strict CORS (Amplify URL only, no localhost)
- CloudWatch log retention: 30 days
- DynamoDB: PAY_PER_REQUEST (scales automatically)
- Knowledge Base sync: Every 6 hours for events, 24 hours for content
- CloudWatch alarms enabled with SNS notifications
- Removal policy: RETAIN (data protection)

**Cost Estimate**: ~$420/month (based on 1,000 queries/day)

### Cost Breakdown (Production)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Bedrock Knowledge Base | $200 | Managed vector storage + embeddings |
| Bedrock Claude 3 Sonnet | $150 | ~1,000 queries/day @ $0.003/1K input tokens |
| Lambda Functions | $20 | Compute for chat, admin, sync handlers |
| DynamoDB | $10 | PAY_PER_REQUEST for conversation logs |
| S3 | $5 | PDF storage + KB content |
| CloudWatch Logs | $10 | Log storage and Logs Insights queries |
| Cognito | $0 | Free tier (< 50,000 MAUs) |
| Amplify Hosting | $15 | Build minutes + hosting |
| EventBridge | $0 | Free tier (< 1M events) |
| **Total** | **~$420/month** | |

---

## Troubleshooting

### Issue: "Missing required context variable"

**Cause**: Required CDK context variable not provided

**Solution**: Provide the variable via `-c` flag or add to `cdk.json`:
```bash
cdk deploy -c environment=prod
```

### Issue: "GitHub token authentication failed"

**Cause**: Invalid or expired GitHub OAuth token

**Solution**:
1. Generate new GitHub token with `repo` scope
2. Update Secrets Manager secret:
   ```bash
   aws secretsmanager update-secret \
     --secret-id github-oauth-token \
     --secret-string "ghp_new_token_here"
   ```
3. Redeploy stack

### Issue: "Lambda environment variable not set"

**Cause**: CDK deployment did not complete successfully

**Solution**:
1. Check CloudFormation stack status:
   ```bash
   aws cloudformation describe-stacks --stack-name BackendStack-dev
   ```
2. Review stack events for errors:
   ```bash
   aws cloudformation describe-stack-events --stack-name BackendStack-dev
   ```
3. Redeploy if needed:
   ```bash
   cdk deploy -c environment=dev
   ```

### Issue: "CORS error when accessing Lambda Function URL"

**Cause**: Frontend URL not included in CORS allowed origins

**Solution**:
1. Verify Amplify URL is constructed correctly in CDK stack
2. Check Lambda Function URL CORS configuration
3. Redeploy stack to update CORS settings

---

## Security Best Practices

### ✅ DO

- Store all secrets in AWS Secrets Manager
- Use CDK context variables for environment-specific configuration
- Validate environment variables at Lambda startup
- Use IAM roles and policies for authentication
- Enable encryption at rest for all data stores
- Rotate GitHub tokens every 90 days
- Use least privilege IAM permissions

### ❌ DON'T

- Hardcode API keys, tokens, or passwords in code
- Commit secrets to version control
- Use wildcard (`*`) in IAM policies
- Store credentials in environment variables (use Secrets Manager)
- Disable SSL/TLS enforcement
- Use overly permissive IAM roles
- Log sensitive data to CloudWatch

---

## Additional Resources

- [AWS CDK Context Documentation](https://docs.aws.amazon.com/cdk/v2/guide/context.html)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [CIC Architectural Standards](../.kiro/steering/ASU-CIC-architectural-standards.md)
