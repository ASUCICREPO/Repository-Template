---
inclusion: fileMatch
fileMatchPattern: "backend/**/*"
---

# CIC Backend Standards

**Languages**: Lambdas (Python), CDK stack (TypeScript).
**Architecture**: Single stack unless complexity requires otherwise; serverless-first, cost-effective, resilient. Always use latest AWS resources/services; verify with `aws-knowledge-mcp-server` for latest updates. Optimize for fewer resources while maintaining clarity.
**Naming**: Lambda dirs (kebab-case: `resume-parser`), Python files (snake_case), CDK constructs (PascalCase: `UserTable`), Handler (always `lambda_handler(event, context)`).

## Dependency Versions

**Check latest versions BEFORE writing dependency files:**
- npm: `npm view <package-name> version`
- Python: Use Context7 or web search for PyPI versions
- AWS: Use AWS documentation tools for latest runtimes

**Version pinning:**
- Python: Exact versions (`boto3==x.y.z`)
- npm production: Exact versions (`"next": "x.y.z"`)
- npm dev: Caret for minor updates (`"typescript": "^x.y.z"`)

## Build & Test Commands

- Build: `cd backend && npm run build`
- Synth (runs cdk-nag): `cd backend && cdk synth`
- Deploy: `cd backend && cdk deploy`
- Test: `cd backend && npm test`

## Security Requirements (Non-Negotiable)

**IAM**: Never use wildcard actions/resources. Use CDK grant methods. One role per Lambda.
**Secrets**: Store in Secrets Manager or SSM. Reference via env vars. Never hardcode.
**Encryption**: Enable at rest (DynamoDB, S3, EFS). Enforce HTTPS/TLS. `enforceSSL: true` on S3.
**PII**: Redact from CloudWatch logs. Use placeholders in test data.
**Authentication**: Cognito for user auth. Validate JWT tokens.

## CDK Context Variables

Use `tryGetContext` for deployment-specific config. Validate required vars at stack top; throw if missing.

## CORS

Construct frontend URL early from Amplify `appId`. Use `amplifyAppUrl` + `http://localhost:3000` as allowed origins. Every Lambda response must include CORS headers (including errors). Handle `OPTIONS` for preflight.

## Lambda Functions

**Handler Pattern**: AWS clients at module level; `os.environ.get()` never `[]`; validate env vars at start; consistent response shape; structured JSON logging via `logging` module (never `print()`); keep handlers thin.

**CDK Definition**: Latest supported Python runtime; detect host architecture dynamically; explicit timeout; pass resource names via environment (not ARNs).

```typescript
const hostArch = os.arch();
const lambdaArch = hostArch === "arm64" ? lambda.Architecture.ARM_64 : lambda.Architecture.X86_64;
```

## DynamoDB

`PAY_PER_REQUEST` billing; point-in-time recovery and encryption enabled; `RETAIN` removal policy for user data; use CDK grant methods.

## S3

Always `enforceSSL: true`; add CORS only when frontend needs direct bucket access; use CDK grant methods.

## Amplify

**Platform**: `WEB_COMPUTE` for Next.js SSR. No custom rewrite rules for SSR apps.
**Next.js version**: Amplify supports 12-15 only. Do NOT use 16+.
**Monorepo**: Set `AMPLIFY_MONOREPO_APP_ROOT` on app and branch.
**Auto-build on CDK deploy**: Use `AwsCustomResource` calling `amplify:StartJob`.

## CfnOutput

Export every resource frontend/other stacks consume: API URLs, Function URLs, S3 bucket names, DynamoDB table names, Amplify app URL.

## IAM

Use CDK grant methods first; for Bedrock use explicit policy statements with specific model ARNs; least privilege always.

## Cross-references

- API Gateway patterns: #[[file:.kiro/steering/backend/api-gateway-patterns.md]]
- Bedrock patterns: #[[file:.kiro/steering/backend/bedrock-patterns.md]]
- RAG/S3 Vectors: #[[file:.kiro/steering/backend/s3-vectors-rag-chatbot.md]]
- Architecture diagrams: #[[file:.kiro/steering/architecture-diagrams.md]]
- Security: #[[file:.kiro/steering/security/security-iam-secrets.md]]
