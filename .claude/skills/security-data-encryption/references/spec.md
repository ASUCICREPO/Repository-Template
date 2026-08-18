# Security: Data & Encryption — Full Reference

## 3. S3 Security

| Practice | Detail |
|---|---|
| **Block Public Access** | Enable `BlockPublicAccess.BLOCK_ALL` on every bucket. |
| **Enforce TLS** | Set `enforceSSL: true` in CDK. |
| **Encrypt at rest** | Use `S3_MANAGED` at minimum. Prefer KMS for sensitive data. |
| **Enable versioning** | On any bucket storing documents or artifacts. |
| **Enable access logging** | Dedicated logging bucket with server access logging. |
| **Encrypt on upload** | Always include `ServerSideEncryption` in put/upload calls. |

## 6. Data Security and Encryption

| Practice | Detail |
|---|---|
| **Classify data** | State what kind of data flows through the system. |
| **Encrypt at rest everywhere** | S3, DynamoDB, EFS, EBS — all must have encryption. |
| **Encrypt in transit everywhere** | Enforce TLS. Use VPC endpoints where possible. |
| **Document key management** | State which encryption approach (SSE-S3, SSE-KMS) and why. |
| **Enable access logging** | For S3 and any API Gateway. |
