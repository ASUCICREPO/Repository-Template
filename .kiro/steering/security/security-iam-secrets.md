---
inclusion: manual
---

# Security: IAM & Secrets Management

IAM least privilege and secrets management best practices for CIC projects.

## 1. IAM and Access Control

| Practice | Detail |
|---|---|
| **No wildcard actions** | Never use `service:*`. Enumerate the specific API actions your code actually calls. |
| **No wildcard resources** | Always scope `Resource` to specific ARNs. Use CDK-generated ARNs (e.g., `bucket.bucketArn`, `table.tableArn`). |
| **No `iam:*` ever** | This is a privilege escalation vector. If your deployment needs to create roles, use a narrowly scoped deployment role created out of band. |
| **One role per function** | Each Lambda function or ECS task gets its own IAM role with only the permissions that specific function requires. |
| **Add conditions** | Use conditions like `aws:SourceAccount`, `aws:SourceArn`, or `aws:PrincipalOrgID` to restrict trust relationships. |
| **cdk-nag enforces automatically** | `AwsSolutionsChecks` in `backend-stack.ts` catches wildcard actions/resources, managed policies, and overpermissive roles on every `cdk synth`. Fix findings before suppressing. |

### Example: Before and After

**Before (non-compliant):**
```python
iam.PolicyStatement(actions=["s3:*"], resources=["*"])
```

**After (compliant):**
```python
iam.PolicyStatement(
    actions=["s3:GetObject", "s3:PutObject"],
    resources=[f"{input_bucket.bucket_arn}/*", f"{output_bucket.bucket_arn}/*"],
    conditions={"StringEquals": {"aws:SourceAccount": core.Aws.ACCOUNT_ID}}
)
```

## 2. Secrets Management

| Practice | Detail |
|---|---|
| **No hardcoded secret paths** | Pass secret names or ARNs via environment variables set by CDK/CloudFormation. |
| **Use Secrets Manager or Parameter Store** | All credentials, API keys, and tokens must be stored in AWS Secrets Manager or SSM Parameter Store. |
| **Grant narrow access** | The Lambda role should have `secretsmanager:GetSecretValue` only on the specific secret ARN it needs. |
| **Rotate secrets** | Enable automatic rotation where supported. Document rotation procedures for third-party credentials. |
| **Never log secrets** | Ensure no secret value is written to CloudWatch Logs, Step Functions state, or S3. |

### Example: Correct Pattern

```typescript
// Infrastructure (CDK)
const secret = secretsmanager.Secret.fromSecretNameV2(this, 'MySecret', 'my-app/credentials');
myFunction.addEnvironment('SECRET_ARN', secret.secretArn);
secret.grantRead(myFunction);
```

```python
# Lambda application code
import os, boto3, json

def get_credentials():
    secret_arn = os.environ.get('SECRET_ARN')
    if not secret_arn:
        raise RuntimeError("Environment variable SECRET_ARN must be set to a valid Secrets Manager ARN.")
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_arn)
    return json.loads(response['SecretString'])
```
