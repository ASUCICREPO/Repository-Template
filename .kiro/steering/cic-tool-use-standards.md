---
inclusion: always
---

# CIC Tool Discovery & Usage Standards

**CRITICAL**: External tools (Kiro Powers and MCP servers) provide access to official documentation, best practices, validation tools, and specialized capabilities. You MUST use these tools proactively BEFORE writing code.

## Core Principles

1. **Prefer Powers over MCPs** — Powers are first-class Kiro integrations with better context. Use MCP servers only when no Power equivalent exists.
2. **Discover before you build** — At project start, scan requirements for capability keywords and ensure the right tools are installed.
3. **Check tools BEFORE writing code** — External tools are design tools, not debugging tools.

## Tiered Tool Strategy

### Tier 1: Mandatory Baseline (always available)

These are in `.kiro/settings/mcp.json` and required for every CIC project:

| Tool | Type | Purpose |
|---|---|---|
| git | MCP | GitHub operations (commits, branches, PRs, issues) |
| context7 | MCP | Up-to-date library/framework documentation |
| fetch | MCP | Web content fetching for documentation access |
| aws-diagram | MCP | Architecture diagram generation |
| aws-knowledge-mcp-server | MCP (HTTP) | AWS blogs, latest updates, service announcements |

### Tier 2: Capability-Driven (discovered at project start)

Run `kiroPowers list` and cross-reference with project needs:

| Capability | Keywords in requirements | Power (preferred) | MCP fallback package |
|---|---|---|---|
| Infrastructure as Code | aws, cdk, cloudformation, infrastructure, stack | `aws-infrastructure-as-code` | `uvx awslabs.aws-iac-mcp-server@latest` |
| Observability / Logs | cloudwatch, logs, metrics, monitoring, alarms, traces | `aws-observability` | `uvx awslabs.cloudwatch-mcp-server@latest` + `uvx awslabs.cloudtrail-mcp-server@latest` |
| IAM policy generation | iam, policy, permissions, access, denied, lambda permissions | `iam-policy-autopilot-power` | `uvx iam-policy-autopilot@latest mcp-server` |
| Design system | figma, design, ui mockup, design system | `figma` | HTTP: `https://mcp.figma.com/mcp` |
| AWS documentation | aws docs, service reference, api reference | (bundled in `aws-observability`) | `uvx awslabs.aws-documentation-mcp-server@latest` |

### Tier 3: Project-Specific (discovered from requirements)

When requirements mention specific AWS services, search for relevant Powers via `kiroPowers list`. For MCPs, consult the known servers catalog below.

**Known MCP Servers Catalog:**

| AWS Service / Domain | MCP Server Package | Notes |
|---|---|---|
| CDK / CloudFormation | `uvx awslabs.aws-iac-mcp-server@latest` | IaC docs, best practices, samples |
| CloudWatch Logs/Metrics | `uvx awslabs.cloudwatch-mcp-server@latest` | Requires AWS_PROFILE, AWS_REGION |
| CloudWatch App Signals | `uvx awslabs.cloudwatch-applicationsignals-mcp-server@latest` | APM, distributed tracing |
| CloudTrail | `uvx awslabs.cloudtrail-mcp-server@latest` | Security auditing, access logs |
| AWS Documentation | `uvx awslabs.aws-documentation-mcp-server@latest` | Official AWS docs search |
| IAM Policy Autopilot | `uvx iam-policy-autopilot@latest mcp-server` | Policy generation from code |
| AWS Diagrams | `uvx awslabs.aws-diagram-mcp-server@latest` | Architecture diagram generation |
| AWS Knowledge/Blogs | HTTP: `https://knowledge-mcp.global.api.aws` | Latest AWS updates, blog posts |
| Figma | HTTP: `https://mcp.figma.com/mcp` | Design system integration |
| GitHub | `npx -y @modelcontextprotocol/server-github` | Git operations |
| Context7 | HTTP: `https://mcp.context7.com/mcp` | Library documentation |
| Web Fetch | `uvx mcp-server-fetch` | General web content fetching |

## Discovery Workflow (at project start)

Run this workflow during AI-DLC Inception or at first interaction:

1. **Scan requirements** — Extract capability keywords from vision/requirements documents
2. **Check Powers** — Run `kiroPowers list` → match keywords against Tier 2 capability map
3. **Check MCPs** — Read `.kiro/settings/mcp.json` → verify Tier 1 servers are present and enabled
4. **Report gaps:**
   - ✅ Installed and configured
   - ❌ Missing — provide install instructions (Powers: `kiroPowers configure` panel; MCPs: add to `mcp.json`)
   - ⚠️ Unconfigured — AWS placeholder values (`<YOUR_AWS_PROFILE>`, `<YOUR_AWS_REGION>`) need replacement
5. **Auto-add MCP fallbacks** — For missing capabilities with no Power installed, offer to add the MCP fallback entry to `.kiro/settings/mcp.json`
6. **Direct Power installs** — For missing Powers, tell the user to open the Powers panel and install them

## Proactive Tool Usage

**Trigger keywords and required actions:**

| Keywords in user request | Action |
|---|---|
| infrastructure, cloud, aws, cdk, cloudformation, deployment | Check `aws-infrastructure-as-code` Power → query best practices → then implement |
| security, iam, policy, secrets, compliance, audit, scan | Check `iam-policy-autopilot-power` → use security steering files |
| monitoring, cloudwatch, logs, metrics, alarms, traces | Check `aws-observability` Power → query before configuring |
| api, integration, rest, graphql, webhook | Check Context7 for framework docs → then implement |
| design, ui, figma, component, mockup | Check `figma` Power → extract design context → then implement |
| git, github, repository, commit, branch, merge, pr | Use git MCP tools (NOT shell `git` commands) |
| documentation, docs, api reference, library, framework | Use Context7 MCP or AWS documentation tools |
| aws blog, latest update, new feature, service announcement | Use `aws-knowledge-mcp-server` (ONLY approved source for AWS blogs) |

**Process:**
1. See relevant keywords → Check for Powers/MCP tools FIRST
2. Query tools for best practices and requirements
3. Perform task using tools (not raw shell commands)
4. Use tools throughout implementation (not just once)

## Common Mistakes

1. ❌ Writing code first, checking tools after errors → ✅ Check tools BEFORE writing
2. ❌ Using `git` shell commands → ✅ Use git MCP tools
3. ❌ Guessing AWS API patterns → ✅ Query `aws-knowledge-mcp-server` for latest
4. ❌ Checking tools once → ✅ Use throughout implementation
5. ❌ Treating tool checks as optional → ✅ MANDATORY for specialized work
6. ❌ Hard-coding tool assumptions → ✅ Discover what's available first
