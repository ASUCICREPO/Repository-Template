# CIC Project Standards

## Overview
These rules are MANDATORY cross-cutting constraints for all ASU Cloud Innovation Center (CIC) projects. They apply across all AI-DLC phases and are enforced as blocking constraints during stage completion.

**Enforcement**: At each applicable stage, the model MUST verify compliance with these rules before presenting the stage completion message to the user.

### Blocking CIC Finding Behavior
A **blocking CIC finding** means:
1. The finding MUST be listed in the stage completion message under a "CIC Standards Findings" section with the CIC rule ID and description
2. The stage MUST NOT present the "Continue to Next Stage" option until all blocking findings are resolved
3. The model MUST present only the "Request Changes" option with a clear explanation of what needs to change
4. The finding MUST be logged in `aidlc-docs/audit.md` with the CIC rule ID, description, and stage context

If a CIC rule is not applicable to the current project context, mark it as **N/A** in the compliance summary — this is not a blocking finding.

### Verification Criteria Format
Verification items are plain bullet points describing compliance checks. Each item should be evaluated as compliant or non-compliant during review.

---

## Rule CIC-01: Serverless-First Architecture

**Rule**: All CIC projects MUST use a serverless-first architecture. The default service choices are:
- Compute: AWS Lambda
- API: API Gateway (REST API V1 or HTTP API V2) or Lambda Function URLs
- Database: Amazon DynamoDB
- Storage: Amazon S3
- Authentication: Amazon Cognito

Non-serverless services (EC2, ECS, RDS, etc.) require explicit justification documented as an ADR.

**Verification**:
- No EC2 instances, ECS tasks, or RDS databases are defined without a documented ADR justifying the choice
- Lambda is used for all compute unless a documented exception exists
- DynamoDB is used for structured data unless a documented exception exists

---

## Rule CIC-02: CDK Infrastructure Only

**Rule**: All AWS infrastructure MUST be defined using AWS CDK with TypeScript. Use L2 or L3 constructs exclusively — never L1 (Cfn*) constructs unless no L2/L3 equivalent exists (document the exception). No manual AWS Console configurations.

**Verification**:
- All infrastructure is defined in CDK TypeScript files under `backend/lib/`
- No L1 (Cfn*) constructs are used without a documented exception
- No instructions reference manual AWS Console steps for resource creation

---

## Rule CIC-03: Technology Stack Compliance

**Rule**: CIC projects MUST use the following technology stack:
- **Frontend**: Next.js (latest stable supported by Amplify) with TypeScript, Tailwind CSS
- **Backend infrastructure**: AWS CDK with TypeScript
- **Lambda handlers**: Python (latest supported runtime)
- **Hosting**: AWS Amplify (WEB_COMPUTE platform for SSR)

Deviations require an ADR with justification.

**Verification**:
- Frontend uses Next.js with TypeScript and Tailwind CSS
- CDK code is written in TypeScript
- Lambda handlers are written in Python
- No unapproved languages or frameworks are introduced without ADR

---

## Rule CIC-04: No Hardcoded Configuration

**Rule**: No secrets, credentials, API keys, resource ARNs, account IDs, or environment-specific configuration may be hardcoded in source code or IaC templates. All configuration MUST be provided via:
- Environment variables (for Lambda runtime config)
- CDK context variables (for deployment-time config)
- AWS Secrets Manager or SSM Parameter Store (for secrets)

**Verification**:
- No string literals in source code contain AWS account IDs, access keys, secret keys, or API tokens
- Lambda functions read all configuration from `os.environ.get()`
- CDK stacks read deployment config from `this.node.tryGetContext()`
- No `.env` files are committed to version control

---

## Rule CIC-05: IAM Least Privilege

**Rule**: Every IAM policy, role, or permission MUST follow least privilege:
- Use CDK grant methods first (`table.grantReadWriteData(fn)`, `bucket.grantRead(fn)`)
- NEVER use wildcard actions (`service:*`)
- NEVER use wildcard resources (`*`) unless the API does not support resource-level permissions (document the exception)
- One IAM role per Lambda function (CDK default)

**Verification**:
- No policy contains wildcard actions
- No policy contains wildcard resources without a documented exception
- CDK grant methods are used instead of manual PolicyStatement where possible
- Each Lambda function has its own execution role

---

## Rule CIC-06: CORS Configuration

**Rule**: CORS MUST use specific origins from environment variables — never wildcard `*`. The allowed origins list MUST include:
- The Amplify app URL (constructed from `appId`)
- `http://localhost:3000` (for local development)

Every Lambda response (including errors) MUST include CORS headers. CORS headers MUST be set in exactly ONE place — either the API Gateway/Function URL config OR the Lambda code, never both.

**Verification**:
- No CORS configuration uses `Access-Control-Allow-Origin: *`
- Allowed origins are read from environment variables or constructed from CDK outputs
- All Lambda responses include CORS headers
- CORS headers are not duplicated between gateway config and Lambda code

---

## Rule CIC-07: Structured Logging

**Rule**: All Lambda functions MUST use structured JSON logging via the Python `logging` module. Raw `print()` statements are prohibited in production code. Logs MUST include action context and MUST NOT contain PII.

**Verification**:
- No `print()` statements in Lambda handler code (except in test files)
- All logging uses `logger.info(json.dumps({...}))` or equivalent structured format
- No PII (emails, names, phone numbers) appears in log output
- Log level is configurable via environment variable

---

## Rule CIC-08: Latest Stable Dependencies

**Rule**: All dependencies MUST use the latest stable versions at the time of implementation. Before writing any dependency file (`package.json`, `requirements.txt`), the agent MUST check current versions using available tools (npm view, Context7, PyPI search).

Version pinning strategy:
- Python: Exact versions (`boto3==x.y.z`)
- npm production: Exact versions (`"next": "x.y.z"`)
- npm dev: Caret for minor updates (`"typescript": "^x.y.z"`)

**Verification**:
- Dependency files use explicit version numbers (no `latest` or unpinned)
- A lock file exists and is committed
- No known-vulnerable dependency versions are used

---

## Rule CIC-09: API Contract Before Integration

**Rule**: API contracts (endpoints, request/response formats, authentication requirements) MUST be defined and approved before any frontend integration code is written. This is a dependency constraint, not an ordering constraint — once the API contract is established, backend and frontend implementation MAY proceed in parallel.

The required sequence is:
1. API contract definition (during AI-DLC's Functional Design or Infrastructure Design stages)
2. Backend infrastructure + Lambda handlers AND frontend UI components (may run in parallel via `cic-backend` and `cic-frontend` subagents)
3. Integration verification (frontend correctly calls the defined API contract)
4. Security audit
5. Documentation

For units that contain both backend and frontend components, parallel execution with their respective CIC subagents is encouraged once the API contract is approved. This applies to both single-unit and multi-unit decompositions.

**Verification**:
- API contracts (endpoints, methods, request/response shapes) are documented in design artifacts before code generation begins
- Frontend API integration references the defined contract, not placeholder URLs or assumed shapes
- No frontend code makes assumptions about API shape without a defined contract
- When backend and frontend run in parallel, both reference the same approved API contract

---

## Rule CIC-10: Lambda Consolidation

**Rule**: Lambda functions MUST be consolidated to minimize operational complexity. Aim for 2-3 Lambda functions maximum per project unless justified. Combine related operations into single functions with routing logic.

Only separate Lambdas when there are clear reasons:
- Different execution requirements (memory, timeout, runtime)
- Different IAM permissions requiring security isolation
- Different scaling patterns
- Different deployment lifecycles

**Verification**:
- No more than 3 Lambda functions without a documented justification
- Related CRUD operations are handled by a single Lambda with routing
- Lambda separation decisions are documented as ADRs when exceeding 3 functions

---

## Rule CIC-11: Data Store Security

**Rule**: All data persistence stores MUST have:
- Encryption at rest enabled
- DynamoDB: `PAY_PER_REQUEST` billing, point-in-time recovery enabled, `RETAIN` removal policy for user data
- S3: `enforceSSL: true`, block public access unless explicitly justified
- All data stores use CDK grant methods for access control

**Verification**:
- Every DynamoDB table has encryption, PITR, and PAY_PER_REQUEST billing
- Every S3 bucket has `enforceSSL: true`
- No S3 bucket allows public access without documented justification
- Removal policies are `RETAIN` for user data, `DESTROY` only for dev/scratch resources

---

## Rule CIC-12: CDK Outputs and Documentation

**Rule**: Every resource consumed by the frontend or other stacks MUST be exported via `CfnOutput`. All architectural decisions MUST be documented as ADRs in `docs/architectureDeepDive.md` and referenced in code comments where implemented.

cdk-nag suppressions MUST include an ADR-format reason:
```typescript
NagSuppressions.addResourceSuppressions(resource, [{
  id: 'AwsSolutions-IAM4',
  reason: 'ADR: Using AWS managed policy for Lambda basic execution | Standard AWS pattern'
}]);
```

**Verification**:
- API URLs, Function URLs, bucket names, table names, and Amplify URLs are exported as CfnOutputs
- Significant architectural choices have ADR entries
- All cdk-nag suppressions include a reason string

---

## Enforcement Integration

These rules are cross-cutting constraints that apply to every AI-DLC stage. At each stage:
- Evaluate all CIC rule verification criteria against the artifacts produced
- Include a "CIC Standards Compliance" section in the stage completion summary listing each rule as compliant, non-compliant, or N/A
- If any rule is non-compliant, this is a blocking CIC finding — follow the blocking finding behavior defined in the Overview
- Include CIC rule references in design documentation and code generation instructions