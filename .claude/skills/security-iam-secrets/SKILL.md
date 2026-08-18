---
name: security-iam-secrets
description: Enforce CIC IAM least-privilege and secrets management standards. Triggered by: writing IAM policy, Lambda role, CDK grants, accessing secrets, Secrets Manager, credentials, SSM Parameter Store, any code handling sensitive config.
---

Read `references/spec.md` before writing any IAM or secrets code.

**IAM non-negotiables**:

| Rule | Detail |
|------|--------|
| No wildcard actions | Never `service:*` — enumerate specific API actions |
| No wildcard resources | Always scope `Resource` to specific ARNs |
| No `iam:*` ever | Privilege escalation vector |
| One role per Lambda | Each Lambda/ECS task gets its own IAM role |
| Add conditions | `aws:SourceAccount`, `aws:SourceArn`, or `aws:PrincipalOrgID` |

Prefer CDK grant methods (`bucket.grantRead()`, `table.grantReadWriteData()`) over manual policy statements. For Bedrock, write explicit policy statements scoped to specific model ARNs.

**Secrets non-negotiables**:

| Rule | Detail |
|------|--------|
| No hardcoded secret paths | Pass secret names/ARNs via CDK environment variables |
| Use Secrets Manager or SSM | All credentials, API keys, tokens stored there |
| Narrow access | `secretsmanager:GetSecretValue` on specific secret ARN only |
| Rotation enabled | Enable automatic rotation where supported |
| Never log secrets | No secret values in CloudWatch, Step Functions state, or S3 |

**cdk-nag**: `AwsSolutionsChecks` runs on every `cdk synth` and catches IAM/secrets violations. Fix all errors. Suppressions require ADR-format justification.

See `references/spec.md` for CDK patterns and cdk-nag suppression format.
