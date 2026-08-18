---
inclusion: manual
---

# Security: Automated Scanning Tools

## cdk-nag (Infrastructure Security)

Already integrated via `AwsSolutionsChecks` in `backend/bin/backend.ts`. Runs on every `cdk synth`.

**Checks**: IAM policies, S3 security, Lambda configs, DynamoDB encryption, API Gateway security.

**Suppressing findings** (when justified):
```typescript
NagSuppressions.addResourceSuppressions(resource, [{
  id: 'AwsSolutions-IAM4',
  reason: 'ADR: AWS managed policy required for CloudWatch Logs'
}]);
```

## ASH - Automated Security Helper

Multi-scanner: SAST (Bandit, Semgrep), Secrets (detect-secrets), IaC (Checkov, cfn-nag), SCA (npm-audit, Grype), SBOM (Syft).

```bash
# Install
alias ash="uvx git+https://github.com/awslabs/automated-security-helper.git@v3.1.12"

# Usage
ash --mode local                          # Fast scan
ash --mode container                      # Comprehensive (requires Docker)
ash --mode local --source-dir backend/lambda  # Specific directory
```

## When to Run

- Before deploying to production
- After adding new AWS services
- After updating dependencies
- When handling sensitive data
- Before creating pull requests

## Prioritizing Findings

1. Critical/High severity in production code
2. Secrets/credentials exposure
3. IAM overpermissions
4. Data encryption issues
5. Dependency vulnerabilities with known exploits
6. Medium severity
7. Low severity and informational
