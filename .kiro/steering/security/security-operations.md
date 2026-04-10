---
inclusion: manual
---

# Security: Operations & Resilience

Error handling, resilience, observability, and operational security best practices for CIC projects.

## 7. Error Handling, Resilience, and Observability

| Practice | Detail |
|---|---|
| **Structured logging** | Use JSON-formatted logs with consistent fields: `timestamp`, `request_id`, `step`, `status`, `error_type`, `message`. |
| **Correlate across services** | Pass a correlation ID (e.g., the Step Functions execution ID) through every Lambda invocation and log it. |
| **Configure DLQs** | Every SQS queue and Lambda event source must have a dead-letter queue. |
| **Retry with backoff** | Use exponential backoff with jitter for external API calls. Configure Step Functions retry policies on every task state. |
| **Don't swallow errors** | Never catch an exception and silently continue. Log it, optionally re-raise it, and ensure the pipeline state reflects the failure. |
| **Set alarms** | Create CloudWatch alarms for: Lambda errors, Step Functions failed executions, DLQ message count > 0, and external API error rates. |
| **Pass status in state** | Step Functions state should carry structured status objects, not just success/fail booleans. Include error codes and messages. |

### Example: Step Functions Retry Configuration

```json
{
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke",
  "Retry": [
    {
      "ErrorEquals": ["ServiceUnavailable", "TooManyRequestsException"],
      "IntervalSeconds": 5,
      "MaxAttempts": 3,
      "BackoffRate": 2.0
    }
  ],
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "ResultPath": "$.error",
      "Next": "HandleFailure"
    }
  ]
}
```
