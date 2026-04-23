---
inclusion: always
---

# CIC Project Standards

This file provides universal standards for all AI agents working on CIC (Cloud Innovation Center) projects.

> **CIC Rules (CIC-01 through CIC-12)** → #[[file:.kiro/steering/cic-standards.md]]
> **Orchestration & delegation rules** → #[[file:.kiro/steering/main-agent-orchestration.md]]
> **Tool discovery & usage** → #[[file:.kiro/steering/cic-tool-use-standards.md]]
> **Backend-specific patterns** → #[[file:.kiro/steering/backend/backend-standards.md]]
> **Security requirements** → `.kiro/steering/security/`

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
├── docs/                 # CIC closure documentation
│   ├── architectureDeepDive.md
│   ├── deploymentGuide.md
│   ├── userGuide.md
│   ├── APIDoc.md
│   ├── modificationGuide.md
│   └── projectClosure.md
└── aidlc-docs/           # AI-DLC workflow artifacts (generated)
```

## Code Conventions

**TypeScript (CDK):**
- Strict mode enabled
- Prefer interfaces over types
- Export types explicitly
- Meaningful variable names

**Python (Lambda):**
- PEP 8 style guide
- Type hints required
- Thin Lambda handlers
- Entry point: `lambda_handler(event, context)`
- Structured JSON logging via `logging` module (never `print()`)

## Boundaries

**Always do:**
- Run `cdk synth` before committing backend changes (runs cdk-nag)
- Run tests before committing
- Use CDK grant methods for IAM permissions
- Validate environment variables at Lambda startup

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

## Steering File Reference

| File | Inclusion | Loads When |
|------|-----------|------------|
| `AGENTS.md` | always | Every interaction |
| `cic-standards.md` | always | Every interaction |
| `cic-tool-use-standards.md` | always | Every interaction |
| `main-agent-orchestration.md` | always | Every interaction |
| `architecture-diagrams.md` | manual | Referenced via `#` in chat |
| `backend/backend-standards.md` | fileMatch: `backend/**/*` | Any backend file is read |
| `backend/s3-vectors-rag-chatbot.md` | manual | Referenced via `#` in chat |
| `backend/api-gateway-patterns.md` | manual | Referenced via `#` in chat |
| `backend/bedrock-patterns.md` | manual | Referenced via `#` in chat |
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
