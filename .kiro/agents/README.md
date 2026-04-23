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
| cic-documentation | `cic-documentation.md` | Documentation updates, AI-DLC to closure docs synthesis |

## Key Rules (All Agents)

- No summary/checklist/deployment markdown files — only real code and existing docs
- Minimal ADR comments — one line, only for non-obvious decisions
- Scope discipline — implement only what's asked, nothing more

## Workflow Patterns

### Project Initialization (New Projects via AI-DLC)
1. **Main agent** → Drives AI-DLC Inception phase (requirements, design, planning) using the AI-DLC Power
2. **cic-backend** → Implement backend units from AI-DLC code generation plan
3. **cic-frontend** → Implement frontend units from AI-DLC code generation plan
4. **cic-security** → Security audit against CIC standards
5. **cic-deployment** → Deploy and verify
6. **cic-documentation** → Synthesize `aidlc-docs/` into closure docs in `docs/`

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
