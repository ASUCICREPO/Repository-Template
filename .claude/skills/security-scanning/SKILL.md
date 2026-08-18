---
name: security-scanning
description: Run CIC security scans using cdk-nag and ASH (Automated Security Helper). Triggered by: run security scan, check vulnerabilities, cdk-nag, ASH scan, before production deploy, after new AWS service, security audit, scan dependencies.
---

Read `references/spec.md` for scan commands, ASH setup, and output interpretation. Also see the `security-check-workflow` skill in the `cic-core` plugin for the full 8-step workflow.

**cdk-nag (infrastructure security)**:
- Already integrated via `AwsSolutionsChecks` in `backend/lib/backend-stack.ts`
- Runs automatically on every `cdk synth`
- Checks: IAM policies, S3 security, Lambda configs, DynamoDB encryption, API Gateway security
- Fix all `[Error]` findings before deploying
- Suppression requires ADR-format justification:
  ```typescript
  NagSuppressions.addResourceSuppressions(resource, [{
    id: 'AwsSolutions-IAM4',
    reason: 'ADR: AWS managed policy required for CloudWatch Logs'
  }]);
  ```

**ASH - Automated Security Helper**:
```bash
# Install
alias ash="uvx git+https://github.com/awslabs/automated-security-helper.git@v3.1.12"

# Fast scan (use during development)
ash --mode local

# Comprehensive scan (use before production)
ash --mode container

# Specific directory
ash --mode local --source-dir backend/lambda
```

**When to run**: before production deploy, after adding new AWS services, after dependency updates, when handling sensitive data, before creating PRs.

**Prioritization order**:
1. Critical/High severity in production code
2. Secrets/credentials exposure
3. IAM overpermissions
4. Data encryption issues
5. Dependency vulnerabilities with known exploits
6. Medium severity
7. Low severity and informational

See `references/spec.md` for ASH output format and remediation workflow.
