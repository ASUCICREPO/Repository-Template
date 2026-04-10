---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Backend Integration: Error Handling & Performance

Patterns for error handling, retry logic, performance optimization, testing, and monitoring.

## Error Handling

**Comprehensive pattern**: Use AbortController for timeout (30s); parse error responses; map network/timeout/HTTP errors to user-friendly messages.

```typescript
async function apiCall(endpoint: string, payload: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
      if (error.message.includes('Failed to fetch')) throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

**User-friendly messages**: Timeout → "Request timed out. Server may be busy"; Network → "Network connection failed. Check internet"; 5xx → "Server error. Try again in a few minutes"; 4xx → "Request error. Check input".

## Retry and Resilience

**Automatic retry**: Retry on 5xx errors with exponential backoff (1s, 2s, 4s); don't retry 4xx client errors; max 3 attempts.

```typescript
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 400 && response.status < 500) throw new Error(`Client error: ${response.status}`);
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      if (lastError.message.includes('Client error')) throw lastError;
    }
    if (i < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }
  throw lastError!;
}
```

**User-initiated retry**: Allow users to retry failed messages; find previous user message and resend.

```typescript
const retryMessage = (messageId: string) => {
  const errorIndex = messages.findIndex(m => m.id === messageId);
  if (errorIndex > 0) {
    const userMessage = messages[errorIndex - 1];
    if (userMessage.role === 'user') {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      sendMessage(userMessage.content);
    }
  }
};
```

## Performance

**Request debouncing**: Prevent duplicate requests with timeout-based debounce.

```typescript
import { useCallback, useRef } from 'react';

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}
```

**Response caching**: Cache API responses with TTL (5 min); check timestamp before returning cached data.

```typescript
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchWithCache(key: string, fetcher: () => Promise<any>) {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  const data = await fetcher();
  responseCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## Testing

**Mock API responses**: Create mock handlers with jest.fn(); implement test behavior.

```typescript
// __mocks__/apiService.ts
export const mockStreamResponse = jest.fn();

// In tests
import { mockStreamResponse } from '@/__mocks__/apiService';
mockStreamResponse.mockImplementation((payload, onChunk) => {
  onChunk({ type: 'text-delta', data: 'Hello' });
  onChunk({ type: 'finish' });
});
```

**Integration tests**: Test streaming flows; verify chunks received; check completion.

```typescript
describe('Chat API Integration', () => {
  it('should handle streaming response', async () => {
    const chunks: string[] = [];
    await streamResponse(
      { query: 'test', session_id: 'test-123' },
      (event) => { if (event.type === 'text-delta') chunks.push(event.data); },
      (error) => fail(error), () => {}
    );
    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

## Monitoring and Logging

**Structured logging**: Implement info/error/debug levels; send errors to monitoring service if configured.

```typescript
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to monitoring service if configured
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') console.debug(`[DEBUG] ${message}`, data);
  }
};
```

**Performance tracking**: Track API call duration; log completion/failure with metrics.

```typescript
async function trackedFetch(url: string, options: RequestInit) {
  const startTime = performance.now();
  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;
    logger.info('API call completed', { url, duration, status: response.status });
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('API call failed', { url, duration, error });
    throw error;
  }
}
```
