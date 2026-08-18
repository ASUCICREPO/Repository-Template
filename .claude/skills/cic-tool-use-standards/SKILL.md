---
name: cic-tool-use-standards
description: Select and configure the correct MCP servers for CIC projects using the tiered tool discovery workflow. Triggered by: project start, which tool to use, MCP server, tool discovery, Tier 1 tools, Tier 2 tools, missing tool, configure MCP.
---

Read `references/spec.md` for the full tier table, keyword mapping, and MCP server catalog.

**Core principle**: Check tools BEFORE writing code. MCP servers are design tools, not debugging tools.

**Tool model**: CIC projects use MCP servers only. Configure them in the project's root `.mcp.json`.

**Tier 1 (always active — verify in root `.mcp.json`)**:
- `github` MCP — GitHub operations
- `context7` MCP — up-to-date library/framework docs
- `fetch` MCP — web content
- `aws-diagram` MCP — architecture diagram generation
- `aws-knowledge` MCP — AWS blogs, latest updates

**Tier 2 (capability-driven — add to `.mcp.json` based on task)**:
| Keywords | MCP server |
|----------|------------|
| aws, cdk, infrastructure | `uvx awslabs.aws-iac-mcp-server@latest` |
| cloudwatch, monitoring | `uvx awslabs.cloudwatch-mcp-server@latest` |
| iam, policy, permissions | `uvx iam-policy-autopilot@latest mcp-server` |
| figma, design, ui mockup | HTTP: `https://mcp.figma.com/mcp` |

**Discovery workflow at project start**:
1. Scan requirements for capability keywords
2. Read root `.mcp.json` → verify Tier 1 present and enabled, match keywords against Tier 2 map
3. Report gaps: ✅ configured / ❌ missing (offer to add to `.mcp.json`) / ⚠️ unconfigured (placeholder or missing env vars)
4. Offer to add missing Tier 2/3 servers to `.mcp.json`

**Common mistakes to avoid**:
- Writing code first, checking tools after errors
- Using `git` shell commands instead of github MCP tools
- Guessing AWS API patterns instead of querying `aws-knowledge`
- Treating tool checks as optional

See `references/spec.md` for the full proactive usage trigger table and MCP server catalog.
