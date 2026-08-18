---
name: bedrock-patterns
description: Implement AWS Bedrock model invocations following CIC standards. Triggered by: Bedrock, foundation model, inference profile, Converse API, AI model invocation, Nova, Titan, Claude on AWS.
---

Read `references/spec.md` before any Bedrock implementation.

**Critical first step**: Validate model availability BEFORE writing code:
```bash
aws bedrock list-foundation-models --region AWS_REGION
aws bedrock list-inference-profiles --region AWS_REGION
```

**Foundation models vs inference profiles**:
- Foundation model IDs (legacy): older models like Claude 3.5 Sonnet, Titan
- Inference profiles (required for newer models): Claude Sonnet 4.6, Claude Opus 4, Nova models — use `us.` prefix for cross-region routing

**Model selection priority**:
1. AWS Nova models (no marketplace subscription)
2. AWS Titan models (no marketplace subscription)
3. Third-party models (Claude, etc.) — only if explicitly requested

**API**: Use Converse API for all models. `converse` for sync, `converse_stream` for streaming.

**IAM for cross-region profiles**: `us.` prefix routes to any US region. Grant IAM across all three US regions (us-east-1, us-east-2, us-west-2) for all model ARNs.

**Never hardcode model IDs** — pass via environment variables.

**Common pitfalls**:
1. Using foundation model ID for newer models → use inference profile ID instead
2. Missing IAM for cross-region profiles → grant all US regions
3. Not checking availability first → run list commands before coding

Use `aws-knowledge-mcp-server` for latest Converse API docs and inference profile documentation.

See `references/spec.md` for complete IAM patterns and CDK examples.
