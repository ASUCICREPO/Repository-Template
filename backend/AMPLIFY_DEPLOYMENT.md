# Amplify Deployment Configuration

This document explains how to deploy the CincyMuse frontend using AWS Amplify, which has been configured in the CDK stack.

## Overview

The CDK stack now includes AWS Amplify hosting for the Next.js frontend with:
- Automatic CI/CD from GitHub
- Environment variable injection for backend URLs and Cognito configuration
- SPA rewrite rules for Next.js App Router
- Auto-triggered builds on stack deployment

## Prerequisites

Before deploying with Amplify, you need:

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **GitHub OAuth Token**: A personal access token with `repo` and `admin:repo_hook` permissions
3. **AWS Secrets Manager**: Store the GitHub token in Secrets Manager

## Setup Instructions

### 1. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
4. Generate and copy the token

### 2. Store Token in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name cincymuse-github-token \
  --description "GitHub OAuth token for Amplify deployment" \
  --secret-string "your-github-token-here" \
  --region us-east-1
```

Note the ARN returned by this command (e.g., `arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-AbCdEf`)

### 3. Deploy CDK Stack with Amplify

```bash
cd backend

# Deploy with GitHub configuration
cdk deploy \
  -c environment=dev \
  -c githubOwner=your-github-username \
  -c githubRepo=your-repo-name \
  -c githubTokenSecretArn=arn:aws:secretsmanager:us-east-1:123456789012:secret:cincymuse-github-token-AbCdEf
```

### 4. Verify Deployment

After deployment completes:

1. Check the CloudFormation outputs for:
   - `AmplifyAppId`: The Amplify application ID
   - `AmplifyAppUrl`: The frontend URL (e.g., `https://main.d1234567890abc.amplifyapp.com`)

2. Visit the Amplify Console:
   ```bash
   aws amplify get-app --app-id <AmplifyAppId>
   ```

3. Monitor the build:
   - Go to AWS Console → Amplify → Your App → main branch
   - Watch the build progress (Provision → Build → Deploy → Verify)

## Environment Variables

The following environment variables are automatically passed to the frontend build:

- `NEXT_PUBLIC_CHAT_FUNCTION_URL`: Chat Handler Lambda Function URL
- `NEXT_PUBLIC_ADMIN_FUNCTION_URL`: Admin Handler Lambda Function URL
- `NEXT_PUBLIC_USER_POOL_ID`: Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `NEXT_PUBLIC_AWS_REGION`: AWS region

These are injected during the Amplify build and available to the Next.js application.

## Build Configuration

The Amplify app uses the following build specification:

```yaml
version: 1.0
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## SPA Rewrite Rule

The stack configures a rewrite rule for Next.js App Router:

```
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>
Target: /index.html
Status: REWRITE
```

This ensures all non-file routes are handled by Next.js routing.

## Auto-Trigger Build

The stack includes a custom resource that automatically triggers an Amplify build when:
- The stack is created (initial deployment)
- The stack is updated (subsequent deployments)

This ensures the frontend is always deployed with the latest backend configuration.

## Deploying Without Amplify

If you don't want to use Amplify (e.g., for local development), simply omit the GitHub context variables:

```bash
cd backend
cdk deploy -c environment=dev
```

The stack will skip Amplify creation and log:
```
Skipping Amplify deployment - GitHub configuration not provided
To deploy with Amplify, provide: -c githubOwner=<owner> -c githubRepo=<repo> -c githubTokenSecretArn=<arn>
```

## Updating CORS (Task 28)

After Amplify deployment, you'll need to update CORS configurations to include the Amplify URL:

1. Update Chat Handler Lambda Function URL CORS
2. Update Admin Handler Lambda Function URL CORS
3. Update S3 bucket CORS

This is tracked in Task 28 of the implementation plan.

## Troubleshooting

### Build Fails

1. Check Amplify build logs in AWS Console
2. Verify environment variables are set correctly
3. Ensure `frontend/package.json` has correct build script

### GitHub Connection Issues

1. Verify GitHub token has correct permissions
2. Check token is stored correctly in Secrets Manager
3. Ensure repository exists and is accessible

### Environment Variables Not Available

1. Check CloudFormation outputs for correct values
2. Verify Amplify branch environment variables in console
3. Rebuild the Amplify app to pick up new variables

## Security Notes

- GitHub OAuth token is stored in AWS Secrets Manager (never hardcoded)
- Token is retrieved at deployment time using CDK SecretValue
- Amplify uses the token to set up webhooks for automatic deployments
- All frontend-backend communication uses HTTPS
- Environment variables are injected at build time (not runtime)

## Cost Considerations

AWS Amplify pricing:
- Build minutes: $0.01 per build minute
- Hosting: $0.15 per GB served
- Free tier: 1,000 build minutes and 15 GB served per month

For a typical museum chatbot with moderate traffic, expect $5-20/month for Amplify hosting.
