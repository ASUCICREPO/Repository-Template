# Kiro Setup

Standard Kiro configuration for ASU CIC projects, including MCP servers, Powers, and recommended settings.

## Prerequisites

This project includes pre-configured MCP servers that require the following tools:

### Required
- **uv and uvx**: Python package manager for MCP servers
  - Installation: https://docs.astral.sh/uv/getting-started/installation/
  - Most MCP servers use `uvx` to run without manual installation
- **Node.js and npx**: Required for the git MCP server
  - Installation: https://nodejs.org/

### AWS Configuration (for AWS Powers)
If you plan to use AWS-related Powers (CloudWatch, CloudTrail, IAM Policy Autopilot):
1. Configure AWS credentials using AWS CLI or environment variables
2. Replace `<YOUR_AWS_PROFILE>` in `.kiro/settings/mcp.json` with your AWS profile name (e.g., `default`, `my-project-admin`)
3. Replace `<YOUR_AWS_REGION>` with your target region (e.g., `us-east-1`, `us-west-2`)

These placeholders appear in the CloudWatch, CloudWatch Application Signals, and CloudTrail server configs. All three must be updated before those servers will connect.

**Example:**
```json
{
  "power-aws-observability-awslabs.cloudwatch-mcp-server": {
    "env": {
      "AWS_PROFILE": "my-project-admin",
      "AWS_REGION": "us-west-2"
    }
  }
}
```

## Recommended MCP Setup

A complete MCP configuration should include:

**Core MCP Servers:**
1. **aws-documentation** - Access AWS documentation and guides
2. **aws-knowledge-mcp-server** - Latest AWS updates and new features
3. **fetch** - Fetch web content and convert to markdown
4. **git** - Git operations and repository management
5. **figma** - Design system integration and UI component access
6. **context7** - Up-to-date library and framework documentation

**AWS Powers:**
1. **aws-infrastructure-as-code** - CDK best practices and IaC validation
2. **aws-observability** - CloudWatch logs, metrics, and Application Signals
3. **aws-agentcore** - Build and test Bedrock AgentCore agents
4. **strands** - Build AI agents with Strands SDK

---

### MCP Server Descriptions

#### git
**Purpose**: Version control operations
**Use cases**:
- Check repository status
- Create commits and branches
- Push and pull changes
- View diffs and logs
- Manage branches and tags

**Key tools**:
- git status, diff, log
- git commit, push, pull
- git branch, checkout, merge
- git tag, stash

**When to use**: Any version control operation, commit message generation, branch management

---

#### context7
**Purpose**: Up-to-date library and framework documentation
**Use cases**:
- Get current API documentation for any library
- Find version-specific code examples
- Learn how to use new frameworks
- Verify correct API usage

**Key tools**:
- resolve-library-id: Find the correct library
- query-docs: Get documentation and examples

**When to use**: 
- "How do I use Next.js 15 middleware?"
- "Show me Tailwind CSS grid examples"
- "What's the API for React Query v5?"
- Any time you need current library documentation

**Pro tip**: Extremely lightweight and fast - use liberally for any documentation questions

---

#### ash-security
**Purpose**: Comprehensive automated security scanning
**Use cases**:
- Static Application Security Testing (SAST)
- Infrastructure as Code (IaC) security scanning
- Secrets detection in code and git history
- Software Composition Analysis (SCA) for dependencies
- Security compliance validation

**Key tools**:
- run-sast: Scan code for security vulnerabilities
- run-iac-scan: Validate CloudFormation/CDK for security issues
- run-secrets-scan: Detect hardcoded credentials and secrets
- run-sca: Analyze dependencies for known vulnerabilities
- run-all-scans: Execute comprehensive security audit

**When to use**: 
- Before committing code (pre-commit hook)
- During security reviews
- Before deployments
- When adding new dependencies
- Investigating security incidents

**Critical for CIC**: Automates security validation across all CIC requirements:
- No hardcoded secrets (secrets scan)
- IAM least privilege (IaC scan)
- Secure dependencies (SCA)
- Code vulnerabilities (SAST)

**Integration with security-check hook**: The security-check hook can invoke ASH tools for comprehensive validation

---

#### fetch
**Purpose**: Web content fetching and conversion
**Use cases**:
- Fetch web pages and convert to markdown
- Get latest package versions from npm/PyPI
- Access official documentation from web sources
- Check for breaking changes in changelogs
- Retrieve release notes

**Key tools**:
- fetch: Get web content as markdown

**When to use**:
- "What's the latest version of [package]?"
- "Show me the changelog for [library]"
- "Get the documentation from [URL]"
- Verifying current package versions

**Pro tip**: Complements context7 for documentation that's not in their index

---

## Customization

### Adjusting AWS Region

Edit the `aws-observability` server configuration:

```json
{
  "aws-observability": {
    "env": {
      "AWS_REGION": "us-west-2"  // Change to your region
    }
  }
}
```

### Auto-Approving Tools

To skip approval prompts for specific tools, add to `autoApprove`:

```json
{
  "aws-observability": {
    "autoApprove": [
      "query_cloudwatch_logs",
      "get_cloudwatch_metrics"
    ]
  }
}
```

**Warning**: Only auto-approve read-only tools. Never auto-approve tools that modify resources.

### Disabling Servers

To temporarily disable a server without removing it:

```json
{
  "aws-observability": {
    "disabled": true
  }
}
```

---

## Best Practices

### MCP Configuration

1. **Start with workspace-level config**: Keeps project-specific configuration with the project
2. **Use user-level for personal tools**: Personal preferences and credentials
3. **Use environment variables**: For sensitive values, reference env vars

### Power Usage

1. **Activate powers explicitly**: "Use AWS Observability to debug this Lambda"
2. **Combine powers**: Use multiple powers together for complex tasks
3. **Delegate to subagents**: Let specialized subagents use powers automatically
4. **Build custom powers**: For team-specific workflows that don't fit existing powers

### Security

1. **Never commit AWS credentials**: Use AWS CLI configuration or environment variables
2. **Review auto-approved tools**: Understand what each tool does before auto-approving
3. **Use IAM Policy Autopilot**: Always generate policies from code, never write manually
4. **Regular security audits**: Use security subagent to review IAM policies

---

## Support and Resources

### Documentation

- **Kiro MCP Docs**: [kiro.dev/docs/mcp](https://kiro.dev/docs/mcp)
- **Kiro Powers Docs**: [kiro.dev/docs/powers](https://kiro.dev/docs/powers)
- **AWS MCP Servers**: [awslabs.github.io/mcp](https://awslabs.github.io/mcp)
- **Power Builder Guide**: Activate power-builder power and read steering files

### Getting Help

1. **Kiro Community**: [kiro.dev/community](https://kiro.dev/community)
2. **AWS MCP GitHub**: [github.com/awslabs/mcp](https://github.com/awslabs/mcp)
3. **CIC Template Issues**: File issues in this repository

### Contributing

To contribute improvements to this configuration:

1. Test changes thoroughly
2. Document rationale for changes
3. Update this README
4. Submit pull request with clear description

---
