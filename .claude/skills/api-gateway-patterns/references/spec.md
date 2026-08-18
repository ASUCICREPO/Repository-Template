# API Gateway Patterns — Full Reference

Guidance for API Gateway (REST API V1 and HTTP API V2) in CDK projects.

## When to Use API Gateway vs Lambda Function URLs

**API Gateway**: Advanced features (validation, API keys, caching), multiple auth methods, rate limiting, streaming (REST V1).
**Lambda Function URLs**: Simple endpoints, internal APIs, rapid prototyping, cost-sensitive.

## API Gateway Types

**REST API (V1)**: Full features, streaming (Nov 2025+), caching, ~$3.50/M requests.
**HTTP API (V2)**: Simpler, JWT auth, ~$1.00/M requests (70% cheaper).

**Decision**: Need streaming? → REST V1. Need caching/API keys? → REST V1. Simple JWT API? → HTTP V2. Cost-sensitive? → HTTP V2.

## CORS Configuration

Use specific origins (Amplify URL + localhost:3000), never wildcard `*`. Lambda responses MUST include CORS headers even with API Gateway CORS config.

## Authentication

**HTTP API V2**: `HttpJwtAuthorizer` with Cognito. Claims at `event.requestContext.authorizer.jwt.claims`.
**REST API V1**: `CognitoUserPoolsAuthorizer`. Claims at `event.requestContext.authorizer.claims`.

## Response Streaming (REST API V1)

Use `awslambda.streamifyResponse` wrapper (Node.js). Write status code and 8-byte padding before streaming. Use `LambdaIntegration` with `proxy: true`.

## Multi-Endpoint Lambda (Recommended)

Single Lambda handles multiple related endpoints via path routing. Benefits: shared initialization, fewer cold starts, consistent error handling.

## Monitoring

Enable access logging (CDK-Nag APIG1). CloudWatch metrics: Count, IntegrationLatency, Latency, 4XXError, 5XXError.
