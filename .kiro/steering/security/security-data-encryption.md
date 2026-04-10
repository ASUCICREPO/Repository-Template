---
inclusion: manual
---

# Security: Data & Encryption

S3 security, data encryption, and data classification best practices for CIC projects.

## 3. S3 Security

### Best Practices

| Practice | Detail |
|---|---|
| **Block Public Access** | Enable `BlockPublicAccess.BLOCK_ALL` on every bucket. No exceptions for PoCs. |
| **Enforce TLS** | Set `enforce_ssl=True` in CDK or add a bucket policy denying `aws:SecureTransport = false`. |
| **Encrypt at rest** | Use `encryption=s3.BucketEncryption.S3_MANAGED` at minimum. Prefer KMS for sensitive data. |
| **Enable versioning** | Enable on any bucket storing documents or artifacts. |
| **Enable access logging** | Create a dedicated logging bucket and enable server access logging on all data buckets. |
| **Encrypt on upload** | Always include `ServerSideEncryption` in `put_object` and `upload_file` calls. |
| **Auto-delete for PoC** | Use `removal_policy=RemovalPolicy.DESTROY` and `auto_delete_objects=True` so PoC resources clean up. |

### Example: Secure Bucket in CDK

```typescript
const myBucket = new s3.Bucket(this, 'MyBucket', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,
  versioned: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  serverAccessLogsBucket: logBucket,
  serverAccessLogsPrefix: 'my-bucket-logs/',
});
```

## 6. Data Security and Encryption

| Practice | Detail |
|---|---|
| **Classify data** | Even in a PoC, state what kind of data flows through the system (e.g., "user-uploaded PDFs, potentially containing PII"). |
| **Encrypt at rest everywhere** | S3 buckets, DynamoDB tables, EFS volumes, EBS volumes — all must have encryption enabled. |
| **Encrypt in transit everywhere** | Enforce TLS. Use VPC endpoints for AWS service calls where possible. |
| **Encrypt on every upload** | Include `ServerSideEncryption` on every `put_object` call. Don't rely solely on bucket defaults. |
| **Document key management** | State which encryption approach is used (SSE-S3, SSE-KMS) and why. |
| **Enable access logging** | For S3 and any API Gateway. This is your audit trail. |
