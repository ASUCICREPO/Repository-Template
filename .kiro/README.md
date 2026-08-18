# Kiro Setup

Standard Kiro configuration for ASU CIC projects using the AI-DLC workflow, including MCP servers, Powers, and recommended settings.

## Prerequisites

### Required
- **uv and uvx**: Python package manager for MCP servers
  - Installation: https://docs.astral.sh/uv/getting-started/installation/
  - Most MCP servers use `uvx` to run without manual installation
- **Node.js and npx**: Required for the git MCP server
  - Installation: https://nodejs.org/

### AWS Configuration (for AWS Powers)
If you plan to use AWS-related Powers (CloudWatch, CloudTrail, IAM Policy Autopilot):
1. Configure AWS credentials using AWS CLI or environment variables
2. When the tool validation hook detects AWS MCP servers with placeholder values, it will prompt you to configure them

## Tool Discovery Strategy

This project uses a tiered tool discovery approach instead of hard-coded tool lists. See `.kiro/steering/cic-tool-use-standards.md` for the full capability map.

### Tier 1: Mandatory Baseline (pre-configured in mcp.json)
- **git** — GitHub operations
- **context7** — Library/framework documentation
- **fetch** — Web content fetching
- **aws-diagram** — Architecture diagram generation
- **aws-knowledge-mcp-server** — AWS blogs and latest updates

### Tier 2: Capability-Driven (discovered at project start)
The agent scans your project requirements and recommends Powers/MCPs:
- **aws-infrastructure-as-code** Power — for CDK/CloudFormation work
- **aws-observability** Power — for CloudWatch/monitoring
- **iam-policy-autopilot** Power — for IAM policy generation
- **figma** Power — for design system integration

### Tier 3: Project-Specific (discovered from requirements)
Additional tools recommended based on specific AWS services your project uses.

## Installing Powers

Open the Powers panel in Kiro:
1. Run `kiroPowers configure` or use the command palette
2. Install recommended Powers for your project
3. The validation hook will check for missing Powers before first subagent use

## MCP Configuration

The MCP config is at `.kiro/settings/mcp.json`. It ships with Tier 1 baseline only. Additional MCP servers are added dynamically when the agent detects they're needed and no Power equivalent is installed.

### Adding AWS MCP Servers

When the agent recommends adding an AWS MCP server, it will offer to update `mcp.json` automatically. For servers requiring AWS credentials, you'll need to set:

```json
{
  "env": {
    "AWS_PROFILE": "your-profile-name",
    "AWS_REGION": "us-east-1"
  }
}
```

### Auto-Approving Tools

To skip approval prompts for read-only tools:

```json
{
  "autoApprove": ["search_documentation", "get_metric_metadata"]
}
```

**Warning**: Only auto-approve read-only tools. Never auto-approve tools that modify resources.

## Customization

### Disabling Servers

```json
{
  "aws-diagram": {
    "disabled": true
  }
}
```

### User-Level Config

For personal tools and credentials, use `~/.kiro/settings/mcp.json` (not committed to git).

## Resources

- **Kiro MCP Docs**: https://kiro.dev/docs/mcp
- **Kiro Powers Docs**: https://kiro.dev/docs/powers
- **AWS MCP Servers**: https://awslabs.github.io/mcp
- **CIC Getting Started**: `docs/CIC_GETTING_STARTED.md`
