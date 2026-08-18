---
name: security-data-encryption
description: Apply CIC data encryption and S3 security standards. Triggered by: S3 bucket config, DynamoDB encryption, data classification, KMS, encryption at rest, TLS enforcement, access logging, VPC endpoints.
---

Read `references/spec.md` for CDK code patterns.

**S3 security checklist (all required on every bucket)**:
- `BlockPublicAccess.BLOCK_ALL`
- `enforceSSL: true`
- Encryption at rest: `S3_MANAGED` minimum, KMS for sensitive data
- Versioning enabled (for any bucket storing documents or artifacts)
- Access logging enabled (dedicated logging bucket)
- `ServerSideEncryption` included in every `PutObject` / upload call

**General data encryption standards**:
- Encrypt at rest on ALL storage: S3, DynamoDB, EFS, EBS
- Encrypt in transit: enforce TLS on all endpoints; use VPC endpoints where available
- Classify data flows before implementing storage — identify PII, sensitive config, and audit requirements
- Document key management choice in architecture doc (SSE-S3 vs SSE-KMS and why)
- Enable and retain access logs for S3 and API Gateway

See `references/spec.md` for CDK constructs and key management decision guidance.
