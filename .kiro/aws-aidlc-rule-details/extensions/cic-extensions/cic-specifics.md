# CIC-Specific Development Rules

## Overview
These rules enforce CIC-specific development standards. They are applied based on user opt-in during the Requirements Analysis stage.

---

## Rule CIC-01: Figma Design Integration

**Rule**: When the user opts in to Figma design integration, the AI-DLC workflow must request a Figma URL before generating UI components during the Construction phase. If no Figma URL is provided, proceed without it — this rule is non-blocking.

**Applies**: Construction phase — before generating frontend UI components.

**Behavior**:
- If user answered **A) Yes** to "Figma Design Integration" opt-in:
  - Ask the user for a Figma URL (e.g., `https://figma.com/design/:fileKey/:fileName?node-id=X-Y`) before implementing UI components
  - If a URL is provided, use the Figma MCP power (`get_design_context`) to fetch design context and generate code matching the design
  - If the user skips or says "none", proceed with AI-generated UI without Figma reference
- If user answered **B) No**: skip Figma integration entirely

**Verification**:
- If opted in, confirm a Figma URL prompt was presented before UI component generation
- If a URL was provided, verify the generated code references the Figma design context
