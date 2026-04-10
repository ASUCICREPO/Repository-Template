---
inclusion: manual
---

# Security: Automated Scanning Tools

Comprehensive guide to cdk-nag and ASH security scanning tools for CIC projects. Referenced by Security Check hook.

## 11. Automated Security Scanning

CIC projects use AWS-recommended security tools integrated via Kiro's Security Check hook.

### Security Check Hook

**Trigger**: Click "Security Check" button in Agent Hooks panel
**Tools**: Automatically selects cdk-nag and/or ASH based on context
**Workflow**: Scans → Parses results → Prioritizes findings → Provides fixes

### Tool 1: cdk-nag (Infrastructure Security)

**Purpose**: Validates CDK/CloudFormation against AWS best practices during synthesis

**What it checks**:
- IAM policies (wildcards, least privilege)
- S3 security (encryption, public access)
- Lambda configurations
- DynamoDB encryption
- API Gateway security

**Installation**:
```bash
cd backend
npm install cdk-nag
```

**Integration** (add to `backend/bin/backend.ts`):
```typescript
import { App, Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new App();
// ... create stacks ...
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
app.synth();
```

**Suppressing findings** (when justified):
```typescript
import { NagSuppressions } from 'cdk-nag';

NagSuppressions.addResourceSuppressions(resource, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'AWS managed policy required for CloudWatch Logs. See ADR in architectureDeepDive.md',
  },
]);
```

### Tool 2: ASH - Automated Security Helper (Comprehensive Scanning)

**Purpose**: Multi-scanner orchestration for SAST, SCA, IaC, and secrets detection

**What it checks**:
- **SAST**: Python (Bandit), Multi-language (Semgrep)
- **Secrets**: Hardcoded credentials (detect-secrets)
- **IaC**: CloudFormation, Terraform (Checkov, cfn-nag, cdk-nag)
- **SCA**: Dependencies (npm-audit, Grype)
- **SBOM**: Software bill of materials (Syft)

**Installation**:
```bash
# Install uv package manager
curl -sSfL https://astral.sh/uv/install.sh | sh

# Create alias
alias ash="uvx git+https://github.com/awslabs/automated-security-helper.git@v3.1.12"
```

**Usage**:
```bash
# Fast scan (Python-only scanners)
ash --mode local

# Comprehensive scan (requires Docker)
ash --mode container

# Scan specific directory
ash --mode local --source-dir backend/lambda

# View results
cat .ash/ash_output/ash_aggregated_results.json
open .ash/ash_output/reports/ash.html
```

**Configuration** (`.ash/ash.yaml` in project root):
```yaml
project_name: my-cic-project
global_settings:
  severity_threshold: MEDIUM
  ignore_paths:
    - path: 'tests/test_data'
      reason: 'Test fixtures only'
scanners:
  bandit:
    enabled: true
  detect-secrets:
    enabled: true
  checkov:
    enabled: true
```

### When to Run Security Scans

**Always**:
- Before deploying to production
- After adding new AWS services
- After updating dependencies
- When handling sensitive data

**Consider**:
- After significant code changes
- Before creating pull requests
- Weekly on active projects
- After security advisories

### CI/CD Integration

**Development**: Use Security Check hook for on-demand scans with interactive remediation

**CI/CD**: Add automated scans to pipeline

### Prioritizing Security Findings

1. **Critical/High severity** in production code
2. **Secrets/credentials** exposure
3. **IAM overpermissions** (wildcards, admin access)
4. **Data encryption** issues
5. **Dependency vulnerabilities** with known exploits
6. **Medium severity** in production code
7. **Low severity** and informational

## Quick Reference Checklist

Use this checklist before every pull request:

```
## Security PR Checklist

### Automated Scanning
- [ ] Run Security Check hook: Click "Security Check" in Agent Hooks
- [ ] Address all Critical/High severity findings
- [ ] Document suppressions with justification

### IAM
- [ ] No wildcard actions in any IAM policy
- [ ] No wildcard resources (`*`) in any IAM policy
- [ ] Each function/task has its own role
- [ ] Permissions are commented with justification

### Secrets
- [ ] No hardcoded secret names, paths, or values in source code
- [ ] All secrets referenced via environment variables
- [ ] Secret access scoped to specific ARNs

### S3
- [ ] Block Public Access enabled on all buckets
- [ ] Encryption at rest enabled on all buckets
- [ ] TLS enforced on all buckets
- [ ] ServerSideEncryption set on all upload operations

### Code Security
- [ ] No new HIGH/CRITICAL findings from SAST tools
- [ ] Dependencies pinned to specific versions
- [ ] No known CVEs in dependencies at HIGH/CRITICAL severity
- [ ] No bare except blocks that swallow errors
- [ ] No unsanitized user input in file paths or shell commands

### AI/GenAI
- [ ] Model outputs sanitized before use in HTML/SQL/code
- [ ] Bedrock permissions scoped to specific model ARNs
- [ ] Prompt construction separates system and user content
- [ ] Model invocations are logged

### Resilience
- [ ] External API calls have retry with backoff
- [ ] Lambda functions have DLQ or on-failure destination
- [ ] Step Functions tasks have Retry and Catch blocks
- [ ] Correlation ID logged in every function

### Documentation
- [ ] SECURITY.md exists and is current
- [ ] Architecture diagram shows security boundaries
- [ ] No internal email addresses or file paths in any file
- [ ] License headers present on all source files
```

## Integration

Reference this checklist in:
- PR templates for code review
- CI/CD pipeline validation
- Pre-commit hooks for automated checks
- SECURITY.md in project root
