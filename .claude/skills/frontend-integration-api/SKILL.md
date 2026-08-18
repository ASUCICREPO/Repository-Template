---
name: frontend-integration-api
description: Integrate Next.js frontends with Lambda Function URLs and SSE streaming. Triggered by: API calls from frontend, streaming chat, SSE events, session management, export/download PDF, Lambda Function URL integration.
---

Read `references/spec.md` for complete implementation patterns.

**Primary integration method**: Lambda Function URLs (no API Gateway required — built-in HTTPS, streaming support, simplified CORS).

**Standard payload**: Always include `session_id`. Use snake_case keys for backend compatibility. Enable streaming with `stream: true`.

**SSE streaming**: Accept `text/event-stream`. Use `ReadableStream` reader. Decode with `TextDecoder`. Split on `\n\n`. Parse `data:` prefix.

**SSE event types to handle**:
- `thinking` / `reasoning-delta` → show collapsible thinking block
- `text-delta` / `content` → append to message
- `tool-output-available` → parse and display
- `sources` / `citations` → render citation list
- `finish` → end streaming, finalize state
- `error` → show user-friendly error message

**Lambda response unwrapping**: Lambda may wrap SSE chunks in JSON strings — try parsing and unwrap if the result is a string.

**Session ID format** (AWS AgentCore compatible): Minimum 33 characters. Format: `session_<timestamp>_<random><random>`.

**Session storage**:
- `sessionStorage` — recommended for chat apps (cleared on tab close)
- `useMemo` — per-page-load sessions
- `localStorage` — only for persistent cross-tab sessions

**Multi-language**: Send user input as-is. Include optional `user_language` hint. Backend handles detection and translation.

**Export/download**: POST `session_id` to export endpoint. Receive base64 PDF. Convert to Blob. Trigger browser download.

See `references/spec.md` for fetch patterns and error handling.
