# CincyMuse Chatbot - Deployment Guide

This guide provides comprehensive step-by-step instructions for deploying the CincyMuse chatbot to AWS.

---

## Table of Contents

- [Deployment Guide](#deployment-guide)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Pre-Deployment Setup](#pre-deployment-setup)
    - [AWS Account Setup](#aws-account-setup)
    - [CLI Tools Installation](#cli-tools-installation)
    - [GitHub OAuth Token Setup](#github-oauth-token-setup)
  - [Deployment](#deployment)
    - [Quick Deployment (Development)](#quick-deployment-development)
    - [Full Deployment (Production)](#full-deployment-production)
    - [Using the Deployment Script](#using-the-deployment-script)
  - [Post-Deployment Configuration](#post-deployment-configuration)
    - [Create Cognito Admin Users](#create-cognito-admin-users)
    - [Trigger Knowledge Base Sync](#trigger-knowledge-base-sync)
    - [Verify Deployment](#verify-deployment)
  - [Environment-Specific Deployments](#environment-specific-deployments)
  - [Troubleshooting](#troubleshooting)
  - [Rollback Procedures](#rollback-procedures)

---

## Overview

The CincyMuse chatbot uses a serverless architecture deployed entirely on AWS using Infrastructure as Code (AWS CDK). The deployment process:

1. **Backend Infrastructure**: CDK deploys Lambda functions, DynamoDB tables, S3 buckets, Bedrock Knowledge Base, Cognito User Pool, and CloudWatch alarms
2. **Frontend Hosting**: AWS Amplify automatically builds and deploys the Next.js frontend from GitHub
3. **Content Ingestion**: EventBridge scheduled rules trigger automatic content syncs from museum websites, collections API, and podcast feeds

**Deployment Time**: 10-15 minutes for backend, 5-10 minutes for frontend build

**Architecture**: Single CDK stack (`BackendStack`) containing all resources

---

## Prerequisites

### Required Accounts

- [ ] **AWS Account** with administrator access - [Create AWS Account](https://aws.amazon.com/)
- [ ] **GitHub Account** (for Amplify deployment) - [Sign up for GitHub](https://github.com/signup)

### Required CLI Tools

Install these tools before deployment:

- [ ] **AWS CLI** (v2.x or later)
  - Install: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  - Verify: `aws --version`

- [ ] **Node.js** (v18.x or later)
  - Install: [Node.js Downloads](https://nodejs.org/)
  - Verify: `node --version`

- [ ] **npm** (v9.x or later)
  - Included with Node.js
  - Verify: `npm --version`

- [ ] **AWS CDK CLI** (v2.x)
  - Install: `npm install -g aws-cdk`
  - Verify: `cdk --version`

- [ ] **jq** (JSON processor, optional but recommended)
  - macOS: `brew install jq`
  - Linux: `apt-get install jq` or `yum install jq`
  - Verify: `jq --version`

### Required AWS Permissions

Your AWS IAM user/role must have permissions for:

- **CloudFormation**: Create/update/delete stacks
- **Lambda**: Create functions, function URLs, layers
- **DynamoDB**: Create tables, configure GSIs
- **S3**: Create buckets, configure CORS
- **Bedrock**: Create Knowledge Bases, data sources, start ingestion jobs
- **Cognito**: Create user pools, user pool clients, groups
- **IAM**: Create roles and policies for Lambda functions
- **CloudWatch**: Create log groups, alarms, metrics
- **EventBridge**: Create scheduled rules
- **Amplify**: Create apps, branches, configure builds (if deploying frontend)
- **Secrets Manager**: Read secrets (for GitHub token)

**Recommended**: Use `AdministratorAccess` policy for initial deployment, then create a custom deployment role with least privilege for production.

### Software Dependencies

- [ ] **Git** - [Install Git](https://git-scm.com/downloads)
- [ ] **Bash** (for deployment script) - Pre-installed on macOS/Linux, use Git Bash on Windows

---

## Pre-Deployment Setup

### AWS Account Setup

1. **Configure AWS CLI Credentials**

   ```bash
   aws configure
   ```

   Enter your credentials:
   - **AWS Access Key ID**: Your IAM user access key
   - **AWS Secret Access Key**: Your IAM user secret key
   - **Default region**: `us-east-1` (recommended for Bedrock availability)
   - **Default output format**: `json`

   **Verify configuration**:
   ```bash
   aws sts get-caller-identity
   ```

   Expected output:
   ```json
   {
       "UserId": "AIDAXXXXXXXXXXXXXXXXX",
       "Account": "123456789012",
       "Arn": "arn:aws:iam::123456789012:user/your-username"
   }
   ```

2. **Bootstrap AWS CDK** (first-time CDK users only)

   CDK requires a one-time bootstrap to create deployment resources:

   ```bash
   cdk bootstrap aws://ACCOUNT_ID/REGION
   ```

   Replace `ACCOUNT_ID` with your AWS account ID and `REGION` with your deployment region (e.g., `us-east-1`).

   **Example**:
   ```bash
   cdk bootstrap aws://123456789012/us-east-1
   ```

   **Verify bootstrap**:
   ```bash
   aws cloudformation describe-stacks --stack-name CDKToolkit
   ```

### CLI Tools Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cincinnati-museum-center/cincymuse-chatbot.git
   cd cincymuse-chatbot
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

   This installs:
   - AWS CDK libraries
   - TypeScript compiler
   - CDK construct libraries for Lambda, DynamoDB, S3, Bedrock, etc.

3. **Verify installation**

   ```bash
   npm list aws-cdk-lib
   ```

   Expected: `aws-cdk-lib@2.x.x`

### GitHub OAuth Token Setup

**Required for**: Amplify frontend deployment (optional for backend-only deployment)

**Purpose**: Allows AWS Amplify to access your GitHub repository for automatic builds and deployments.

#### Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → [Tokens (classic)](https://github.com/settings/tokens)

2. Click **"Generate new token (classic)"**

3. Configure token:
   - **Note**: `CincyMuse Amplify Deployment`
   - **Expiration**: 90 days (recommended)
   - **Scopes**: Select `repo` (Full control of private repositories)

4. Click **"Generate token"**

5. **Copy the token** (format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - ⚠️ You won't be able to see it again!

#### Step 2: Store Token in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name cincymuse-github-token \
  --description "GitHub OAuth token for CincyMuse Amplify deployment" \
  --secret-string "ghp_your_token_here" \
  --region us-east-1
```

**Verify secret creation**:
```bash
aws secretsmanager describe-secret \
  --secret-id cincymuse-github-token \
  --region us-east-1
```

#### Step 3: Get Secret ARN

```bash
aws secretsmanager describe-secret \
  --secret-id cincymuse-github-token \
  --region us-east-1 \
  --query ARN \
  --output text
```

**Save this ARN** - you'll need it for deployment:
```
arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-abc123
```

#### Security Best Practices

- ✅ Use token expiration (90 days recommended)
- ✅ Rotate tokens regularly
- ✅ Use least privilege scope (`repo` only)
- ✅ Never commit tokens to version control
- ✅ Store tokens in Secrets Manager, not environment variables

---

## Deployment

### Quick Deployment (Development)

For local development and testing without Amplify frontend:

```bash
cd backend
./scripts/deploy.sh dev
```

This will:
1. Install dependencies
2. Bootstrap CDK (if needed)
3. Deploy backend infrastructure
4. Prompt for admin user creation
5. Trigger initial Knowledge Base sync

**Deployment time**: ~10-15 minutes

### Full Deployment (Production)

For production deployment with Amplify frontend:

```bash
cd backend
./scripts/deploy.sh prod \
  --github-owner cincinnati-museum-center \
  --github-repo cincymuse-chatbot \
  --github-token-arn arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-abc123
```

Replace:
- `cincinnati-museum-center` with your GitHub organization/username
- `cincymuse-chatbot` with your repository name
- ARN with your Secrets Manager secret ARN

**Deployment time**: ~15-20 minutes (backend + frontend build)

### Using the Deployment Script

The deployment script (`backend/scripts/deploy.sh`) automates the entire deployment process.

#### Script Usage

```bash
./scripts/deploy.sh <environment> [options]
```

#### Arguments

- `environment` (required): `dev`, `staging`, or `prod`

#### Options

- `--skip-user-creation`: Skip Cognito admin user creation
- `--skip-kb-sync`: Skip initial Knowledge Base sync
- `--github-owner <owner>`: GitHub repository owner (required for Amplify)
- `--github-repo <repo>`: GitHub repository name (required for Amplify)
- `--github-token-arn <arn>`: GitHub OAuth token secret ARN (required for Amplify)
- `-h, --help`: Show help message

#### Examples

**Development (backend only)**:
```bash
./scripts/deploy.sh dev
```

**Staging (with Amplify)**:
```bash
./scripts/deploy.sh staging \
  --github-owner myorg \
  --github-repo cincymuse \
  --github-token-arn arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token-abc123
```

**Production (skip user creation if already exists)**:
```bash
./scripts/deploy.sh prod \
  --github-owner myorg \
  --github-repo cincymuse \
  --github-token-arn arn:aws:secretsmanager:us-east-1:123456789012:secret:github-token-abc123 \
  --skip-user-creation
```

### Manual Deployment (Alternative)

If you prefer manual control over the deployment process:

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Synthesize CDK Stack (Optional)

Review the CloudFormation template before deployment:

```bash
cdk synth -c environment=prod
```

This generates the CloudFormation template in `cdk.out/`.

#### Step 3: Deploy Backend Stack

**Without Amplify**:
```bash
cdk deploy -c environment=dev
```

**With Amplify**:
```bash
cdk deploy \
  -c environment=prod \
  -c githubOwner=cincinnati-museum-center \
  -c githubRepo=cincymuse-chatbot \
  -c githubTokenSecretArn=arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-abc123
```

When prompted:
- Review IAM policy changes
- Type `y` to confirm deployment

#### Step 4: Save Deployment Outputs

After deployment completes, save these outputs (displayed in terminal):

- **ChatFunctionUrl**: Lambda Function URL for chat API
- **AdminFunctionUrl**: Lambda Function URL for admin API
- **KnowledgeBaseId**: Bedrock Knowledge Base ID
- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID
- **AmplifyAppUrl**: Frontend URL (if Amplify deployed)

**Tip**: Outputs are also saved to `backend/cdk-outputs.json`

---

## Post-Deployment Configuration

### Create Cognito Admin Users

The deployment script prompts for admin user creation, but you can also create users manually.

#### Create Admin User

```bash
# Set variables
USER_POOL_ID="us-east-1_ABC123DEF"  # From deployment outputs
ADMIN_EMAIL="admin@cincymuseum.org"
TEMP_PASSWORD="TempPass123!"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --user-attributes \
    Name=email,Value="$ADMIN_EMAIL" \
    Name=email_verified,Value=true \
    Name=custom:role,Value=Admin \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS \
  --region us-east-1

# Add user to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$USER_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --group-name Admin \
  --region us-east-1
```

**User must change password on first login.**

#### Create Viewer User (Read-Only)

```bash
# Create viewer user
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "viewer@cincymuseum.org" \
  --user-attributes \
    Name=email,Value="viewer@cincymuseum.org" \
    Name=email_verified,Value=true \
    Name=custom:role,Value=Viewer \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --region us-east-1

# Add user to Viewer group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$USER_POOL_ID" \
  --username "viewer@cincymuseum.org" \
  --group-name Viewer \
  --region us-east-1
```

#### User Roles

- **Admin**: Full access to upload/delete PDFs, view logs, analytics
- **Viewer**: Read-only access to logs and analytics

### Trigger Knowledge Base Sync

The deployment script triggers initial sync, but you can manually trigger syncs for specific data sources.

#### Get Data Source IDs

```bash
KB_ID="ABCDEFGHIJ"  # From deployment outputs

# List all data sources
aws bedrock-agent list-data-sources \
  --knowledge-base-id "$KB_ID" \
  --region us-east-1
```

#### Start Ingestion Job

**For web crawlers** (cincymuseum.org, supportcmc.org):
```bash
WEB_DATA_SOURCE_ID="KLMNOPQRST"

aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$WEB_DATA_SOURCE_ID" \
  --region us-east-1
```

**For PDF documents**:
```bash
PDF_DATA_SOURCE_ID="UVWXYZ1234"

aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$PDF_DATA_SOURCE_ID" \
  --region us-east-1
```

**For podcasts**:
```bash
PODCAST_DATA_SOURCE_ID="ABCDEF5678"

aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$PODCAST_DATA_SOURCE_ID" \
  --region us-east-1
```

#### Monitor Sync Progress

```bash
# Get ingestion job status
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$WEB_DATA_SOURCE_ID" \
  --region us-east-1 \
  --max-results 5
```

**Job statuses**:
- `STARTING`: Job is initializing
- `IN_PROGRESS`: Content is being ingested
- `COMPLETE`: Sync completed successfully
- `FAILED`: Sync failed (check CloudWatch logs)

**Typical sync times**:
- Web crawlers: 20-40 minutes (300 pages)
- PDF documents: 5-10 minutes (depends on number/size)
- Podcasts: 2-5 minutes

#### Scheduled Syncs

EventBridge automatically triggers syncs:
- **Event feeds**: Every 6 hours
- **Websites, collections, podcasts**: Every 24 hours

No manual intervention required after initial deployment.

### Verify Deployment

#### 1. Check CloudFormation Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name BackendStack-prod \
  --region us-east-1 \
  --query "Stacks[0].StackStatus" \
  --output text
```

Expected: `CREATE_COMPLETE` or `UPDATE_COMPLETE`

#### 2. Test Chat Function URL

```bash
CHAT_URL="https://abc123.lambda-url.us-east-1.on.aws/"

curl -X POST "$CHAT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the museum hours?",
    "language": "en"
  }'
```

Expected response:
```json
{
  "conversationId": "uuid-here",
  "response": "The Cincinnati Museum Center is open...",
  "sources": [...],
  "confidence": 0.85
}
```

#### 3. Test Admin Function URL

```bash
ADMIN_URL="https://def456.lambda-url.us-east-1.on.aws/"

# Get system health (requires authentication)
curl -X GET "$ADMIN_URL/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Verify Lambda Functions

```bash
aws lambda list-functions \
  --region us-east-1 \
  --query "Functions[?contains(FunctionName, 'BackendStack')].FunctionName" \
  --output table
```

Expected functions:
- `BackendStack-ChatHandler-*`
- `BackendStack-AdminHandler-*`
- `BackendStack-CollectionsConnector-*`
- `BackendStack-PodcastIngestion-*`
- `BackendStack-KBSyncHandler-*`

#### 5. Verify DynamoDB Tables

```bash
aws dynamodb list-tables \
  --region us-east-1 \
  --query "TableNames[?contains(@, 'BackendStack')]" \
  --output table
```

Expected tables:
- `BackendStack-ConversationLogsTable-*`
- `BackendStack-PDFMetadataTable-*`

#### 6. Verify S3 Buckets

```bash
aws s3 ls | grep backendstack
```

Expected buckets:
- `backendstack-pdfrepositorybucket-*`
- `backendstack-kbcontentbucket-*`

#### 7. Verify Cognito User Pool

```bash
aws cognito-idp list-user-pools \
  --max-results 10 \
  --region us-east-1 \
  --query "UserPools[?contains(Name, 'cincymuse-admin')]"
```

#### 8. Access Frontend (if Amplify deployed)

Navigate to the Amplify URL from deployment outputs:
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

**Test basic functionality**:
- [ ] Chat interface loads
- [ ] Can submit a question
- [ ] Response appears with sources
- [ ] Language selector works (English/Spanish)
- [ ] Admin dashboard requires login
- [ ] Can log in with created admin user

---

## Troubleshooting

### Common Issues

#### Issue: [INSERT_COMMON_ISSUE_1]
**Symptoms**: [INSERT_SYMPTOMS]

**Solution**:
```bash
[INSERT_SOLUTION_COMMANDS]
```

#### Issue: [INSERT_COMMON_ISSUE_2]
**Symptoms**: [INSERT_SYMPTOMS]

**Solution**:
[INSERT_SOLUTION_STEPS]

#### Issue: CDK Bootstrap Error
**Symptoms**: Error message about CDK not being bootstrapped

**Solution**:
```bash
cdk bootstrap aws://[ACCOUNT_ID]/[REGION]
```

#### Issue: Permission Denied
**Symptoms**: Access denied errors during deployment

**Solution**:
- Verify your AWS credentials are configured correctly
- Ensure your IAM user/role has the required permissions
- Check if you're deploying to the correct region

---

## Cleanup

To remove all deployed resources:

```bash
cd backend
cdk destroy
```

> **Warning**: This will delete all resources created by this stack. Make sure to backup any important data before proceeding.

---

## Next Steps

After successful deployment:
1. Review the [User Guide](./userGuide.md) to learn how to use the application
2. Check the [API Documentation](./APIDoc.md) for integration details
3. See the [Modification Guide](./modificationGuide.md) for customization options



---

## Environment-Specific Deployments

### Development Environment

**Purpose**: Local development and testing

**Command**:
```bash
./scripts/deploy.sh dev
```

**Configuration**:
- Environment: `dev`
- Amplify: Optional (can deploy backend only)
- CORS: Includes `http://localhost:3000`
- Log retention: 30 days
- Removal policy: RETAIN

**Cost**: ~$50-100/month

**Use cases**:
- Feature development
- Integration testing
- Bug fixes
- Local frontend development

### Staging Environment

**Purpose**: Pre-production testing and QA

**Command**:
```bash
./scripts/deploy.sh staging \
  --github-owner myorg \
  --github-repo cincymuse \
  --github-token-arn arn:aws:secretsmanager:...
```

**Configuration**:
- Environment: `staging`
- Amplify: Recommended (full stack testing)
- CORS: Amplify URL + localhost
- Log retention: 30 days
- Removal policy: RETAIN

**Cost**: ~$100-200/month

**Use cases**:
- User acceptance testing (UAT)
- Performance testing
- Security testing
- Client demos

### Production Environment

**Purpose**: Live production system

**Command**:
```bash
./scripts/deploy.sh prod \
  --github-owner cincinnati-museum-center \
  --github-repo cincymuse-chatbot \
  --github-token-arn arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-abc123
```

**Configuration**:
- Environment: `prod`
- Amplify: Required (full deployment)
- CORS: Amplify URL only (no localhost)
- Log retention: 30 days
- CloudWatch alarms: Enabled with SNS notifications
- Removal policy: RETAIN

**Cost**: ~$420/month (1,000 queries/day)

**Use cases**:
- Live museum visitor traffic
- Public-facing chatbot
- Admin dashboard for staff

### Multi-Environment Strategy

**Recommended workflow**:

1. **Develop in `dev`**: Test features locally
2. **Deploy to `staging`**: QA and UAT
3. **Promote to `prod`**: After approval

**Separate AWS accounts** (recommended for production):
- Development account: `dev` and `staging`
- Production account: `prod` only

**Benefits**:
- Isolated resources
- Separate billing
- Enhanced security
- Compliance requirements


---

## Troubleshooting

### Common Deployment Issues

#### Issue: CDK Bootstrap Error

**Symptoms**:
```
Error: This stack uses assets, so the toolkit stack must be deployed to the environment
```

**Cause**: CDK not bootstrapped in the target region

**Solution**:
```bash
cdk bootstrap aws://ACCOUNT_ID/REGION
```

Replace `ACCOUNT_ID` and `REGION` with your values.

---

#### Issue: GitHub Token Authentication Failed

**Symptoms**:
```
Error: Unable to access GitHub repository
Amplify deployment failed
```

**Cause**: Invalid, expired, or insufficient permissions on GitHub token

**Solution**:

1. **Verify token has correct scope**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Ensure token has `repo` scope

2. **Generate new token if expired**:
   ```bash
   # Update Secrets Manager with new token
   aws secretsmanager update-secret \
     --secret-id cincymuse-github-token \
     --secret-string "ghp_new_token_here" \
     --region us-east-1
   ```

3. **Redeploy stack**:
   ```bash
   cdk deploy -c environment=prod -c githubTokenSecretArn=...
   ```

---

#### Issue: Lambda Function Timeout

**Symptoms**:
```
Task timed out after 30.00 seconds
```

**Cause**: Lambda function exceeds configured timeout (30 seconds)

**Solution**:

1. **Check CloudWatch logs** for the specific Lambda:
   ```bash
   aws logs tail /aws/lambda/BackendStack-ChatHandler-ABC123 --follow
   ```

2. **Common causes**:
   - Knowledge Base sync taking too long (increase timeout in CDK)
   - Bedrock API throttling (check CloudWatch alarms)
   - Network issues (retry with exponential backoff)

3. **Increase timeout** (if needed):
   Edit `backend/lib/backend-stack.ts`:
   ```typescript
   timeout: cdk.Duration.seconds(60),  // Increase from 30 to 60
   ```

---

#### Issue: Knowledge Base Sync Failures

**Symptoms**:
```
Ingestion job status: FAILED
```

**Cause**: Web crawler cannot access URLs, S3 bucket empty, or permissions issue

**Solution**:

1. **Check ingestion job details**:
   ```bash
   aws bedrock-agent list-ingestion-jobs \
     --knowledge-base-id "$KB_ID" \
     --data-source-id "$DATA_SOURCE_ID" \
     --region us-east-1
   ```

2. **Common causes**:
   - **Web crawler**: Website blocking AWS IPs (check robots.txt)
   - **S3 data source**: Bucket is empty (upload content first)
   - **Permissions**: KB role lacks S3 read permissions (check IAM)

3. **Verify KB role permissions**:
   ```bash
   aws iam get-role-policy \
     --role-name BackendStack-KnowledgeBaseRole-ABC123 \
     --policy-name default
   ```

4. **Retry sync**:
   ```bash
   aws bedrock-agent start-ingestion-job \
     --knowledge-base-id "$KB_ID" \
     --data-source-id "$DATA_SOURCE_ID" \
     --region us-east-1
   ```

---

#### Issue: CORS Errors in Frontend

**Symptoms**:
```
Access to fetch at 'https://abc123.lambda-url...' from origin 'https://main.d1a2b3c4.amplifyapp.com' has been blocked by CORS policy
```

**Cause**: Frontend URL not included in Lambda Function URL CORS configuration

**Solution**:

1. **Verify Amplify URL** matches CORS configuration:
   ```bash
   # Get Amplify URL from stack outputs
   aws cloudformation describe-stacks \
     --stack-name BackendStack-prod \
     --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppUrl'].OutputValue" \
     --output text
   ```

2. **Check Lambda Function URL CORS**:
   ```bash
   aws lambda get-function-url-config \
     --function-name BackendStack-ChatHandler-ABC123
   ```

3. **If CORS is incorrect, redeploy stack**:
   ```bash
   cdk deploy -c environment=prod
   ```

---

#### Issue: Cognito User Creation Failed

**Symptoms**:
```
An error occurred (UsernameExistsException) when calling the AdminCreateUser operation: User already exists
```

**Cause**: User with that email already exists

**Solution**:

1. **List existing users**:
   ```bash
   aws cognito-idp list-users \
     --user-pool-id "$USER_POOL_ID" \
     --region us-east-1
   ```

2. **Delete existing user** (if needed):
   ```bash
   aws cognito-idp admin-delete-user \
     --user-pool-id "$USER_POOL_ID" \
     --username "admin@cincymuseum.org" \
     --region us-east-1
   ```

3. **Recreate user**:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id "$USER_POOL_ID" \
     --username "admin@cincymuseum.org" \
     --user-attributes Name=email,Value="admin@cincymuseum.org" Name=email_verified,Value=true Name=custom:role,Value=Admin \
     --temporary-password "TempPass123!" \
     --region us-east-1
   ```

---

#### Issue: Bedrock Model Access Denied

**Symptoms**:
```
AccessDeniedException: You don't have access to the model with the specified model ID
```

**Cause**: Bedrock model not enabled in your AWS account

**Solution**:

1. **Enable Bedrock models**:
   - Go to AWS Console → Bedrock → Model access
   - Request access to:
     - `Claude 3 Sonnet` (for chat responses)
     - `Titan Embeddings G1 - Text` (for embeddings)

2. **Wait for approval** (usually instant for most models)

3. **Verify access**:
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```

---

#### Issue: DynamoDB Throttling

**Symptoms**:
```
ProvisionedThroughputExceededException: The level of configured provisioned throughput for the table was exceeded
```

**Cause**: High traffic exceeding DynamoDB capacity (should not happen with PAY_PER_REQUEST)

**Solution**:

1. **Verify billing mode**:
   ```bash
   aws dynamodb describe-table \
     --table-name BackendStack-ConversationLogsTable-ABC123 \
     --query "Table.BillingModeSummary.BillingMode"
   ```

   Expected: `PAY_PER_REQUEST`

2. **If provisioned mode** (incorrect), update to on-demand:
   ```bash
   aws dynamodb update-table \
     --table-name BackendStack-ConversationLogsTable-ABC123 \
     --billing-mode PAY_PER_REQUEST
   ```

---

### Knowledge Base Sync Troubleshooting

#### Check Sync Status

```bash
KB_ID="ABCDEFGHIJ"
DATA_SOURCE_ID="KLMNOPQRST"

# Get latest ingestion job
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$DATA_SOURCE_ID" \
  --max-results 1 \
  --region us-east-1
```

#### Common Sync Issues

**Web Crawler Issues**:
- Website blocks AWS IPs → Check robots.txt, contact website admin
- SSL certificate errors → Verify website uses valid HTTPS
- Timeout errors → Website too slow, increase crawler timeout

**S3 Data Source Issues**:
- Empty bucket → Upload content to S3 first
- Wrong prefix → Verify `inclusionPrefixes` in CDK
- File format not supported → Use .txt, .pdf, .md, .html

**Collections API Issues**:
- API rate limiting → Reduce request frequency
- API authentication → Verify API key (if required)
- API endpoint changed → Update Lambda code

#### Manual Sync Trigger

```bash
# Trigger sync for all data sources
./scripts/deploy.sh prod --skip-user-creation
```

Or trigger individual data sources:
```bash
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$DATA_SOURCE_ID" \
  --region us-east-1
```

---

### CloudWatch Logs Debugging

#### View Lambda Logs

```bash
# Chat Handler logs
aws logs tail /aws/lambda/BackendStack-ChatHandler-ABC123 --follow

# Admin Handler logs
aws logs tail /aws/lambda/BackendStack-AdminHandler-ABC123 --follow

# KB Sync Handler logs
aws logs tail /aws/lambda/BackendStack-KBSyncHandler-ABC123 --follow
```

#### Search Logs for Errors

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/BackendStack-ChatHandler-ABC123 \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

#### CloudWatch Logs Insights Query

```bash
# Get error count by error type
aws logs start-query \
  --log-group-name /aws/lambda/BackendStack-ChatHandler-ABC123 \
  --start-time $(date -u -d '1 day ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | stats count() by @message'
```

---

## Rollback Procedures

### Rollback to Previous Stack Version

If a deployment causes issues, rollback to the previous working version.

#### Option 1: Rollback via CloudFormation Console

1. Go to AWS Console → CloudFormation
2. Select stack: `BackendStack-prod`
3. Click **Stack actions** → **Roll back**
4. Confirm rollback

**Rollback time**: 5-10 minutes

#### Option 2: Rollback via AWS CLI

```bash
# Get previous stack template
aws cloudformation get-template \
  --stack-name BackendStack-prod \
  --template-stage Original \
  --region us-east-1 > previous-template.json

# Update stack with previous template
aws cloudformation update-stack \
  --stack-name BackendStack-prod \
  --template-body file://previous-template.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

#### Option 3: Redeploy Previous Git Commit

```bash
# Checkout previous working commit
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Redeploy
cd backend
./scripts/deploy.sh prod \
  --github-owner myorg \
  --github-repo cincymuse \
  --github-token-arn arn:aws:secretsmanager:...

# Return to latest commit
git checkout main
```

---

### Emergency Rollback (Complete Stack Deletion)

**⚠️ WARNING**: This deletes all resources. Use only as last resort.

#### Step 1: Backup Data

```bash
# Export conversation logs
aws dynamodb scan \
  --table-name BackendStack-ConversationLogsTable-ABC123 \
  --region us-east-1 > conversation-logs-backup.json

# Export PDF metadata
aws dynamodb scan \
  --table-name BackendStack-PDFMetadataTable-ABC123 \
  --region us-east-1 > pdf-metadata-backup.json

# Download PDFs from S3
aws s3 sync s3://backendstack-pdfrepositorybucket-abc123 ./pdf-backup/
```

#### Step 2: Delete Stack

```bash
cd backend
cdk destroy -c environment=prod
```

Or via AWS CLI:
```bash
aws cloudformation delete-stack \
  --stack-name BackendStack-prod \
  --region us-east-1
```

#### Step 3: Redeploy from Scratch

```bash
./scripts/deploy.sh prod \
  --github-owner myorg \
  --github-repo cincymuse \
  --github-token-arn arn:aws:secretsmanager:...
```

#### Step 4: Restore Data

```bash
# Restore conversation logs (if needed)
# Note: DynamoDB table names will be different after redeployment
aws dynamodb batch-write-item \
  --request-items file://conversation-logs-backup.json

# Upload PDFs back to S3
aws s3 sync ./pdf-backup/ s3://new-bucket-name/
```

---

### Partial Rollback (Specific Resources)

If only specific resources need rollback (e.g., Lambda function), update CDK code and redeploy.

#### Example: Rollback Lambda Function

1. **Revert Lambda code changes**:
   ```bash
   git checkout HEAD~1 backend/lambda/chat-handler/index.py
   ```

2. **Redeploy stack**:
   ```bash
   cdk deploy -c environment=prod
   ```

   CDK will only update the changed Lambda function.

---

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Bedrock Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Environment Configuration Guide](../backend/ENVIRONMENT_CONFIG.md)
- [Architecture Deep Dive](./architectureDeepDive.md)
- [API Documentation](./APIDoc.md)

---

## Support

For issues not covered in this guide:

1. **Check CloudWatch Logs** for detailed error messages
2. **Review CloudWatch Alarms** for system health issues
3. **Consult Architecture Documentation** for design decisions
4. **Contact AWS Support** for service-specific issues
5. **Review GitHub Issues** for known problems

---

## Next Steps

After successful deployment:

1. **Configure CloudWatch Alarms**: Set up SNS email notifications
2. **Create Additional Users**: Add more admin and viewer users
3. **Upload PDFs**: Add customer service documents via admin dashboard
4. **Monitor Costs**: Set up AWS Budgets and Cost Alerts
5. **Review Security**: Run security scan with cdk-nag
6. **Test Functionality**: Verify all features work as expected
7. **Train Staff**: Provide admin dashboard training
8. **Document Customizations**: Record any environment-specific changes

See the [User Guide](./userGuide.md) for end-user instructions and [Modification Guide](./modificationGuide.md) for customization options.
