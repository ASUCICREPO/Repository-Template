# CIC Project Standards

This file provides universal standards for all AI agents working on CIC (Cloud Innovation Center) projects.

> **Orchestration & delegation rules** → #[[file:.kiro/steering/main-agent-orchestration.md]]
> **Backend-specific standards** → #[[file:.kiro/steering/backend/backend-standards.md]]
> **Security requirements** → `.kiro/steering/security/`
> This file covers cross-cutting project standards, conventions, and boundaries only.

## Core Principles

1. **Backend first** — Design and implement backend before frontend
2. **Security is non-negotiable** — IAM least privilege, no hardcoded secrets, PII protection
3. **No hardcoding** — Extract all configuration dynamically at runtime
4. **Serverless-first** — Lambda, DynamoDB, S3, API Gateway
5. **Use CDK L2/L3 constructs** — Never manual console configurations
6. **Latest stable versions** — Always use latest stable dependency versions

**Important:** Flag conflicts with these standards and propose alternatives. For AWS services, ALWAYS use `aws-knowledge-mcp-server` (https://knowledge-mcp.global.api.aws) to search AWS blogs, official docs, and latest updates when unfamiliar with services/libraries; verify API usage and best practices before implementation.

## Technology Stack

- **Frontend**: Next.js (latest stable) with TypeScript, AWS Amplify, Tailwind CSS
- **Backend**: AWS CDK (TypeScript), Lambda (Python, latest supported runtime)
- **Architecture**: Serverless-first (Lambda, DynamoDB, S3, API Gateway)
- **Infrastructure**: CDK L2/L3 constructs, no manual console configs
- **Dependencies**: Always install latest stable versions; check for updates before starting work; verify compatibility and review breaking changes in changelogs

## Project Structure

```
project/
├── frontend/
│   ├── app/              # Next.js App Router (pages and layouts)
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # API clients, utilities
│   └── contexts/         # React Context providers
├── backend/
│   ├── lib/              # CDK stack definitions (TypeScript)
│   ├── lambda/           # Lambda handlers (Python)
│   └── bin/              # CDK app entry point
└── docs/
    ├── README.md                    # Project overview, setup, quick start
    ├── architectureDeepDive.md      # Architecture, services, data flow, ADRs
    ├── deploymentGuide.md           # Complete deployment instructions
    ├── userGuide.md                 # End-user instructions
    ├── APIDoc.md                    # API reference
    ├── modificationGuide.md         # Developer guide for extending
    └── ADR_TEMPLATE.md              # Template for architectural decisions
```

## Code Conventions

**TypeScript:**
- Strict mode enabled
- Prefer interfaces over types
- Export types explicitly
- Meaningful variable names

**Python:**
- PEP 8 style guide
- Type hints required
- Thin Lambda handlers
- Entry point: `lambda_handler(event, context)`

## Boundaries

**Always do:**
- Run `cdk synth` before committing backend changes (runs cdk-nag)
- Run tests before committing
- Use CDK grant methods for IAM permissions
- Validate environment variables at Lambda startup
- Document architectural decisions in code comments

**Ask first:**
- Adding new AWS services
- Changing IAM policies
- Adding new dependencies
- Modifying project structure

**Never do:**
- Hardcode secrets, credentials, or configuration
- Use IAM wildcards in actions or resources
- Commit `.env` files
- Create resources manually in AWS Console
- Skip security validation

## Validation Checklist

Before finalizing any changes, verify:
- [ ] No hardcoded secrets, credentials, or configuration
- [ ] IAM permissions use specific ARNs, not wildcards
- [ ] All data stores have encryption enabled
- [ ] PII is not logged to CloudWatch
- [ ] Latest stable dependency versions used
- [ ] Code follows language-specific style guidelines
- [ ] Tests pass
- [ ] cdk-nag findings addressed or suppressed with ADR

## Documentation

### Architecture Decision Records (ADRs)

Document significant architectural decisions in `docs/architectureDeepDive.md` under an "Architectural Decisions" section. Include: Context, Alternatives, Rationale, Consequences.

**Code Comments:** Reference ADRs in code where implemented:

```typescript
// ADR: Lambda architecture detection for ARM64/x86_64 compatibility
// Rationale: Supports development on both Apple Silicon and Intel Macs
const hostArch = os.arch();
```

Keep ADR comments to one line when possible. Only add them for non-obvious decisions.

### cdk-nag Suppressions

Always include a reason when suppressing cdk-nag rules:

```typescript
NagSuppressions.addResourceSuppressions(fn, [
  { id: 'AwsSolutions-IAM5', reason: 'Wildcard needed for S3 prefix-level access' }
]);
```

## Steering File Reference

Domain-specific guidance loads automatically based on inclusion mode:

| File | Inclusion | Loads When |
|------|-----------|------------|
| `AGENTS.md` | always | Every interaction (all agents) |
| `main-agent-orchestration.md` | always | Every interaction (main agent) |
| `architecture-diagrams.md` | manual | Referenced via `#` in chat |
| `tool-use-standards.md` | manual | Referenced via `#` in chat |
| `security-check-workflow.md` | manual | Referenced via `#` in chat |
| `backend/backend-standards.md` | fileMatch: `backend/**/*` | Any backend file is read |
| `backend/s3-vectors-rag-chatbot.md` | manual | Referenced via `#` in chat |
| `frontend/frontend-core.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `frontend/frontend-integration-api.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `frontend/frontend-integration-aws.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `frontend/frontend-integration-patterns.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `frontend/frontend-state-i18n.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `frontend/frontend-styling.md` | fileMatch: `frontend/**/*` | Any frontend file is read |
| `security/security-iam-secrets.md` | manual | Referenced via `#` in chat |
| `security/security-data-encryption.md` | manual | Referenced via `#` in chat |
| `security/security-operations.md` | manual | Referenced via `#` in chat |
| `security/security-code-dependencies.md` | manual | Referenced via `#` in chat |
| `security/security-compliance.md` | manual | Referenced via `#` in chat |
| `security/security-scanning.md` | manual | Referenced via `#` in chat |
