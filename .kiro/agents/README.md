# CIC Subagents

Specialized AI agents for CIC project development, operating within AI-DLC's Construction phase.

- CIC backend standards: `.kiro/steering/backend/`
- CIC frontend standards: `.kiro/steering/frontend/`
- CIC security standards: `.kiro/steering/security/`
- Orchestration rules: `.kiro/steering/cic-orchestration.md`
- Tool discovery: `.kiro/steering/cic-tool-use-standards.md`

## Agents

| Agent | File | Purpose |
|-------|------|---------|
| cic-backend | `cic-backend.md` | CDK infrastructure, Lambda development, testing |
| cic-frontend | `cic-frontend.md` | Next.js frontend development and testing |
| cic-deployment | `cic-deployment.md` | Deployment verification, debugging, AWS resource querying |
| cic-security | `cic-security.md` | Security auditing and compliance (read-only) |
| cic-documentation | `cic-documentation.md` | Documentation updates (existing files only) |

**Note:** The old `cic-project-specs` agent is replaced by AI-DLC's Inception phase (requirements analysis, application design, workflow planning).

## Key Rules (All Agents)

- No summary/checklist/deployment markdown files — only real code and existing docs
- Minimal ADR comments — one line, only for non-obvious decisions
- Scope discipline — implement only what's asked, nothing more

## Workflow Patterns

### New Project (via AI-DLC)
1. **AI-DLC Inception** → Requirements, design, task planning (replaces cic-project-specs)
2. **cic-backend** → Implement backend tasks
3. **cic-frontend** → Implement frontend tasks
4. **cic-security** → Security audit
5. **cic-documentation** → Update project docs

### Full-Stack Feature
1. **AI-DLC design stages** → API contract defined and approved
2. **cic-backend** + **cic-frontend** (parallel) → Infrastructure + Lambda + React components + API integration
3. **cic-deployment** → `cdk deploy`, verify resources, debug stack errors
4. **cic-security** → Scan for IAM/secrets/encryption issues
5. **cic-documentation** → Update existing docs

### Deployment & Debugging
1. **cic-deployment** → Deploy, check CloudFormation events
2. **cic-deployment** → On failure: CloudWatch logs, root cause
3. **cic-backend** → Fix code issues
4. **cic-deployment** → Re-deploy and verify

### Security Audit
1. **cic-security** → cdk-nag + ASH scans, report findings
2. **cic-backend** → Apply remediations
3. **cic-security** → Re-scan to verify
