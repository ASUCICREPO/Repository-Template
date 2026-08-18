---
description: Capability-driven tool discovery — checks configured MCP servers against project needs before subagent delegation.
---

Perform capability-driven tool validation before delegating to subagents:

**Step 1: Capability-driven discovery**

1. Read the capability map from the cic-tool-use-standards skill.
2. Scan project context (any requirements, design docs, or user description) for capability keywords.
3. Read the root `.mcp.json` to check configured MCP servers.

**Step 2: Validate Tier 1 (Mandatory Baseline)**

Verify these MCP servers are in `.mcp.json` and not disabled:
- github (@modelcontextprotocol/server-github)
- context7 (https://mcp.context7.com/mcp)
- fetch (mcp-server-fetch)
- aws-diagram (awslabs.aws-diagram-mcp-server)
- aws-knowledge (https://knowledge-mcp.global.api.aws)

**Step 3: Validate Tier 2 (Capability-Driven)**

For each capability keyword found in project context:
- Check if the documented MCP server for that capability is in `.mcp.json`.
- If missing → offer to add it to `.mcp.json`.

**Step 4: Check AWS Configuration**

In `.mcp.json`, check if any env values contain placeholders:
- `<YOUR_AWS_PROFILE>` or `<YOUR_AWS_REGION>`
- If found → WARN user (not blocking).

**Step 5: Report**

Show validation checklist:
- ✅ for servers that pass (present in config and enabled)
- ❌ for missing servers (with the config snippet to add)
- ⚠️ for AWS placeholder warnings (not blocking)
- If ANY ❌ in Tier 1 → STOP and help the user fix before delegating.
- If ALL Tier 1 ✅ → Proceed (Tier 2 gaps are warnings, not blockers).
