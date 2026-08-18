---
name: security-operations
description: Apply CIC operational security standards for structured logging, DLQs, retry with backoff, and CloudWatch alarms. Triggered by: Lambda handler, SQS consumer, error handling, DLQ setup, CloudWatch alarm, structured logging, resilience, retry logic.
---

Read `references/spec.md` for CDK alarm constructs and retry helper patterns.

**Structured logging (required in every Lambda handler)**:

Every log entry must be JSON with these fields:
```json
{
  "timestamp": "ISO-8601",
  "request_id": "<from Lambda context>",
  "step": "<current operation name>",
  "status": "success | error",
  "error_type": "<if applicable>",
  "message": "<human readable>"
}
```

Use Python's `logging` module with JSON formatting. Never use `print()`.

**Resilience requirements**:
- DLQ on every SQS queue and every Lambda event source mapping
- Retry external API calls with exponential backoff + jitter (never fixed sleep)
- Never catch and silently continue — log the error, optionally re-raise
- Pass a correlation ID through every Lambda invocation and log it

**Monitoring (all three required)**:
- CloudWatch alarm: Lambda error rate threshold
- CloudWatch alarm: Step Functions execution failures
- CloudWatch alarm: DLQ message count > 0

**Status passing**: Use structured status objects in state — not just boolean success/fail.

See `references/spec.md` for CDK alarm and retry implementation examples.
