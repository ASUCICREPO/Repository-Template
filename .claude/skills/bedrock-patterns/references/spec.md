# Bedrock Patterns — Full Reference

Guidance for Amazon Bedrock in CDK projects. Covers model invocation, inference profiles, IAM, streaming, and pitfalls.

## Critical: Validate Model Availability First

BEFORE writing any Bedrock code:
```bash
aws bedrock list-foundation-models --region AWS_REGION
aws bedrock list-inference-profiles --region AWS_REGION
```

## Foundation Models vs Inference Profiles

**Foundation model IDs** (legacy): Direct invocation for older models (Claude 3.5 Sonnet, Titan).
**Inference profiles** (required for newer models): Claude Sonnet 4.6, Claude Opus 4, Nova models. Use `us.` prefix for cross-region routing.

## IAM for Cross-Region Profiles

Cross-region profiles (`us.` prefix) can route to ANY US region. IAM MUST cover all regions:
```typescript
resources: ['us-east-1', 'us-east-2', 'us-west-2'].flatMap(region =>
  models.map(model => `arn:aws:bedrock:${region}::foundation-model/${model}`)
)
```

## Converse API (Recommended)

Unified invocation across all Bedrock models. Use `converse` for sync, `converse_stream` for streaming.

## Model Selection Priority

1. AWS Nova models (no marketplace subscription needed)
2. AWS Titan models (no marketplace subscription needed)
3. Third-party models (Claude, etc.) — only if explicitly requested

## Common Pitfalls

1. Using foundation model ID for newer models → Use inference profile ID
2. Missing IAM for cross-region profiles → Grant all US regions
3. Not validating availability → Run list commands BEFORE coding
4. Hardcoding model IDs → Use environment variables

## References

Use `aws-knowledge-mcp-server` for latest Converse API docs and inference profile documentation.
