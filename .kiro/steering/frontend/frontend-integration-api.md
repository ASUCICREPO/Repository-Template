---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Backend Integration: API & Streaming

Standard patterns for API communication and real-time streaming with AWS backend services.

## API Architecture

**Lambda Function URLs** (primary method): No API Gateway required; built-in HTTPS; streaming support for SSE; simplified CORS; direct Lambda invocation.

```typescript
const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

**Standard payload**: Always include `session_id` for stateful interactions; use snake_case for backend compatibility; include user context when available; enable streaming with `stream: true`.

```typescript
interface RequestPayload {
  query?: string; prompt?: string; inputs?: Array<{ text?: string; image?: unknown }>;
  session_id: string; userId?: string; email?: string; user_location?: string;
  stream?: boolean;
}
```

## Streaming (SSE)

**Standard SSE client**: Accept `text/event-stream`; use ReadableStream reader; decode with TextDecoder; split on `\n\n`; parse `data:` prefix.

```typescript
export async function streamResponse(payload: RequestPayload, onChunk: (event: StreamEvent) => void, onError: (error: Error) => void, onComplete: () => void) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify(payload)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) { onComplete(); break; }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        onChunk(data);
      }
    }
  }
}
```

**Event types**: `thinking`/`reasoning-delta` (agent reasoning → collapsible block), `text-delta`/`response`/`content` (incremental text → append), `tool-input-available` (tool start → loading), `tool-output-available` (tool results → parse/display), `sources`/`citations` (references → citation list), `final_result`/`finish` (completion → end streaming), `error` (error → show message).

```typescript
const handleStreamEvent = (event: StreamEvent) => {
  switch (event.type) {
    case 'thinking': case 'reasoning-delta': updateThinkingBlock(event.data); break;
    case 'text-delta': case 'content': appendToMessage(event.data); break;
    case 'tool-output-available': processToolOutput(event.toolName, event.output); break;
    case 'finish': completeMessage(); break;
    case 'error': handleError(event.error); break;
  }
};
```

**Lambda response unwrapping**: Lambda may wrap SSE chunks in JSON strings; try parsing and unwrap if string.

```typescript
let chunk = decoder.decode(value, { stream: true });
try {
  const unwrapped = JSON.parse(chunk);
  if (typeof unwrapped === 'string') chunk = unwrapped;
} catch {}
```

## Session Management

**Session ID format** (AWS AgentCore compatible): Minimum 33 characters; format `session_<timestamp>_<random><random>`.

```typescript
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  let sessionId = `session_${timestamp}_${random1}${random2}`;
  while (sessionId.length < 33) sessionId += Math.random().toString(36).substring(2, 1);
  return sessionId;
}
```

**Storage strategies**: SessionStorage (recommended for chat apps; cleared on tab close), per-page-load (new session each refresh with `useMemo`), localStorage (persistent across sessions).

```typescript
const SESSION_KEY = 'app_session_id';
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
```

## Data Processing

**JSON parsing from streaming**: Extract JSON array from text with regex; handle embedded JSON in responses.

```typescript
function parseJobResults(jobAgentResult: string): Job[] {
  let cleanResult = jobAgentResult.trim();
  const jsonMatch = cleanResult.match(/(\[[\s\S]*?\])/);
  if (jsonMatch) cleanResult = jsonMatch[1];
  try {
    return JSON.parse(cleanResult);
  } catch (error) {
    console.error('Failed to parse job results:', error);
    throw new Error('Unable to process results');
  }
}
```

**Tool output processing**: Handle string output (parse JSON), array output (find text field and parse), extract structured data.

```typescript
function processToolOutput(toolName: string, output: unknown) {
  let outputData: unknown = output;
  if (typeof output === 'string') outputData = JSON.parse(output);
  if (Array.isArray(output)) {
    const textContent = output.find(item => typeof item === 'object' && item !== null && 'text' in item);
    if (textContent) outputData = JSON.parse(textContent.text);
  }
  return outputData.resources_by_category;
}
```

## Multi-language Support

**Backend translation pattern**: Send user input as-is (don't translate client-side); include optional `user_language` hint; backend handles detection, translation to English, processing, translation back to user language; frontend displays translated responses and handles RTL languages (Arabic, Hebrew).

```typescript
interface TranslatedRequest {
  query: string; session_id: string; user_language?: string;
}
```

## Export and Download

**PDF export**: POST session_id to export endpoint; receive base64 PDF; convert to Blob; trigger download.

```typescript
async function exportToPDF(sessionId: string) {
  const response = await fetch(EXPORT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  const data = await response.json();
  const blob = base64ToBlob(data.pdf, 'application/pdf');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `resources-${sessionId}.pdf`; link.click();
  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}
```
