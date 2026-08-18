# CIC Tool Discovery & Usage Standards — Full Reference

**CRITICAL**: MCP servers provide access to official documentation, best practices, validation tools, and specialized capabilities. You MUST use these tools proactively BEFORE writing code.

## Core Principles

1. **Discover before you build** — At project start, scan requirements for capability keywords and ensure the right MCP servers are installed.
2. **Check tools BEFORE writing code** — MCP servers are design tools, not debugging tools.
3. **Prefer a dedicated MCP over guessing** — When an MCP server exists for a capability (AWS docs, IaC, IAM, observability, design), use it instead of relying on training-data assumptions.

## Tiered Tool Strategy

### Tier 1: Mandatory Baseline (always available)

These are in the project's root `.mcp.json` and required for every CIC project:

| Tool | Type | Purpose |
|---|---|---|
| github | MCP | GitHub operations (commits, branches, PRs, issues) |
| context7 | MCP (HTTP) | Up-to-date library/framework documentation |
| fetch | MCP | Web content fetching for documentation access |
| aws-diagram | MCP | Architecture diagram generation |
| aws-knowledge | MCP (HTTP) | AWS blogs, latest updates, service announcements |

### Tier 2: Capability-Driven (discovered at project start)

Scan requirements for capability keywords and add the matching MCP server to `.mcp.json`:

| Capability | Keywords in requirements | MCP server package |
|---|---|---|
| Infrastructure as Code | aws, cdk, cloudformation, infrastructure, stack | `uvx awslabs.aws-iac-mcp-server@latest` |
| Observability / Logs | cloudwatch, logs, metrics, monitoring, alarms, traces | `uvx awslabs.cloudwatch-mcp-server@latest` + `uvx awslabs.cloudtrail-mcp-server@latest` |
| IAM policy generation | iam, policy, permissions, access, denied, lambda permissions | `uvx iam-policy-autopilot@latest mcp-server` |
| Design system | figma, design, ui mockup, design system | HTTP: `https://mcp.figma.com/mcp` |
| AWS documentation | aws docs, service reference, api reference | `uvx awslabs.aws-documentation-mcp-server@latest` |

### Tier 3: Project-Specific (discovered from requirements)

When requirements mention specific AWS services, consult the known servers catalog below and add the relevant server to `.mcp.json`.

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
2. **Check MCPs** — Read the root `.mcp.json` → verify Tier 1 servers are present and enabled, and match keywords against the Tier 2 capability map
3. **Report gaps:**
   - ✅ Installed and configured
   - ❌ Missing — offer to add the MCP server entry to `.mcp.json`
   - ⚠️ Unconfigured — AWS placeholder values (`<YOUR_AWS_PROFILE>`, `<YOUR_AWS_REGION>`) or missing env vars (`GITHUB_PERSONAL_ACCESS_TOKEN`) need replacement
4. **Add missing servers** — For missing Tier 2/3 capabilities, offer to add the MCP server entry to `.mcp.json`

## Proactive Tool Usage

**Trigger keywords and required actions:**

| Keywords in user request | Action |
|---|---|
| infrastructure, cloud, aws, cdk, cloudformation, deployment | Query `aws-iac-mcp-server` for best practices → then implement |
| security, iam, policy, secrets, compliance, audit, scan | Use `iam-policy-autopilot` for policy generation → use security skills |
| monitoring, cloudwatch, logs, metrics, alarms, traces | Query `cloudwatch-mcp-server` before configuring |
| api, integration, rest, graphql, webhook | Check Context7 for framework docs → then implement |
| design, ui, figma, component, mockup | Use `figma` MCP to extract design context → then implement |
| git, github, repository, commit, branch, merge, pr | Use github MCP tools (NOT shell `git` commands) |
| documentation, docs, api reference, library, framework | Use Context7 MCP or `aws-documentation-mcp-server` |
| aws blog, latest update, new feature, service announcement | Use `aws-knowledge` (ONLY approved source for AWS blogs) |

## Common Mistakes

1. ❌ Writing code first, checking tools after errors → ✅ Check tools BEFORE writing
2. ❌ Using `git` shell commands → ✅ Use github MCP tools
3. ❌ Guessing AWS API patterns → ✅ Query `aws-knowledge` for latest
4. ❌ Checking tools once → ✅ Use throughout implementation
5. ❌ Treating tool checks as optional → ✅ MANDATORY for specialized work
6. ❌ Hard-coding tool assumptions → ✅ Discover what's available first
