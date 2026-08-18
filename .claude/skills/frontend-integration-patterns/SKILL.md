---
name: frontend-integration-patterns
description: Apply CIC error handling, retry logic, debouncing, and caching patterns in Next.js API clients. Triggered by: error handling in API calls, retry on failure, request debouncing, response caching, API client patterns, network error handling.
---

Read `references/spec.md` for complete code patterns and Jest mock examples.

**Error handling**:
- Use `AbortController` with 30-second timeout on all fetch calls
- Parse error responses from the server — don't expose raw errors to users
- User-friendly error messages:
  - Timeout → "Request timed out. Please try again."
  - Network failure → "Network connection failed."
  - 5xx → "Server error. Please try again."
  - 4xx → "Request error." (show specific message if safe)

**Retry logic**:
- Retry on 5xx errors only (not 4xx — those are client errors)
- Exponential backoff: 1s → 2s → 4s delays
- Max 3 attempts
- Always allow users to retry failed messages manually

**Performance**:
- Debounce user-triggered requests with timeout-based debounce to prevent duplicates
- Cache API responses with 5-minute TTL — check timestamp before returning cached data

**Monitoring and logging** (structured):
```json
{"level": "info|error|debug", "timestamp": "ISO-8601", "message": "...", "duration": 0, "status": 200}
```
Track API call duration. Log completion and failure with metrics.

**Testing**: Mock API responses with `jest.fn()`. Test streaming flows. Verify chunks received and completion state.

See `references/spec.md` for debounce/cache implementation examples.
