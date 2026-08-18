---
inclusion: manual
---

# Security: IAM & Secrets Management

## 1. IAM and Access Control

| Practice | Detail |
|---|---|
| **No wildcard actions** | Never use `service:*`. Enumerate specific API actions. |
| **No wildcard resources** | Always scope `Resource` to specific ARNs. Use CDK-generated ARNs. |
| **No `iam:*` ever** | Privilege escalation vector. Use narrowly scoped deployment roles. |
| **One role per function** | Each Lambda/ECS task gets its own IAM role. |
| **Add conditions** | Use `aws:SourceAccount`, `aws:SourceArn`, or `aws:PrincipalOrgID`. |
| **cdk-nag enforces** | `AwsSolutionsChecks` catches wildcards on every `cdk synth`. |

## 2. Secrets Management

| Practice | Detail |
|---|---|
| **No hardcoded secret paths** | Pass secret names/ARNs via environment variables set by CDK. |
| **Use Secrets Manager or Parameter Store** | All credentials, API keys, tokens must be stored there. |
| **Grant narrow access** | `secretsmanager:GetSecretValue` only on specific secret ARN. |
| **Rotate secrets** | Enable automatic rotation where supported. |
| **Never log secrets** | No secret values in CloudWatch Logs, Step Functions state, or S3. |
