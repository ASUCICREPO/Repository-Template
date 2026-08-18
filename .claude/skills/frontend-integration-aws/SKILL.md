---
name: frontend-integration-aws
description: Integrate Next.js with AWS services including S3 direct uploads and Bedrock Agent Runtime. Triggered by: S3 upload from browser, file upload to S3, Bedrock agent from frontend, Cognito Identity Pool, AWS SDK in frontend.
---

Read `references/spec.md` for CDK CORS config and frontend SDK patterns.

**S3 direct uploads**:
- Use Cognito Identity Pool for temporary AWS credentials (not server-side presigned URLs)
- Install `@aws-sdk/client-s3`
- Use `PutObjectCommand` with credentials from Identity Pool
- Require CORS configuration on the S3 bucket (allowOrigins, allowMethods, allowHeaders)

**Bedrock Agent Runtime**:
- Install `@aws-sdk/client-bedrock-agent-runtime`
- Use `InvokeAgentCommand` with credentials from Cognito Identity Pool

**Credential management rules**:
- Never expose AWS credentials in frontend code or environment variables
- All AWS SDK access goes through Cognito Identity Pool
- API access goes through Lambda Function URLs (no direct AWS service calls from browser except S3)
- Store sensitive config in environment variables (server-side only)

**Input sanitization before any AWS call**: Trim whitespace, remove HTML tags, limit input length.

See `references/spec.md` for complete Identity Pool setup and CORS configuration.
