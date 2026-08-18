# Backend Integration: Error Handling & Performance — Full Reference

Patterns for error handling, retry logic, performance optimization, testing, and monitoring.

## Error Handling

Use AbortController for timeout (30s); parse error responses; map network/timeout/HTTP errors to user-friendly messages.

**User-friendly messages**: Timeout → "Request timed out"; Network → "Network connection failed"; 5xx → "Server error"; 4xx → "Request error".

## Retry and Resilience

Retry on 5xx errors with exponential backoff (1s, 2s, 4s); don't retry 4xx client errors; max 3 attempts. Allow users to retry failed messages.

## Performance

**Request debouncing**: Prevent duplicate requests with timeout-based debounce.

**Response caching**: Cache API responses with TTL (5 min); check timestamp before returning cached data.

## Testing

Mock API responses with `jest.fn()`; test streaming flows; verify chunks received; check completion.

## Monitoring and Logging

Structured logging with info/error/debug levels; track API call duration; log completion/failure with metrics.
