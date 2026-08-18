---
name: backend-standards
description: Apply CIC backend coding standards when writing Lambda handlers, CDK stacks, DynamoDB tables, S3 buckets, or any backend infrastructure code. Triggered by: Lambda, CDK, DynamoDB, S3, backend code, IAM role, handler pattern.
---

Read `references/spec.md` before writing any backend code.

Apply these standards to every backend task:

**Languages**: Python for Lambda handlers, TypeScript for CDK stacks.

**Naming**: Lambda dirs kebab-case (`resume-parser`), Python files snake_case, CDK constructs PascalCase (`UserTable`), handler always `lambda_handler(event, context)`.

**Dependencies**: Check latest versions before writing dependency files. Pin Python exact (`boto3==x.y.z`), npm prod exact, npm dev caret.

**IAM (non-negotiable)**: One role per Lambda. Use CDK grant methods. Never wildcard actions or resources.

**Secrets (non-negotiable)**: Secrets Manager or SSM only. Pass via env vars. Never hardcode.

**Lambda handler pattern**: AWS clients at module level. Use `os.environ.get()` never `[]`. Validate env vars at start. Structured JSON logging via `logging` module, never `print()`. Keep handlers thin.

**DynamoDB**: `PAY_PER_REQUEST` billing, PITR enabled, encryption enabled, `RETAIN` removal policy for user data.

**S3**: `enforceSSL: true` always. CORS only when frontend needs direct bucket access.

**Amplify**: `WEB_COMPUTE` platform for Next.js SSR. Next.js 12-15 only (16+ not supported).

**CfnOutput**: Export every resource other stacks or the frontend consume.

**Build commands**: `cd backend && npm run build` → `cdk synth` → `cdk deploy` → `npm test`.

**PII**: Redact from CloudWatch logs. Use placeholders in test data.

See `references/spec.md` for complete code patterns, CORS setup, and CDK context variables.
