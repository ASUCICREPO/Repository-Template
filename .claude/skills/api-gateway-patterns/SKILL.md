---
name: api-gateway-patterns
description: Choose and implement the correct API Gateway pattern for CIC projects. Triggered by: API Gateway, HTTP API, REST API, Lambda Function URLs, adding endpoints, CORS configuration, JWT auth, response streaming.
---

Read `references/spec.md` before choosing an API pattern.

**Decision rules**:
- Need streaming responses? → REST API V1 (`awslambda.streamifyResponse`)
- Need caching, API keys, or usage plans? → REST API V1
- Simple JWT-authenticated API? → HTTP API V2 (70% cheaper, ~$1/M requests)
- Simple endpoint, internal, or cost-sensitive? → Lambda Function URLs

**CORS**: Specific origins only (Amplify URL + `http://localhost:3000`). Never wildcard `*`. Lambda responses MUST include CORS headers even when API Gateway CORS is configured.

**Authentication**:
- HTTP API V2: `HttpJwtAuthorizer` with Cognito. Claims at `event.requestContext.authorizer.jwt.claims`.
- REST API V1: `CognitoUserPoolsAuthorizer`. Claims at `event.requestContext.authorizer.claims`.

**Response streaming (REST V1)**: Use `awslambda.streamifyResponse` wrapper (Node.js). Write status code and 8-byte padding before streaming. Use `LambdaIntegration` with `proxy: true`.

**Multi-endpoint Lambda (recommended)**: Single Lambda handles multiple related endpoints via path routing — fewer cold starts, shared init, consistent error handling.

**Monitoring**: Enable access logging (required for CDK-Nag APIG1). CloudWatch metrics: Count, IntegrationLatency, Latency, 4XXError, 5XXError.

See `references/spec.md` for CDK code patterns and monitoring setup.
