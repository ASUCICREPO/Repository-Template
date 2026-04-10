---
inclusion: fileMatch
fileMatchPattern: "backend/**/*"
---

# CIC Backend Standards

**Languages**: Lambdas (Python), CDK stack (TypeScript). 
**Architecture**: Single stack unless complexity requires otherwise; serverless-first, cost-effective, resilient. Always use latest AWS resources/services; verify with `aws-knowledge-mcp-server` (https://knowledge-mcp.global.api.aws) for AWS blogs, latest updates, and best practices before suggesting changes. Optimize for fewer resources while maintaining clarity. Never change strategy without approval. 
**Naming**: Lambda dirs (kebab-case: `resume-parser`), Python files (snake_case), CDK constructs (PascalCase: `UserTable`), Handler (always `lambda_handler(event, context)`).

## Dependency Versions

**Check latest versions BEFORE writing dependency files:**
- npm: `npm view <package-name> version`
- Python: Use Context7 or web search for PyPI versions
- AWS: Use AWS documentation tools for latest runtimes

**Version pinning:**
- Python: Exact versions (e.g., `boto3==x.y.z`)
- npm production: Exact versions (e.g., `"next": "x.y.z"`)
- npm dev: Caret for minor updates (e.g., `"typescript": "^x.y.z"`)
- Always look up the latest compatible version before writing dependency files — never assume a version number

**Workflow:** Check latest versions (npm view, PyPI, Context7) → Verify compatibility with project constraints (e.g., Amplify-supported Next.js range) → Write dependency file

## Build & Test Commands

- Build: `cd backend && npm run build`
- Synth (runs cdk-nag): `cd backend && cdk synth`
- Deploy: `cd backend && cdk deploy`
- Test: `cd backend && npm test`


## Security Requirements (Non-Negotiable)

**IAM Policies:**
- Never use wildcard actions (`service:*`)
- Never use wildcard resources (`*`)
- Use CDK grant methods: `table.grantReadWriteData(fn)`, `bucket.grantRead(fn)`
- One IAM role per Lambda function

**Secrets:**
- Store in Secrets Manager or SSM Parameter Store
- Reference via environment variables
- Never hardcode secret values or paths

**Encryption:**
- Enable encryption at rest (DynamoDB, S3, EFS)
- Enforce HTTPS/TLS for all endpoints
- Use `enforceSSL: true` on all S3 buckets

**PII:**
- Redact PII from CloudWatch logs
- Use placeholders in test data: `[email]`, `[phone_number]`
- Store PII in encrypted tables; validate and sanitize input

**Authentication:**
- Use Cognito for user authentication
- Validate JWT tokens; implement session management; use MFA for admins

## CDK Context Variables

Use `tryGetContext` for deployment-specific config (GitHub tokens, resource IDs). Validate required vars at stack top; throw if missing. Pass via `cdk deploy -c key=value` or `cdk.json` context block.

```typescript
const githubToken = this.node.tryGetContext("githubToken");
if (!githubToken) throw new Error("Missing githubToken");
```

## CORS

Construct frontend URL early: `const amplifyAppUrl = \`https://main.${amplifyApp.appId}.amplifyapp.com\`;`. Use `amplifyAppUrl` + `http://localhost:3000` as allowed origins on all resources (Function URLs, S3, API Gateway). Every Lambda returning to browser must include CORS headers in all responses (including errors) and handle `OPTIONS` for preflight.

```python
def create_response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body),
    }
```

## Lambda Functions

**Handler Pattern**: AWS clients at module level (reused across warm invocations); use `os.environ.get()` never `[]`; validate env vars at start; consistent response shape `{'statusCode': int, 'body': json.dumps(...)}}`; structured JSON logging via `logging` module (never raw `print()`); keep handlers thin.

```python
import json, boto3, os, logging

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

dynamodb = boto3.resource('dynamodb')  # Module level

def lambda_handler(event, context):
    try:
        table_name = os.environ.get('TABLE_NAME')
        if not table_name: raise ValueError("TABLE_NAME not set")
        logger.info(json.dumps({'action': 'processing_request', 'table': table_name}))
        # Business logic
        return {'statusCode': 200, 'body': json.dumps({'data': result})}
    except ValueError as e:
        logger.warning(json.dumps({'error': 'validation_error', 'detail': str(e)}))
        return {'statusCode': 400, 'body': json.dumps({'error': str(e)})}
    except Exception as e:
        logger.error(json.dumps({'error': 'unhandled_exception', 'detail': str(e)}))
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
```

**CDK Definition**: Use latest supported Python runtime; detect host architecture dynamically; explicit timeout; pass resource names via environment (not ARNs).

```typescript
const hostArch = os.arch();
const lambdaArch = hostArch === "arm64" ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;

const myFunction = new lambda.Function(this, "MyFunction", {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: "index.lambda_handler",
  code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda", "my-function")),
  timeout: cdk.Duration.minutes(5),
  architecture: lambdaArch,
  environment: { TABLE_NAME: myTable.tableName },
});
```

## DynamoDB

`PAY_PER_REQUEST` billing; point-in-time recovery and encryption enabled; `RETAIN` removal policy for user data (DESTROY only for dev/scratch); use CDK grant methods (`grantReadWriteData`, `grantReadData`).

```typescript
const myTable = new dynamodb.Table(this, "MyTable", {
  partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
  sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});
myTable.grantReadWriteData(myFunction);
```

## S3

Always `enforceSSL: true`; add CORS only when frontend needs direct bucket access; use CDK grant methods.

```typescript
const myBucket = new s3.Bucket(this, "MyBucket", {
  enforceSSL: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
myBucket.grantRead(myFunction);
```

## CodeBuild Integration for Amplify

When Amplify apps need to reference backend resources created by CDK, use CodeBuild to orchestrate the deployment sequence. This pattern is essential when:
- Frontend needs backend API URLs, Cognito pool IDs, or other stack outputs
- Deployment requires specific context variables (GitHub tokens, credentials)
- You want automated CI/CD without manual CDK commands

### Integration Pattern

Create Amplify app early in CDK stack to get `appId` for CORS configuration, but construct the full Amplify URL for use in API Gateway, Lambda Function URLs, and other backend resources:

```typescript
// Create Amplify app early for CORS configuration
const amplifyApp = new amplify.CfnApp(this, "AmplifyFrontendUI", {
  name: `${projectPrefix}-frontend`,
  repository: `https://github.com/${githubOwner}/${githubRepo}`,
  oauthToken: githubTokenSecret.secretValue.unsafeUnwrap(),
  platform: 'WEB_COMPUTE',
  buildSpec: /* ... */,
  // NO customRules for SSR apps
});

const mainBranch = new amplify.CfnBranch(this, "AmplifyMainBranch", {
  appId: amplifyApp.attrAppId,
  branchName: "main",
  enableAutoBuild: true,
  stage: "PRODUCTION",
});

// Construct Amplify app URL for CORS
const amplifyAppUrl = `https://main.${amplifyApp.attrAppId}.amplifyapp.com`;
console.log(`Frontend URL for CORS: ${amplifyAppUrl}`);

// Use amplifyAppUrl in API Gateway CORS, Lambda Function URL CORS, etc.
```

### CodeBuild Deployment Script

The deployment orchestration happens via a shell script that:
1. Prompts for required credentials/configuration
2. Creates IAM service role for CodeBuild
3. Creates CodeBuild project with environment variables
4. Starts the build with deploy or destroy action

See cic-deployment agent for deployment script structure. The script should:
- Create CodeBuild project with GitHub source
- Pass all CDK context variables as CodeBuild environment variables
- Use `buildspec.yml` for actual CDK commands
- Support both deploy and destroy operations

### BuildSpec Configuration

Create `buildspec.yml` in repository root for CodeBuild execution. See cic-deployment agent for buildspec structure. Key requirements:
- Install AWS CDK CLI globally
- Navigate to backend directory
- Pass context variables to all CDK commands (bootstrap, deploy, destroy)
- Use conditional logic for deploy vs destroy

This pattern ensures backend resources are created first, their outputs are available for Amplify environment variables, and the entire deployment is automated through CodeBuild.

## Amplify

**Platform**: Use `WEB_COMPUTE` for Next.js SSR apps. Amplify's compute layer handles all routing automatically.

**CRITICAL — No custom rewrite rules for SSR apps**: Do NOT add SPA-style `customRules` (catch-all → `/index.html`) when using `WEB_COMPUTE` platform. The SPA rewrite intercepts requests before the SSR compute layer, causing 404 errors because there is no static `index.html` in an SSR deployment. Amplify handles routing natively for SSR.

**Next.js version**: Amplify Hosting compute supports Next.js 12–15 only. Do NOT use Next.js 16+ until Amplify officially adds support. Check AWS docs before upgrading.

**Monorepo setup**: For monorepo projects (frontend in a subdirectory), you MUST set `AMPLIFY_MONOREPO_APP_ROOT` as an environment variable on both the app and branch. Without it, Amplify's framework adapter won't generate `deploy-manifest.json` and the build will fail. The value must match the `appRoot` in the buildSpec.

**Auto-build on CDK deploy**: `enableAutoBuild: true` only triggers builds on git pushes, NOT on CDK deploys. To auto-trigger a build after every `cdk deploy`, use an `AwsCustomResource` that calls `amplify:StartJob`. This ensures environment variable changes (API URLs, Cognito IDs) are picked up immediately without a manual rebuild. Use `Date.now()` in the `PhysicalResourceId` to force execution on every deploy.

Construct `amplifyAppUrl` from `appId` for CORS origins; pass backend URLs/IDs via environment variables on the branch.

```typescript
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

const amplifyApp = new amplify.CfnApp(this, 'AmplifyApp', {
  name: `${projectPrefix}-frontend`,
  repository: `https://github.com/${githubOwner}/${githubRepo}`,
  oauthToken: githubTokenSecret.secretValue.unsafeUnwrap(),
  platform: 'WEB_COMPUTE',
  // Monorepo buildSpec — appRoot tells Amplify where the frontend lives
  buildSpec: [
    'version: 1',
    'applications:',
    '  - appRoot: frontend',
    '    frontend:',
    '      phases:',
    '        preBuild:',
    '          commands:',
    '            - npm ci',
    '        build:',
    '          commands:',
    '            - npm run build',
    '      artifacts:',
    '        baseDirectory: .next',
    '        files:',
    '          - "**/*"',
    '      cache:',
    '        paths:',
    '          - node_modules/**/*',
    '          - .next/cache/**/*',
  ].join('\n'),
  // NO customRules — SSR routing is handled by Amplify compute layer
  environmentVariables: [
    { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'frontend' },
    // ... backend URLs set after API/Function URL creation
  ],
});

const amplifyMainBranch = new amplify.CfnBranch(this, 'AmplifyMainBranch', {
  appId: amplifyApp.attrAppId,
  branchName: 'main',
  enableAutoBuild: true,
  stage: 'PRODUCTION',
  environmentVariables: [
    { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'frontend' },
    { name: 'NEXT_PUBLIC_API_URL', value: api.url },
    // ... other NEXT_PUBLIC_ vars
  ],
});

// ADR: AwsCustomResource to trigger Amplify build on every CDK deploy
// Rationale: enableAutoBuild only fires on git pushes, not CDK deploys.
//   Environment variable changes (API URLs, Cognito IDs) require a rebuild.
// Alternative: Manual `aws amplify start-job` after deploy (rejected - error-prone)
new AwsCustomResource(this, 'TriggerAmplifyBuild', {
  onCreate: {
    service: 'Amplify',
    action: 'startJob',
    parameters: {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
      jobType: 'RELEASE',
    },
    physicalResourceId: PhysicalResourceId.of(
      `${amplifyApp.attrAppId}-main-${Date.now()}`,
    ),
  },
  onUpdate: {
    service: 'Amplify',
    action: 'startJob',
    parameters: {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
      jobType: 'RELEASE',
    },
    physicalResourceId: PhysicalResourceId.of(
      `${amplifyApp.attrAppId}-main-${Date.now()}`,
    ),
  },
  policy: AwsCustomResourcePolicy.fromSdkCalls({
    resources: [
      `arn:aws:amplify:${this.region}:${this.account}:apps/${amplifyApp.attrAppId}`,
      `arn:aws:amplify:${this.region}:${this.account}:apps/${amplifyApp.attrAppId}/branches/main/jobs/*`,
    ],
  }),
});
```

## CfnOutput

Export every resource frontend/other stacks consume: API URLs, Function URLs, S3 bucket names, DynamoDB table names, Amplify app URL.

```typescript
new cdk.CfnOutput(this, "ApiUrl", { value: api.url, description: "API Gateway URL" });
```

## IAM

Use CDK grant methods first (`table.grantReadWriteData(fn)`, `bucket.grantRead(fn)`); for Bedrock models use explicit policy statements with specific model ARNs (never wildcard); least privilege always.

## RAG Chatbots with S3 Vectors

For projects that use Bedrock Knowledge Base + S3 Vectors for RAG, follow the patterns in #[[file:.kiro/steering/backend/s3-vectors-rag-chatbot.md]]. Covers S3 Vectors bucket/index setup (TypeScript + Python CDK), Bedrock KB wiring, Lambda retrieval, ingestion patterns, and cdk-nag suppressions.

## API Gateway

For projects that use API Gateway (REST API V1 or HTTP API V2), follow the patterns in #[[file:.kiro/steering/backend/api-gateway-patterns.md]]. Covers when to use each type, streaming support, authentication, CORS, Lambda integration, and monitoring.

## Bedrock Integration

For projects that use Amazon Bedrock for AI/ML capabilities, follow the patterns in #[[file:.kiro/steering/backend/bedrock-patterns.md]]. Covers model invocation (foundation models vs inference profiles), IAM permissions for cross-region profiles, streaming responses, CORS configuration, and common pitfalls.

**CRITICAL - Model Availability Validation:**
BEFORE writing ANY Bedrock code, validate model availability:
1. Run `aws bedrock list-foundation-models --region <region>`
2. Run `aws bedrock list-inference-profiles --region <region>`
3. Prefer AWS-owned models (Nova, Titan) that don't require marketplace subscriptions
4. If using third-party models (Claude, etc.), verify they're enabled in the account
5. Document model selection rationale in ADR

**Model Selection Priority:**
1. AWS Nova models (no marketplace subscription needed)
2. AWS Titan models (no marketplace subscription needed)
3. Third-party models (Claude, etc.) - only if explicitly requested or required

## Security Steering References

For detailed security guidance beyond the summary above, consult these manual-inclusion files:
- IAM & secrets management: #[[file:.kiro/steering/security/security-iam-secrets.md]]
- Data & encryption: #[[file:.kiro/steering/security/security-data-encryption.md]]
- Operations & resilience: #[[file:.kiro/steering/security/security-operations.md]]
- Code & dependencies: #[[file:.kiro/steering/security/security-code-dependencies.md]]
- Compliance & documentation: #[[file:.kiro/steering/security/security-compliance.md]]

## Security Scanning with cdk-nag

cdk-nag is integrated directly in `backend/lib/backend-stack.ts` via `Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }))`. It runs automatically on every `cdk synth` and `cdk deploy` — no extra setup needed.

When findings appear, either fix the resource config or suppress with an ADR-format reason using `NagSuppressions.addResourceSuppressions()`. See `backend-stack.ts` for the pattern.

## Documenting Architectural Decisions

When making significant architectural choices in CDK/Lambda code, document the decision:

**In architectureDeepDive.md**: Add formal ADR entry with context, alternatives, rationale, consequences.

**In code comments**: Reference the decision where implemented.

```typescript
// ADR: Lambda architecture detection for ARM64/x86_64 compatibility
// Rationale: Supports development on both Apple Silicon and Intel Macs
// Alternative: Hardcode ARM64 (rejected - breaks Intel Mac developers)
const hostArch = os.arch();
const lambdaArch = hostArch === "arm64" ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;
```

**Document decisions about**: Service selection (OpenSearch vs S3+DynamoDB), model choices (Bedrock model selection), architecture patterns (event-driven vs request-response), data storage (DynamoDB vs RDS), scaling strategies (serverless vs provisioned).


## Architecture Diagrams

For creating and maintaining architecture diagrams in spec design.md files, follow the standards in #[[file:.kiro/steering/architecture-diagrams.md]]. Use draw.io XML format (not Mermaid), AWS 2024 icons, and generate PNG versions using the AWS Diagram MCP server.


