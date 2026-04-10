# CIC Subagents

Specialized AI agents for CIC project development.

- Project standards: `.kiro/steering/AGENTS.md`
- Orchestration rules: `.kiro/steering/main-agent-orchestration.md`

## Agents

| Agent | File | Purpose |
|-------|------|---------|
| cic-backend | `cic-backend.md` | CDK infrastructure, Lambda development, testing |
| cic-frontend | `cic-frontend.md` | Next.js frontend development and testing |
| cic-deployment | `cic-deployment.md` | Deployment verification, debugging, AWS resource querying |
| cic-security | `cic-security.md` | Security auditing and compliance (read-only) |
| cic-documentation | `cic-documentation.md` | Documentation updates (existing files only) |
| cic-project-specs | `cic-project-specs.md` | Project specification creation from scope documents |

## Key Rules (All Agents)

- No summary/checklist/deployment markdown files — only real code and existing docs
- Minimal ADR comments — one line, only for non-obvious decisions
- Scope discipline — implement only what's asked, nothing more

## Workflow Patterns

### Project Initialization (New Projects)
1. **cic-project-specs** → Create requirements.md (get approval) → design.md (get approval) → tasks.md
2. **cic-backend** → Implement backend tasks from tasks.md
3. **cic-frontend** → Implement frontend tasks from tasks.md
4. **cic-security** → Security audit
5. **cic-documentation** → Update project docs

### Full-Stack Feature
1. **cic-backend** → CDK stack + Lambda + tests → ends at `cdk synth`
2. **cic-deployment** → `cdk deploy`, verify resources, debug stack errors
3. **cic-frontend** → React components + API integration + tests
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
