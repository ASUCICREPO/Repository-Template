---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Backend Integration: AWS Services

Patterns for integrating with AWS services from the frontend (S3, Bedrock, Cognito).

## AWS Service Integration

**S3 uploads**: Use Cognito Identity Pool for credentials; `@aws-sdk/client-s3` with `PutObjectCommand`.

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: AWS_REGION }),
    identityPoolId: COGNITO_IDENTITY_POOL_ID
  })
});

export async function uploadFile(file: File, key: string) {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: key, Body: file, ContentType: file.type
  }));
  return key;
}
```

**Bedrock Agent Runtime**: Use `@aws-sdk/client-bedrock-agent-runtime` with `InvokeAgentCommand`.

```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

const client = new BedrockAgentRuntimeClient({ region: AWS_REGION, credentials: /* ... */ });

export async function invokeAgent(prompt: string, sessionId: string) {
  return await client.send(new InvokeAgentCommand({
    agentId: AGENT_ID, agentAliasId: AGENT_ALIAS_ID, sessionId, inputText: prompt
  }));
}
```

## Security

**CORS**: Lambda Function URLs must have proper CORS config (allowOrigins, allowMethods, allowHeaders, maxAge).

**Input sanitization**: Trim, remove HTML tags, limit length before sending.

```typescript
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 10000);
}
```

**Credential management**: Use Cognito Identity Pool for AWS SDK; use Lambda Function URLs for API access; store sensitive config in environment variables; validate at build time; never expose credentials in frontend.
