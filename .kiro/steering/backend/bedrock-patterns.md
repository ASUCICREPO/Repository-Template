---
inclusion: manual
---

# Bedrock Patterns

Guidance for implementing Amazon Bedrock in CDK projects. Covers model invocation, inference profiles, IAM permissions, streaming responses, and common pitfalls.

## Critical: Always Validate Model Availability First

**BEFORE writing any Bedrock code**, run these commands to discover available models and inference profiles:

```bash
# List all foundation models in your region
aws bedrock list-foundation-models --region AWS_REGION

# List all inference profiles (cross-region and standard)
aws bedrock list-inference-profiles --region AWS_REGION
```

This upfront validation prevents deploy-fail-fix cycles. You need to know:
- Which models are available in your region
- Whether to use foundation model IDs or inference profile IDs
- Which inference profile prefix (us., eu., etc.) to use

## Model Invocation: Foundation Models vs Inference Profiles

### Foundation Model IDs (Legacy Pattern)

Older models can be invoked directly with their foundation model ID:

```typescript
const modelId = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const modelArn = `arn:aws:bedrock:${this.region}::foundation-model/${modelId}`;
```

**Use for**: Claude 3.5 Sonnet (older versions), Claude 3 Opus, Claude 3 Haiku, Titan models, older model versions

### Inference Profiles (Required for Newer Models)

**Newer models like Claude Sonnet 4.6 CANNOT be invoked with foundation model IDs.** You must use an inference profile ID:

```typescript
// ❌ WRONG - This will fail for Claude Sonnet 4.6
const modelId = 'anthropic.claude-sonnet-4-6';

// ✅ CORRECT - Use inference profile ID
const inferenceProfileId = 'us.anthropic.claude-sonnet-4-6';
```

**Inference profile types:**

1. **Cross-region profiles** (prefix: `us.`, `eu.`, `ap.`)
   - Route requests across multiple regions for higher availability
   - Example: `us.anthropic.claude-sonnet-4-6` can route to us-east-1, us-east-2, us-west-2
   - Require IAM permissions for ALL regions in the routing pool

2. **Standard profiles** (no prefix)
   - Single-region invocation
   - Example: `anthropic.claude-sonnet-4-6-us-east-1`
   - Only need IAM permissions for that specific region

**Use inference profiles for**: Claude Sonnet 4.6, Claude Opus 4, Nova models, any model released after mid-2024

### How to Choose

```bash
# Check if model requires inference profile
aws bedrock list-foundation-models --region AWS_REGION

# If not found in foundation models, check inference profiles
aws bedrock list-inference-profiles --region AWS_REGION
```

If the model only appears in `list-inference-profiles`, you MUST use the inference profile ID.

## IAM Permissions for Inference Profiles

### Cross-Region Inference Profiles

Cross-region profiles (prefixed with `us.`, `eu.`, etc.) can route to ANY region in that geographic area. Your IAM policy MUST grant permissions for ALL possible regions:

```typescript
// ❌ WRONG - Only covers deployed region
chatFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: [
    `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-sonnet-4-6`,
  ],
}));

// ✅ CORRECT - Covers all US regions for cross-region profile
chatFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: [
    'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6',
    'arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-sonnet-4-6',
    'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-sonnet-4-6',
  ],
}));
```

**Why this matters**: A `us.` prefixed profile can route to us-east-1, us-east-2, or us-west-2 depending on availability. If your IAM policy only covers us-east-1 and the request routes to us-west-2, you get an authorization error.

### Standard Inference Profiles

Standard profiles (no prefix) only need permissions for their specific region:

```typescript
// Standard profile - single region
chatFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: [
    `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-sonnet-4-6`,
  ],
}));
```

### IAM Pattern for Multiple Models

```typescript
const bedrockModels = [
  'anthropic.claude-sonnet-4-6',  // Used by inference profile
  'amazon.titan-embed-text-v2:0', // Foundation model
];

const bedrockRegions = ['us-east-1', 'us-east-2', 'us-west-2'];

chatFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: bedrockRegions.flatMap(region =>
    bedrockModels.map(model =>
      `arn:aws:bedrock:${region}::foundation-model/${model}`
    )
  ),
}));
```

## Bedrock Converse API (Recommended)

Use the Converse API for unified model invocation across all Bedrock models:

```python
import boto3, json, os

bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('BEDROCK_REGION'))

def invoke_bedrock(model_id: str, messages: list, system: list = None, config: dict = None):
    """
    Invoke Bedrock model using Converse API.
    
    Args:
        model_id: Foundation model ID or inference profile ID
        messages: List of message dicts with 'role' and 'content'
        system: Optional system prompt list
        config: Optional inference config (temperature, maxTokens, etc.)
    """
    params = {
        'modelId': model_id,
        'messages': messages,
    }
    
    if system:
        params['system'] = system
    
    if config:
        params['inferenceConfig'] = config
    else:
        params['inferenceConfig'] = {
            'maxTokens': 4096,
            'temperature': 0.7,
        }
    
    response = bedrock.converse(**params)
    return response['output']['message']['content'][0]['text']

# Usage with inference profile
def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    user_message = body.get('message', '')
    
    messages = [
        {'role': 'user', 'content': [{'text': user_message}]}
    ]
    
    system = [{'text': 'You are a helpful assistant.'}]
    
    # Use inference profile ID for newer models
    response_text = invoke_bedrock(
        model_id='us.anthropic.claude-sonnet-4-6',
        messages=messages,
        system=system,
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({'response': response_text}),
    }
```

## Streaming Responses

For streaming responses (e.g., chatbot UIs), use `converse_stream`:

```python
def invoke_bedrock_stream(model_id: str, messages: list, system: list = None):
    """Stream Bedrock model response."""
    params = {
        'modelId': model_id,
        'messages': messages,
        'inferenceConfig': {'maxTokens': 4096, 'temperature': 0.7},
    }
    
    if system:
        params['system'] = system
    
    response = bedrock.converse_stream(**params)
    
    # Yield text chunks as they arrive
    for event in response['stream']:
        if 'contentBlockDelta' in event:
            delta = event['contentBlockDelta']['delta']
            if 'text' in delta:
                yield delta['text']

# Usage in Lambda with Function URL
def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    user_message = body.get('message', '')
    
    messages = [{'role': 'user', 'content': [{'text': user_message}]}]
    
    # Stream response
    full_response = ''
    for chunk in invoke_bedrock_stream('us.anthropic.claude-sonnet-4-6', messages):
        full_response += chunk
    
    return {
        'statusCode': 200,
        'body': json.dumps({'response': full_response}),
    }
```

For true streaming to the browser, use WebSocket API or API Gateway REST API V1 with Lambda streaming (see  #[[file:.kiro/steering/backend/api-gateway-patterns.md]]).

## CDK Stack Pattern

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as os from 'os';

// Detect host architecture for Lambda
const hostArch = os.arch();
const lambdaArch = hostArch === 'arm64' 
  ? lambda.Architecture.ARM_64 
  : lambda.Architecture.X86_64;

// Define Bedrock models and regions for cross-region inference profile
const bedrockModels = ['anthropic.claude-sonnet-4-6'];
const bedrockRegions = ['us-east-1', 'us-east-2', 'us-west-2'];

const chatFunction = new lambda.Function(this, 'ChatFunction', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'index.lambda_handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'chat')),
  timeout: cdk.Duration.minutes(5),
  architecture: lambdaArch,
  environment: {
    BEDROCK_REGION: this.region,
    MODEL_ID: 'us.anthropic.claude-sonnet-4-6',  // Inference profile ID
  },
});

// Grant Bedrock permissions for all regions (cross-region profile)
chatFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: bedrockRegions.flatMap(region =>
    bedrockModels.map(model =>
      `arn:aws:bedrock:${region}::foundation-model/${model}`
    )
  ),
}));

// Add Function URL with CORS (see cic-deployment agent for CORS best practices)
const functionUrl = chatFunction.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: [amplifyAppUrl, 'http://localhost:3000'],
    allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.OPTIONS],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: cdk.Duration.seconds(300),
  },
});

// Export Function URL
new cdk.CfnOutput(this, 'ChatFunctionUrl', {
  value: functionUrl.url,
  description: 'Chat Lambda Function URL',
});
```

## Environment Variables Pattern

Pass model configuration via environment variables for easy updates:

```typescript
environment: {
  BEDROCK_REGION: this.region,
  MODEL_ID: 'us.anthropic.claude-sonnet-4-6',
  MAX_TOKENS: '4096',
  TEMPERATURE: '0.7',
}
```

```python
import os

MODEL_ID = os.environ.get('MODEL_ID', 'us.anthropic.claude-sonnet-4-6')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '4096'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0.7'))
```

## Common Pitfalls

### 1. Using Foundation Model ID for Newer Models

**Problem**: Trying to invoke Claude Sonnet 4.6 with `anthropic.claude-sonnet-4-6` fails.

**Solution**: Use inference profile ID `us.anthropic.claude-sonnet-4-6`.

### 2. Missing IAM Permissions for Cross-Region Profiles

**Problem**: Intermittent authorization errors when using `us.` prefixed inference profiles.

**Solution**: Grant permissions for ALL US regions (us-east-1, us-east-2, us-west-2), not just your deployment region.

### 3. Not Validating Model Availability

**Problem**: Deploy fails because model isn't available in your region.

**Solution**: Run `aws bedrock list-foundation-models` and `aws bedrock list-inference-profiles` BEFORE writing code.

### 4. Hardcoding Model IDs

**Problem**: Difficult to switch models or test different configurations.

**Solution**: Use environment variables for model IDs and inference config.

## Model Selection Guide

| Model | Use Case | Invocation Method | Profile ID |
|-------|----------|-------------------|------------|
| Claude Sonnet 4.6 | Latest, most capable | Inference profile | `us.anthropic.claude-sonnet-4-6` |
| Claude 3.5 Sonnet | Balanced performance | Foundation model or profile | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| Claude 3 Opus | Complex reasoning | Foundation model | `anthropic.claude-3-opus-20240229-v1:0` |
| Claude 3 Haiku | Fast, cost-effective | Foundation model | `anthropic.claude-3-haiku-20240307-v1:0` |
| Nova Pro | AWS native, cost-effective | Inference profile | `us.amazon.nova-pro-v1:0` |
| Nova Lite | Fastest, cheapest | Inference profile | `us.amazon.nova-lite-v1:0` |
| Titan Text | Embeddings, simple tasks | Foundation model | `amazon.titan-text-express-v1` |

## Testing Bedrock Integration

```bash
# Test model invocation from CLI
aws bedrock-runtime converse \
  --model-id us.anthropic.claude-sonnet-4-6 \
  --messages '[{"role":"user","content":[{"text":"Hello"}]}]' \
  --region us-east-1

# Test Lambda function locally (requires AWS credentials)
aws lambda invoke \
  --function-name YourChatFunction \
  --payload '{"body":"{\"message\":\"Hello\"}"}' \
  response.json

# Check Lambda logs
aws logs tail /aws/lambda/YourChatFunction --follow
```

## cdk-nag Suppressions

```typescript
// Cross-region inference profile requires multiple region ARNs
NagSuppressions.addResourceSuppressions(chatFunction, [
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Cross-region inference profile requires permissions for all US regions (us-east-1, us-east-2, us-west-2)',
    appliesTo: ['Resource::arn:aws:bedrock:*::foundation-model/*'],
  },
]);
```

## References

- AWS Bedrock Converse API: Use `aws-knowledge-mcp-server` to search for latest Converse API docs
- Inference Profiles: Use `aws-knowledge-mcp-server` to search for "Bedrock inference profiles"
- Model IDs: Run `aws bedrock list-foundation-models` and `aws bedrock list-inference-profiles`
