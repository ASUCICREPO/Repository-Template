---
inclusion: manual
---

# Security Check Workflow

## Workflow

### 1. DETERMINE SCOPE

Parse the user's message for scope:
- Specific files/directories mentioned → Scan only those
- "backend", "CDK", "infrastructure", "CloudFormation" → Focus on cdk-nag
- "Lambda", "Python", "code", "secrets", "dependencies" → Focus on ASH
- "full", "comprehensive", "entire", "everything" → Run both tools on entire codebase
- No scope specified → Ask user for clarification

### 2. SELECT TOOLS AND COMMANDS

**A. cdk-nag (CDK/CloudFormation infrastructure security)**
- Already integrated: `AwsSolutionsChecks` is wired into `backend/lib/backend-stack.ts`
- Command: `cd backend && npx cdk synth 2>&1`
- Look for: Lines with `[Error]` or `[Warning]` containing rule IDs (e.g., AwsSolutions-IAM4)

**B. ASH (Comprehensive code, secrets, dependencies, IaC scanning)**
- Command: `uvx git+https://github.com/awslabs/automated-security-helper.git@v3.1.12 [options]`
- Modes: `--mode local` (fast), `--mode container` (comprehensive), `--mode precommit` (fastest)

### 3. RUN SELECTED TOOLS

Execute appropriate commands based on scope. Check if tools are installed before running.

### 4. PARSE RESULTS

- **cdk-nag**: Extract `[Error|Warning at /Path] AwsSolutions-XXX` lines from synthesis output
- **ASH**: Read `.ash/ash_output/ash_aggregated_results.json`, group by severity

### 5. PRIORITIZE

1. Critical/High severity findings
2. Secrets/credentials exposure
3. IAM overpermissions (wildcards, admin access)
4. Data encryption issues
5. Dependency vulnerabilities with known exploits
6. Medium severity findings
7. Low severity and informational

### 6. PROVIDE REMEDIATION

For each finding: explain the risk, show problematic code with file path and line number, provide concrete fix with code example. Reference security steering files in `.kiro/steering/security/`.

### 7. OFFER TO FIX

Ask if user wants fixes applied. Prioritize by severity. Document suppressions with ADR format.

### 8. SUMMARY

Provide: total findings by severity, breakdown by tool, fixes applied (if any), recommendations for next steps.
