---
inclusion: always
---

# External Tool Usage Standards (Powers & MCP)

**CRITICAL**: External tools (Kiro Powers and MCP servers) provide access to official documentation, best practices, validation tools, and specialized capabilities. You MUST use these tools proactively BEFORE writing code, not reactively after encountering issues.

## Core Principle

External tools are like checking official documentation before implementing — not debugging tools for after you've already written code. Use them to inform your implementation, not to fix it later.

## Tool Discovery

- **Powers**: Run `kiroPowers list` to see installed powers
- **MCP Tools**: Check available MCP tools through the MCP interface
- **Documentation**: See `.kiro/steering/README.md` for recommended tool configurations

Common tool categories:
- Infrastructure/IaC documentation and validation
- Observability and monitoring
- Security and IAM policy analysis
- Design system integration
- API documentation and code examples

## Workflow: Check Tools BEFORE Writing Code

**Trigger keywords:** 
- **Infrastructure/Cloud**: infrastructure, cloud, aws, cdk, cloudformation, deployment, monitoring
- **Security**: security, iam, policy, secrets, compliance, audit, scan
- **API/Integration**: api, integration, rest, graphql, webhook
- **Design/UI**: design, ui, figma, component, mockup
- **Version Control**: git, github, repository, commit, branch, merge, pull request, diff
- **Documentation**: documentation, docs, api reference, library, framework

**Process:**
1. See relevant keywords → Check for Powers/MCP tools FIRST (`kiroPowers list`)
2. Query tools for best practices and requirements
3. Perform task using tools (not raw shell commands)
4. Use tools throughout implementation (not just once)

## When to Use External Tools

**Infrastructure/Cloud:** Before ANY AWS/cloud operations, CDK work, or infrastructure tasks
**Observability:** When investigating performance, analyzing logs, checking metrics, setting up monitoring
**Security:** Before finalizing policies, implementing auth, configuring secrets, or performing security reviews
**Design/Frontend:** Before implementing UI, creating components, or working with design systems
**APIs/Integration:** When integrating third-party services, learning frameworks, or working with APIs
**Version Control:** Before performing git operations, reviewing commits, managing branches, or working with repositories
**AWS Latest Updates & Blogs:** Use `aws-knowledge-mcp-server` (configured at `https://knowledge-mcp.global.api.aws`) to discover the latest AWS service updates, new features, API changes, and AWS blog posts before implementing AWS services (e.g., REST API V1 streaming support added Nov 19, 2025). This is the ONLY approved source for AWS blogs and latest updates.

## Proactive vs Reactive

❌ **REACTIVE:** Perform task with shell commands → Get errors → Check tools → Fix
✅ **PROACTIVE:** See keywords → Check tools → Query best practices → Perform task using tools

## Common Mistakes

1. Waiting until stuck (check at START, not when debugging)
2. Checking but not querying (discover AND use tools)
3. One-time check (use throughout implementation)
4. Ignoring keywords (infrastructure/security/monitoring/git = check tools)
5. Treating as optional (MANDATORY for specialized work)
6. **Using shell commands when MCP tools exist** (e.g., `git` commands instead of git MCP tools)

## Summary

External tools are design tools, not debugging tools. Check them BEFORE performing ANY task, just like checking dependency versions before writing package.json. Keywords in task = check for relevant tools first.

## Examples of Tool Usage

### Git Operations
```
User: "Review the recent commits on main"

❌ Wrong: executePwsh("git log --oneline")
✅ Right: Check for git MCP tools → Use mcp_git_list_commits
```

### AWS Infrastructure
```
User: "Create a Lambda function"

❌ Wrong: Start writing CDK code immediately
✅ Right: kiroPowers list → Use aws-infrastructure-as-code → Query best practices → Write code
```

### AWS Latest Updates & Blogs
```
User: "Implement API Gateway streaming"

❌ Wrong: Use outdated patterns from general knowledge
✅ Right: Query aws-knowledge-mcp-server → Discover Nov 19, 2025 REST API V1 streaming support → Implement with latest patterns

User: "Find AWS blog posts about Bedrock best practices"

❌ Wrong: Use web search or general knowledge
✅ Right: Query aws-knowledge-mcp-server (https://knowledge-mcp.global.api.aws) → Search AWS blogs → Get official AWS guidance
```

### Security Review
```
User: "Check for hardcoded secrets"

❌ Wrong: grep through files manually
✅ Right: Check for security MCP tools → Use automated scanning tools
```