---
inclusion: manual
---

# Architecture Diagram Standards

## Format: draw.io XML (NOT Mermaid)

When creating or updating architecture diagrams in `design.md` files, ALWAYS use draw.io XML format embedded in a fenced code block. NEVER use Mermaid syntax.

### Template

Architecture sections in design.md must use this structure:

````markdown
## Architecture

```drawio
<mxGraphModel dx="1186" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <!-- Architecture cells here -->
  </root>
</mxGraphModel>
```
````

### Draw.io Conventions

- Use AWS 2024 icon shapes when available
- Group related services in containers/swimlanes (Frontend, API Layer, Compute, AI/RAG, Storage, Auth)
- Label all connections with protocol or action (e.g., "HTTPS", "SSE Stream", "Retrieve", "REST")
- Show security boundaries: encryption at rest (lock icon), TLS in transit (HTTPS labels), IAM role assignments
- Use consistent colors per layer: blue for compute, green for storage, orange for AI/ML, purple for auth
- Layout direction: top-to-bottom (users at top, storage at bottom)
- Page size: landscape 1100x850 for readability

### Lambda Consolidation Principle

**CRITICAL**: Consolidate Lambda functions to minimize operational complexity and cost:

- Aim for 2-3 Lambda functions maximum for typical projects
- Combine related operations into single functions with routing logic
- Only separate Lambdas when there are clear reasons:
  - Different execution requirements (memory, timeout, runtime)
  - Different IAM permissions (security isolation)
  - Different scaling patterns
  - Different deployment lifecycles
- Document the decision as an ADR if exceeding 3 functions

### Generating PNG from Architecture

After creating the draw.io XML in design.md, also generate a PNG version using the AWS Diagram MCP server (`generate_diagram` tool). Save the PNG to `architecture_diagram/` at the repo root.

### Why draw.io over Mermaid

- draw.io files can be opened and edited visually in VS Code, diagrams.net, or any compatible editor
- Supports AWS-specific icons and shapes natively
- Better control over layout, grouping, and visual hierarchy
- Can be exported to PNG/SVG/PDF directly from the editor
