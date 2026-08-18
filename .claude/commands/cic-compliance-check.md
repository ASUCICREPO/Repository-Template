---
description: Scans backend and frontend against CIC standards using specialized subagents.
---

The user has triggered a CIC compliance check. Orchestrate a comprehensive audit using specialized subagents:

## Step 1: Security Audit
Delegate to the `cic-security` subagent:
'Perform a comprehensive CIC security compliance scan on backend/lib, backend/lambda, and frontend/app. Check against all security standards skills:
- security-iam-secrets (IAM policies, secrets management)
- security-data-encryption (S3, DynamoDB encryption, enforceSSL)
- security-code-dependencies (pinned deps, no hardcoded secrets)
- security-operations (error handling, logging, no PII in logs)
- security-compliance (SECURITY.md, threat model, tagging)

Provide findings in priority order: CRITICAL → HIGH → MEDIUM → LOW'

## Step 2: Backend Compliance
Delegate to the `cic-backend` subagent:
'Review backend infrastructure against the backend-standards skill. Check:
- Lambda definitions (architecture detection, runtime, timeout)
- DynamoDB configuration (PAY_PER_REQUEST, encryption, PITR)
- S3 bucket configuration
- API Gateway setup
- CDK best practices (grant methods, env vars, CfnOutputs)'

## Step 3: Frontend Compliance
Delegate to the `cic-frontend` subagent:
'Review frontend code against the frontend standards skills. Check:
- Next.js App Router patterns
- Component structure and organization
- API integration patterns
- Error handling and loading states
- Accessibility compliance'

## Step 4: Consolidate Results
After all subagents complete:
1. Create a summary table with PASS/FAIL/WARNING per category
2. Consolidate all findings into a prioritized fix list
3. Provide specific code snippets for each FAIL
4. Ask user if they want to apply fixes (delegate to appropriate subagent)
