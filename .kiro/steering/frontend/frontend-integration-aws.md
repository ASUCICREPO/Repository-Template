---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Backend Integration: AWS Services

Patterns for integrating with AWS services from the frontend (S3, Bedrock, Cognito).

## AWS Service Integration

**S3 uploads**: Use Cognito Identity Pool for credentials; `@aws-sdk/client-s3` with `PutObjectCommand`.

**Bedrock Agent Runtime**: Use `@aws-sdk/client-bedrock-agent-runtime` with `InvokeAgentCommand`.

## Security

**CORS**: Lambda Function URLs must have proper CORS config (allowOrigins, allowMethods, allowHeaders, maxAge).

**Input sanitization**: Trim, remove HTML tags, limit length before sending.

**Credential management**: Use Cognito Identity Pool for AWS SDK; use Lambda Function URLs for API access; store sensitive config in environment variables; never expose credentials in frontend.
