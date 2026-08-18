---
inclusion: manual
---

# Security: Operations & Resilience

## 7. Error Handling, Resilience, and Observability

| Practice | Detail |
|---|---|
| **Structured logging** | JSON-formatted logs: `timestamp`, `request_id`, `step`, `status`, `error_type`, `message`. |
| **Correlate across services** | Pass correlation ID through every Lambda invocation and log it. |
| **Configure DLQs** | Every SQS queue and Lambda event source must have a dead-letter queue. |
| **Retry with backoff** | Exponential backoff with jitter for external API calls. |
| **Don't swallow errors** | Never catch and silently continue. Log it, optionally re-raise. |
| **Set alarms** | CloudWatch alarms for: Lambda errors, Step Functions failures, DLQ count > 0. |
| **Pass status in state** | Structured status objects, not just success/fail booleans. |
