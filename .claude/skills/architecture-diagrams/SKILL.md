---
name: architecture-diagrams
description: Generate CIC architecture diagrams as draw.io XML with AWS 2024 icons and swimlanes. Triggered by: create architecture diagram, draw.io, system diagram, AWS architecture, design.md diagram, architecture section.
---

Read `references/spec.md` for the draw.io XML template and AWS icon conventions.

**Format**: draw.io XML only — NEVER Mermaid syntax, NEVER ASCII art.

Embed in a fenced code block with ` ```drawio ` language tag inside `design.md`.

**Draw.io conventions**:
- AWS 2024 icon shapes when available
- Swimlanes: one per architectural layer — Frontend, API Layer, Compute, AI/RAG, Storage, Auth
- Label all connections with protocol or action: "HTTPS", "SSE Stream", "Retrieve", "REST"
- Show security boundaries: lock icon for encryption at rest, HTTPS labels for TLS, IAM role assignments
- Color coding per layer: blue for compute, green for storage, orange for AI/ML, purple for auth
- Layout direction: top-to-bottom (users at top, storage at bottom)
- Page size: landscape 1100×850

**Lambda consolidation rule (CRITICAL)**: 2-3 Lambda functions maximum for a typical project. Do not create one Lambda per endpoint. Combine related operations with internal routing. Only split Lambdas when there are clear reasons (different memory/timeout requirements, security isolation, different scaling patterns). Document the decision as an ADR if exceeding 3 functions.

**PNG generation**: After creating the draw.io XML in `design.md`, generate a PNG version using the AWS Diagram MCP server (`generate_diagram` tool). Save PNG to `architecture_diagram/` at the repo root.

See `references/spec.md` for the full XML template.
