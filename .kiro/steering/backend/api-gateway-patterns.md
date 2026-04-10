---
inclusion: manual
---

# API Gateway Patterns

Guidance for implementing API Gateway (REST API V1 and HTTP API V2) in CDK projects. Covers when to use each type, streaming support, authentication, CORS, and Lambda integration patterns.

## When to Use API Gateway vs Lambda Function URLs

**Use API Gateway when:**
- Need advanced features: request validation, API keys, usage plans, caching
- Require multiple authorization methods (Cognito, IAM, Lambda authorizers)
- Building public-facing APIs with rate limiting/throttling
- Need request/response transformation
- Want centralized API management and monitoring
- **Need response streaming** (REST API V1 supports streaming as of Nov 19, 2025)

**Use Lambda Function URLs when:**
- Simple, single-function endpoints
- Internal/private APIs with basic auth
- Rapid prototyping
- Cost-sensitive projects (no API Gateway charges)
- Don't need advanced API Gateway features

## API Gateway Types

### REST API (V1)
- **Streaming support**: ✅ Yes (as of Nov 19, 2025) with HTTP_PROXY, Lambda, and private integrations
- **Use for**: Production APIs, streaming responses, complex routing, request validation
- **Features**: Full feature set, caching, API keys, usage plans, request/response transformation
- **Cost**: Higher (~$3.50 per million requests)

### HTTP API (V2)
- **Streaming support**: ⚠️ Limited (not natively supported for all backend integrations)
- **Use for**: Simple APIs, cost optimization, JWT auth, basic routing
- **Features**: Simplified, faster, cheaper, built-in JWT authorizers
- **Cost**: Lower (~$1.00 per million requests, 70% cheaper than REST API)

**Decision matrix:**
- Need streaming? → REST API V1
- Need advanced features (caching, API keys, usage plans)? → REST API V1
- Simple API with JWT auth? → HTTP API V2
- Cost-sensitive? → HTTP API V2

## HTTP API (V2) Implementation

**Key components:**
- `apigatewayv2.HttpApi` - Main API construct
- `HttpLambdaIntegration` - Lambda integration for routes
- `HttpJwtAuthorizer` - Cognito JWT authentication
- Access logging via CloudWatch log group (CDK-Nag APIG1)

**Setup pattern:**
1. Create CloudWatch log group for access logs
2. Create HttpApi with CORS configuration
3. Configure access logging on default stage (cast to `CfnStage`)
4. Create JWT authorizer pointing to Cognito user pool
5. Add routes with `api.addRoutes()` (path, methods, integration, optional authorizer)
6. Export API URL via CfnOutput

**Route structure:**
- Public routes: No authorizer parameter
- Protected routes: Include `authorizer: cognitoAuthorizer`
- Use `HttpLambdaIntegration` for Lambda backends

## Lambda Handler Pattern

**Event format differences:**
- HTTP API V2: `event.rawPath`, `event.requestContext.http.method`
- REST API V1: `event.path`, `event.httpMethod`

**Multi-endpoint pattern (recommended):**
- Single Lambda handles multiple related endpoints via path routing
- Use switch/case on path to route to appropriate handler function
- Benefits: Shared initialization, fewer cold starts, consistent error handling

**Handler structure:**
1. Extract path and method (handle both V1/V2 formats)
2. Route by HTTP method (GET, POST, PUT, DELETE, OPTIONS)
3. Within method handler, route by path
4. Return standardized response with CORS headers
5. Catch errors, log server-side, return generic client message

**User authentication:**
- HTTP API V2: `event.requestContext.authorizer.jwt.claims`
- REST API V1: `event.requestContext.authorizer.claims`
- Access user ID via `claims.sub`, email via `claims.email`

**Response format:**
```javascript
{
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  body: JSON.stringify(data)
}
```

## REST API (V1) Implementation

**Key components:**
- `apigateway.RestApi` - Main API construct
- `apigateway.LambdaIntegration` - Lambda integration for methods (standard and streaming)
- `apigateway.CognitoUserPoolsAuthorizer` - Cognito authentication
- Access logging via `deployOptions.accessLogDestination`

**Setup pattern:**
1. Create CloudWatch log group for access logs
2. Create RestApi with `deployOptions` (stage, logging, tracing)
3. Configure `defaultCorsPreflightOptions` for CORS
4. Create Cognito authorizer from user pool
5. Add resources with `api.root.addResource()`
6. Add methods with `resource.addMethod()` (HTTP method, integration, optional auth)
7. Export API URL via CfnOutput

**Resource structure:**
- Build resource tree: `api.root.addResource('admin').addResource('metrics')`
- Public methods: No authorizer/authorizationType
- Protected methods: Include `authorizer` and `authorizationType: COGNITO`
- Streaming: Use `LambdaIntegration` with Lambda response streaming (see below)

## Response Streaming (REST API V1)

**As of Nov 19, 2025**, REST API V1 supports response streaming with Lambda integrations. Use `awslambda.streamifyResponse` wrapper for streaming responses.

**Lambda handler pattern (Node.js):**

```javascript
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  // Write HTTP status and padding
  responseStream.write('{"statusCode": 200}');
  responseStream.write("\x00".repeat(8));

  try {
    const message = event.body ? JSON.parse(event.body).message : event.message;

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: 'us.amazon.nova-lite-v1:0',
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", content: [{ text: message }] }],
        inferenceConfig: { max_new_tokens: 4096, temperature: 0.7 }
      })
    });

    const response = await bedrockClient.send(command);

    // Stream response chunks
    for await (const chunk of response.body) {
      const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk?.bytes));
      if (chunkData.contentBlockDelta?.delta?.text) {
        responseStream.write(chunkData.contentBlockDelta.delta.text);
      }
    }
  } catch (error) {
    responseStream.write(`Error: ${error.message}`);
  } finally {
    responseStream.end();
  }
});
```

**CDK configuration for streaming Lambda:**

```typescript
const streamingFunction = new lambda.Function(this, 'StreamingFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'streaming')),
  timeout: cdk.Duration.minutes(5),
  environment: {
    BEDROCK_REGION: this.region,
  },
});

// Grant Bedrock model invocation
streamingFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModelWithResponseStream'],
  resources: [`arn:aws:bedrock:${this.region}::foundation-model/us.amazon.nova-lite-v1:0`],
}));

// Add to API Gateway with standard LambdaIntegration
const streamResource = api.root.addResource('stream');
streamResource.addMethod('POST', new apigateway.LambdaIntegration(streamingFunction, {
  proxy: true,
}));
```

**Key requirements:**
- Use `awslambda.streamifyResponse` wrapper (Node.js runtime only)
- Write status code and 8-byte padding before streaming content
- Call `responseStream.end()` when done
- Use `LambdaIntegration` with `proxy: true` (standard integration, not HttpIntegration)
- Bedrock streaming requires `InvokeModelWithResponseStreamCommand`

### Lambda Handler Pattern for REST API

```javascript
/**
 * Lambda handler for REST API (V1) routes
 */
exports.handler = async (event) => {
  console.log('Handler invoked:', JSON.stringify(event, null, 2));

  try {
    const path = event.path;
    const method = event.httpMethod;

    // REST API provides user info in event.requestContext.authorizer.claims

    if (method === 'GET') {
      return await handleGetRequest(path, event);
    } else if (method === 'POST') {
      return await handlePostRequest(path, event);
    } else if (method === 'OPTIONS') {
      return createResponse(200, '');
    } else {
      return createResponse(405, {
        error: 'Method not allowed',
      });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return createResponse(500, {
      error: 'Internal server error',
    });
  }
};

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:3000',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}
```

## Authentication Patterns

### Cognito JWT (HTTP API V2)

```typescript
// In CDK stack
const cognitoAuthorizer = new HttpJwtAuthorizer('CognitoAuthorizer', 
  `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`, {
  jwtAudience: [userPoolClient.userPoolClientId],
});

// Apply to routes
api.addRoutes({
  path: '/admin/metrics',
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new HttpLambdaIntegration('MetricsIntegration', adminFunction),
  authorizer: cognitoAuthorizer,
});
```

```javascript
// In Lambda handler - access user claims
const claims = event.requestContext?.authorizer?.jwt?.claims;
const userId = claims?.sub;
const email = claims?.email;
```

### Cognito User Pools (REST API V1)

```typescript
// In CDK stack
const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
  this,
  'CognitoAuthorizer',
  {
    cognitoUserPools: [userPool],
  }
);

// Apply to methods
metricsResource.addMethod(
  'GET',
  new apigateway.LambdaIntegration(adminFunction),
  {
    authorizer: cognitoAuthorizer,
    authorizationType: apigateway.AuthorizationType.COGNITO,
  }
);
```

```javascript
// In Lambda handler - access user claims
const claims = event.requestContext?.authorizer?.claims;
const userId = claims?.sub;
const email = claims?.email;
```

## CORS Configuration

### HTTP API (V2) - Built-in CORS

```typescript
const api = new apigatewayv2.HttpApi(this, 'HttpApi', {
  corsPreflight: {
    allowOrigins: [amplifyAppUrl, 'http://localhost:3000'],
    allowMethods: [
      apigatewayv2.CorsHttpMethod.GET,
      apigatewayv2.CorsHttpMethod.POST,
      apigatewayv2.CorsHttpMethod.PUT,
      apigatewayv2.CorsHttpMethod.DELETE,
      apigatewayv2.CorsHttpMethod.OPTIONS,
    ],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
    allowCredentials: true,
  },
});
```

### REST API (V1) - Default CORS

```typescript
const api = new apigateway.RestApi(this, 'RestApi', {
  defaultCorsPreflightOptions: {
    allowOrigins: [amplifyAppUrl, 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
    allowCredentials: true,
  },
});
```

### Lambda Response Headers (Always Required)

Even with API Gateway CORS, Lambda responses MUST include CORS headers:

```javascript
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGIN || 'https://your-frontend-domain.com',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}
```

## Lambda Permissions

API Gateway needs permission to invoke Lambda functions:

```typescript
// HTTP API (V2)
chatFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

// REST API (V1) - handled automatically by LambdaIntegration
// No explicit grant needed
```

## cdk-nag Suppressions

```typescript
// API Gateway access logging (if not using log group)
NagSuppressions.addResourceSuppressions(api, [
  {
    id: 'AwsSolutions-APIG1',
    reason: 'Access logging configured via CloudWatch log group',
  },
]);

// API Gateway authorization (for public endpoints)
NagSuppressions.addResourceSuppressions(chatResource, [
  {
    id: 'AwsSolutions-APIG4',
    reason: 'Public chat endpoint - no authorization required',
  },
  {
    id: 'AwsSolutions-COG4',
    reason: 'Public chat endpoint - no Cognito authorization required',
  },
], true);
```

## Cost Comparison

**HTTP API (V2):**
- $1.00 per million requests
- $0.09 per GB data transfer (out)
- No caching charges

**REST API (V1):**
- $3.50 per million requests
- $0.09 per GB data transfer (out)
- Caching: $0.02/hour per GB

**Lambda Function URLs:**
- No API Gateway charges
- Only Lambda invocation + data transfer

## Common Patterns

### Multi-Endpoint Lambda (Recommended)

One Lambda handles multiple related endpoints via path routing:

```javascript
async function handleGetRequest(path, event) {
  switch (path) {
    case '/admin/metrics':
      return await getMetrics();
    case '/admin/dashboard':
      return await getDashboard();
    case '/admin/users':
      return await getUsers();
    default:
      return createResponse(404, { error: 'Not found' });
  }
}
```

**Benefits:**
- Fewer Lambda functions to manage
- Shared initialization (DynamoDB clients, etc.)
- Consistent error handling
- Lower cold start impact

### Single-Purpose Lambda

One Lambda per endpoint:

```typescript
api.addRoutes({
  path: '/metrics',
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new HttpLambdaIntegration('MetricsIntegration', metricsFunction),
});

api.addRoutes({
  path: '/dashboard',
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new HttpLambdaIntegration('DashboardIntegration', dashboardFunction),
});
```

**Benefits:**
- Clear separation of concerns
- Independent scaling
- Easier to test
- Simpler code per function

## Monitoring and Logging

### CloudWatch Metrics

Both API types provide metrics:
- `Count` - Number of API calls
- `IntegrationLatency` - Backend processing time
- `Latency` - Total request time
- `4XXError` - Client errors
- `5XXError` - Server errors

### Access Logs

Always enable access logging (CDK-Nag APIG1):

```typescript
const apiLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
  logGroupName: `/aws/apigateway/${projectPrefix}-api`,
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// HTTP API
const defaultStage = api.defaultStage?.node.defaultChild as apigatewayv2.CfnStage;
if (defaultStage) {
  defaultStage.accessLogSettings = {
    destinationArn: apiLogGroup.logGroupArn,
    format: JSON.stringify({
      requestId: '$context.requestId',
      ip: '$context.identity.sourceIp',
      requestTime: '$context.requestTime',
      httpMethod: '$context.httpMethod',
      routeKey: '$context.routeKey',
      status: '$context.status',
    }),
  };
}

// REST API
const api = new apigateway.RestApi(this, 'RestApi', {
  deployOptions: {
    accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
    accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
  },
});
```