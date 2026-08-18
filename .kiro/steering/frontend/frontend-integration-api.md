---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Backend Integration: API & Streaming

Standard patterns for API communication and real-time streaming with AWS backend services.

## API Architecture

**Lambda Function URLs** (primary): No API Gateway required; built-in HTTPS; streaming support for SSE; simplified CORS.

**Standard payload**: Always include `session_id`; use snake_case for backend compatibility; enable streaming with `stream: true`.

## Streaming (SSE)

Accept `text/event-stream`; use ReadableStream reader; decode with TextDecoder; split on `\n\n`; parse `data:` prefix.

**Event types**: `thinking`/`reasoning-delta` (collapsible block), `text-delta`/`content` (append text), `tool-output-available` (parse/display), `sources`/`citations` (citation list), `finish` (end streaming), `error` (show message).

**Lambda response unwrapping**: Lambda may wrap SSE chunks in JSON strings; try parsing and unwrap if string.

## Session Management

**Session ID format** (AWS AgentCore compatible): Minimum 33 characters; format `session_<timestamp>_<random><random>`.

**Storage**: SessionStorage (recommended for chat apps), per-page-load (`useMemo`), or localStorage (persistent).

## Multi-language Support

Send user input as-is; include optional `user_language` hint; backend handles detection and translation; frontend handles RTL languages.

## Export and Download

POST session_id to export endpoint; receive base64 PDF; convert to Blob; trigger download.
