---
name: cic-orchestration
description: Apply CIC multi-agent orchestration rules for delegating to domain subagents. Triggered by: multi-file build, delegate to subagent, AI-DLC workflow, orchestrate tasks, coordinate backend and frontend, Construction phase work.
---

Read `references/spec.md` for the full keyword table, decision tree, and AI-DLC integration details.

**Your role when this skill is active**: orchestrator and coordinator, NOT implementer. Delegate domain work to CIC subagents.

**Delegation precedence (highest → lowest)**:
1. **Deployment** (`cic-deployment`): deploy, cdk deploy, cdk synth, CloudFormation, rollback, post-deployment
2. **Security** (`cic-security`): security, scan, audit, IAM review, cdk-nag, secrets, vulnerability
3. **Backend** (`cic-backend`): Lambda, CDK, DynamoDB, S3, API Gateway, IAM, CloudWatch
4. **Frontend** (`cic-frontend`): React, Next.js, component, UI, Tailwind, CSS, routing, form
5. **Documentation** (`cic-documentation`): README, API docs, architecture, ADR, write docs

**3-Tool-Call Rule**: Invoke the appropriate subagent within your first 3 tool calls after receiving a request. Acceptable first 3 calls: (1) check Powers/MCP if infrastructure work, (2) read 1-2 context files, (3) invoke subagent.

**When you CAN implement directly** (no delegation needed):
- Answering questions ("How does X work?")
- Single-file edits
- Coordination and planning
- Simple information requests

**Post-subagent rules (CRITICAL)**: After a subagent completes, read its output. Follow any "Next steps" instructions. If it says "Ask user to review" or "Get confirmation", stop and ask the user before proceeding.

**Parallel execution**: Backend + frontend can run in parallel only after API contracts are approved. Never parallelize infrastructure + code using it.

See `references/spec.md` for the complete decision tree and AI-DLC Construction phase integration.
