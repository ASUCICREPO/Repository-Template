---
inclusion: always
---

# CIC Project Standards

## Overview

These rules are MANDATORY cross-cutting constraints for all ASU Cloud Innovation Center (CIC) projects. They apply across all AI-DLC phases and are enforced as blocking constraints during stage completion.

**Enforcement**: At each applicable AI-DLC stage, verify compliance with these rules before presenting the stage completion message. Non-compliance is a blocking finding.

### Blocking Finding Behavior

A **blocking CIC finding** means:
1. The finding MUST be listed in the stage completion message under a "CIC Standards Findings" section with the rule ID and description
2. The stage MUST NOT present "Continue to Next Stage" until all blocking findings are resolved
3. Present only "Request Changes" with a clear explanation of what needs to change
4. Log the finding in `aidlc-docs/audit.md` with the rule ID, description, and stage context

If a rule is not applicable to the current project context, mark it as **N/A** — this is not a blocking finding.

---

## Rule CIC-01: Serverless-First Architecture

**Rule**: All CIC projects MUST use a serverless-first architecture. Default services:
- Compute: AWS Lambda
- API: API Gateway (REST API V1 or HTTP API V2) or Lambda Function URLs
- Database: Amazon DynamoDB
- Storage: Amazon S3
- Authentication: Amazon Cognito

Non-serverless services require explicit justification documented in the relevant AI-DLC design artifact (e.g., `tech-stack-decisions.md` or `infrastructure-design.md`) and logged in `aidlc-docs/audit.md`.

**Verification**:
- No EC2, ECS, or RDS without a documented justification in design artifacts
- Lambda used for all compute unless documented exception exists
- DynamoDB used for structured data unless documented exception exists

---

## Rule CIC-02: CDK Infrastructure Only

**Rule**: All AWS infrastructure MUST be defined using AWS CDK with TypeScript. Use L2/L3 constructs — never L1 (Cfn*) unless no L2/L3 equivalent exists (document the exception in the relevant design artifact). No manual AWS Console configurations.

**Verification**:
- All infrastructure defined in CDK TypeScript files under `backend/lib/`
- No L1 constructs without documented exception in design artifacts
- No instructions reference manual Console steps for resource creation

---

## Rule CIC-03: Technology Stack Compliance

**Rule**: CIC projects MUST use:
- **Frontend**: Next.js (latest stable supported by Amplify) with TypeScript, Tailwind CSS
- **Backend infrastructure**: AWS CDK with TypeScript
- **Lambda handlers**: Python (latest supported runtime)
- **Hosting**: AWS Amplify (WEB_COMPUTE platform for SSR)

Deviations require justification documented in the relevant design artifact.

**Verification**:
- Frontend uses Next.js with TypeScript and Tailwind CSS
- CDK code is TypeScript
- Lambda handlers are Python
- No unapproved languages or frameworks without documented justification

---

## Rule CIC-04: No Hardcoded Configuration

**Rule**: No secrets, credentials, API keys, resource ARNs, account IDs, or environment-specific configuration may be hardcoded. All configuration MUST come from:
- Environment variables (Lambda runtime config via `os.environ.get()`)
- CDK context variables (deployment-time config via `this.node.tryGetContext()`)
- AWS Secrets Manager or SSM Parameter Store (secrets)

**Verification**:
- No string literals contain AWS account IDs, access keys, secret keys, or API tokens
- Lambda functions read config from `os.environ.get()`
- CDK stacks read deployment config from `this.node.tryGetContext()`
- No `.env` files committed to version control

---

## Rule CIC-05: IAM Least Privilege

**Rule**: Every IAM policy MUST follow least privilege:
- Use CDK grant methods first (`table.grantReadWriteData(fn)`, `bucket.grantRead(fn)`)
- NEVER use wildcard actions (`service:*`)
- NEVER use wildcard resources (`*`) unless the API requires it (document the exception)
- One IAM role per Lambda function

**Verification**:
- No wildcard actions in any policy
- No wildcard resources without documented exception
- CDK grant methods used instead of manual PolicyStatement where possible
- Each Lambda has its own execution role

---

## Rule CIC-06: CORS Configuration

**Rule**: CORS MUST use specific origins from environment variables — never wildcard `*`. Allowed origins MUST include the Amplify app URL and `http://localhost:3000`. Every Lambda response (including errors) MUST include CORS headers. CORS headers MUST be set in exactly ONE place — either gateway config OR Lambda code, never both.

**Verification**:
- No `Access-Control-Allow-Origin: *`
- Origins read from environment variables or constructed from CDK outputs
- All Lambda responses include CORS headers
- No duplicate CORS headers between gateway and Lambda

---

## Rule CIC-07: Structured Logging

**Rule**: All Lambda functions MUST use structured JSON logging via Python `logging` module. Raw `print()` is prohibited. Logs MUST NOT contain PII.

**Verification**:
- No `print()` in Lambda handler code (test files excepted)
- Logging uses `logger.info(json.dumps({...}))` or equivalent
- No PII in log output
- Log level configurable via environment variable

---

## Rule CIC-08: Latest Stable Dependencies

**Rule**: All dependencies MUST use latest stable versions at time of implementation. Before writing any dependency file, check current versions using available tools. Version pinning:
- Python: Exact (`boto3==x.y.z`)
- npm production: Exact (`"next": "x.y.z"`)
- npm dev: Caret (`"typescript": "^x.y.z"`)

**Verification**:
- Dependency files use explicit version numbers (no `latest` or unpinned)
- Lock file exists and is committed
- No known-vulnerable versions used

---

## Rule CIC-09: API Contract Before Integration

**Rule**: API contracts (endpoints, request/response formats, auth requirements) MUST be defined and approved before frontend integration code is written. Once the contract is established, backend and frontend MAY proceed in parallel.

**Verification**:
- API contracts documented in design artifacts before code generation
- Frontend references the defined contract, not placeholder URLs
- When backend and frontend run in parallel, both reference the same approved contract

---

## Rule CIC-10: Lambda Consolidation

**Rule**: Aim for 2-3 Lambda functions maximum per project. Combine related operations into single functions with routing logic. Only separate when there are clear reasons: different execution requirements, IAM permissions, scaling patterns, or deployment lifecycles.

**Verification**:
- No more than 3 Lambda functions without documented justification in design artifacts
- Related CRUD operations handled by single Lambda with routing
- Separation decisions documented in `functional-design.md` or `infrastructure-design.md` when exceeding 3

---

## Rule CIC-11: Data Store Security

**Rule**: All data stores MUST have:
- Encryption at rest enabled
- DynamoDB: `PAY_PER_REQUEST`, point-in-time recovery, `RETAIN` removal policy for user data
- S3: `enforceSSL: true`, block public access unless justified
- CDK grant methods for access control

**Verification**:
- Every DynamoDB table has encryption, PITR, and PAY_PER_REQUEST
- Every S3 bucket has `enforceSSL: true`
- No public S3 access without documented justification
- Removal policies are RETAIN for user data, DESTROY only for dev/scratch

---

## Rule CIC-12: CDK Outputs and Documentation

**Rule**: Every resource consumed by frontend or other stacks MUST be exported via `CfnOutput`. Significant architectural decisions MUST be documented in the relevant AI-DLC design artifacts (`tech-stack-decisions.md`, `infrastructure-design.md`, `application-design.md`). cdk-nag suppressions MUST include a reason string explaining the justification.

**Verification**:
- API URLs, Function URLs, bucket names, table names exported as CfnOutputs
- Significant architectural choices documented in AI-DLC design artifacts
- All cdk-nag suppressions include a reason string
- Decision rationale is traceable through `aidlc-docs/audit.md`

---

## Enforcement Integration

At each AI-DLC stage:
1. Evaluate all CIC rule verification criteria against artifacts produced
2. Include a "CIC Standards Compliance" section in the stage completion summary
3. List each rule as: ✅ compliant, ❌ non-compliant (blocking), or N/A
4. Non-compliant rules block stage progression until resolved
5. Reference CIC rule IDs in design documentation and code generation instructions
