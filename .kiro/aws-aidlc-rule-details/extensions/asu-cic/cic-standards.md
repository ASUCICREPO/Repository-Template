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

## Rule CIC-01: Repository Structure and Language Conformance

**Rule**: Before generating any code or project artifacts, the agent MUST scan the existing repository to understand:
1. The current directory hierarchy (folder structure, naming conventions, nesting patterns)
2. The languages and frameworks already in use (file extensions, config files, import patterns)
3. Existing conventions (naming style, module organization, config file locations)

All generated code MUST conform to the established repository template:
- New files MUST be placed in the correct existing directories (e.g., Lambda handlers in `backend/lambda/`, CDK stacks in `backend/lib/`, React components in `frontend/components/`)
- New directories MUST follow the naming conventions of existing directories (e.g., lowercase, kebab-case, or whatever the repo uses)
- Generated code MUST use the same languages as the existing codebase for the same layer (e.g., if backend infrastructure is TypeScript CDK, new infrastructure must also be TypeScript CDK; if Lambda handlers are Python, new handlers must also be Python)
- Do NOT introduce new top-level directories or restructure existing ones without explicit user approval
- Do NOT introduce new languages or frameworks that conflict with what the repo already uses

**Verification**:
- The agent performed a directory scan before generating code
- All new files are placed within the existing directory structure
- No new top-level directories were created without user approval
- Generated code uses the same languages as existing code for the same layer
- File and folder naming conventions match the existing repo patterns

---

## Rule CIC-02: Serverless-First Architecture

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

## Rule CIC-03: CDK Infrastructure Only

**Rule**: All AWS infrastructure MUST be defined using AWS CDK with TypeScript. Use L2 or L3 constructs exclusively — never L1 (Cfn*) constructs unless no L2/L3 equivalent exists (document the exception). No manual AWS Console configurations.

**Verification**:
- All infrastructure is defined in CDK TypeScript files under `backend/lib/`
- No L1 (Cfn*) constructs are used without a documented exception
- No instructions reference manual AWS Console steps for resource creation

---

## Rule CIC-04: Technology Stack Compliance

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

## Rule CIC-05: No Hardcoded Configuration

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

## Rule CIC-06: IAM Least Privilege

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

## Rule CIC-07: CORS Configuration

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

## Rule CIC-08: Structured Logging

**Rule**: All Lambda functions MUST use structured JSON logging via the Python `logging` module. Raw `print()` statements are prohibited in production code. Logs MUST include action context and MUST NOT contain PII.

**Verification**:
- No `print()` statements in Lambda handler code (except in test files)
- All logging uses `logger.info(json.dumps({...}))` or equivalent structured format
- No PII (emails, names, phone numbers) appears in log output
- Log level is configurable via environment variable

---

## Rule CIC-09: Latest Stable Dependencies

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

## Rule CIC-10: API Contract Before Integration

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

## Rule CIC-11: Lambda Consolidation

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
- Multi-endpoint Lambdas use path routing (switch/case on path)

---

## Rule CIC-12: Data Store Security

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

## Rule CIC-13: CDK Outputs and Documentation

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

## Rule CIC-14: TypeScript Strict Mode and Environment Variable Validation

**Rule**: All frontend TypeScript code MUST use strict mode enabled in `tsconfig.json`. All environment variables accessed in frontend code MUST be validated at application startup with clear error messages if missing or invalid.

**Verification**:
- `tsconfig.json` has `"strict": true` enabled
- All `process.env` or `import.meta.env` accesses are validated before use
- Missing environment variables cause application startup failure with descriptive error messages
- No runtime errors due to undefined environment variables

---

## Rule CIC-15: Session ID Requirements

**Rule**: All chat or conversational interfaces MUST generate and maintain a unique session ID for each user session. The session ID MUST be included in all API requests to backend services for conversation continuity and logging correlation.

**Verification**:
- Session ID is generated on chat interface initialization (UUID or similar)
- Session ID is persisted across page refreshes (localStorage or sessionStorage)
- All chat API requests include the session ID in headers or request body
- Backend logs include session ID for request correlation

---

## Rule CIC-16: AWS SDK Credential Management

**Rule**: Frontend code using AWS SDK MUST use Cognito Identity Pool credentials. Direct AWS credentials (access keys, secret keys) MUST NEVER be embedded in frontend code or configuration files.

**Verification**:
- AWS SDK clients use `fromCognitoIdentityPool` credential provider
- No hardcoded AWS credentials in frontend source code
- Cognito Identity Pool ID is provided via environment variable
- S3 uploads and other AWS service calls use temporary credentials from Cognito

---

## Rule CIC-17: Input Sanitization

**Rule**: All user input MUST be sanitized before being sent to backend APIs or displayed in the UI. This includes text inputs, file uploads, and any user-provided data.

**Verification**:
- User text input is trimmed and validated before API calls
- File uploads validate file type, size, and name before processing
- User-provided data is escaped before rendering in HTML
- No direct insertion of user input into SQL queries, shell commands, or HTML without sanitization

---

## Rule CIC-18: API Error Handling and Retry Logic

**Rule**: All API calls from frontend MUST implement proper error handling with user-friendly error messages. For transient errors (network failures, 5xx responses), implement exponential backoff retry logic with a maximum retry limit.

**Verification**:
- All API calls are wrapped in try-catch blocks
- Network errors display user-friendly messages (not raw error objects)
- Transient errors (5xx, network timeout) trigger automatic retry with exponential backoff
- Maximum retry limit is enforced (typically 3 attempts)
- User is notified after max retries are exhausted

---

## Rule CIC-19: Bedrock Model Validation

**Rule**: Before implementing ANY Bedrock integration, the agent MUST validate model availability in the target region by running `aws bedrock list-foundation-models` and `aws bedrock list-inference-profiles`. Prefer AWS-owned models (Nova, Titan) that don't require marketplace subscriptions.

**Verification**:
- Model availability validation is documented in design artifacts
- Model selection rationale is documented (why this model was chosen)
- If using third-party models (Claude, etc.), verification that they're enabled in the account is documented
- IAM permissions match the model invocation method (foundation model ID vs inference profile ID)

---

## Rule CIC-20: Cross-Region Inference Profile IAM Permissions

**Rule**: When using cross-region inference profiles (prefixed with `us.`, `eu.`, `ap.`), IAM policies MUST grant permissions for ALL regions in that geographic area, not just the deployment region.

**Verification**:
- IAM policies for cross-region profiles include ARNs for all possible routing regions
- For `us.` profiles: us-east-1, us-east-2, us-west-2 are all included
- For `eu.` profiles: all EU regions are included
- For `ap.` profiles: all AP regions are included
- Standard (non-prefixed) profiles only need permissions for their specific region

---

## Rule CIC-21: API Gateway Streaming Requirements

**Rule**: When implementing response streaming with API Gateway REST API V1, Lambda functions MUST use the `awslambda.streamifyResponse` wrapper (Node.js only), write HTTP status and 8-byte padding before streaming content, and call `responseStream.end()` when done.

**Verification**:
- Streaming Lambda uses `awslambda.streamifyResponse` wrapper
- Response includes HTTP status code and 8-byte padding before content
- `responseStream.end()` is called in finally block
- API Gateway integration uses `LambdaIntegration` with `proxy: true`
- Bedrock streaming uses `InvokeModelWithResponseStreamCommand`

---

## Rule CIC-23: Amplify SSR Configuration

**Rule**: Amplify apps using Next.js SSR (WEB_COMPUTE platform) MUST NOT include SPA-style custom rewrite rules (catch-all → `/index.html`). Amplify's compute layer handles routing natively for SSR. For monorepo projects, `AMPLIFY_MONOREPO_APP_ROOT` MUST be set as an environment variable on both the app and branch.

**Verification**:
- No `customRules` property in Amplify app definition for WEB_COMPUTE platform
- For monorepo projects: `AMPLIFY_MONOREPO_APP_ROOT` is set in app and branch environment variables
- `buildSpec` includes `appRoot` matching the monorepo structure
- Next.js version is 12-15 (Amplify Hosting compute supported range)

---

## Rule CIC-24: Amplify Auto-Build Trigger

**Rule**: To ensure environment variable changes (API URLs, Cognito IDs) are picked up immediately after CDK deploy, use an `AwsCustomResource` that calls `amplify:StartJob` with `Date.now()` in the `PhysicalResourceId` to force execution on every deploy.

**Verification**:
- `AwsCustomResource` is defined with `onCreate` and `onUpdate` actions
- Both actions call `amplify:StartJob` with `jobType: 'RELEASE'`
- `PhysicalResourceId` includes `Date.now()` to force execution on every deploy
- IAM policy grants `amplify:StartJob` permission for the app and branch

---

## Rule CIC-25: Security Scanning Integration

**Rule**: All CIC projects MUST integrate cdk-nag security scanning in the CDK stack via `Aspects.of(this).add(new AwsSolutionsChecks({ verbose: true }))`. cdk-nag runs automatically on every `cdk synth` and `cdk deploy`. All findings MUST be either fixed or suppressed with an ADR-format reason.

**Verification**:
- `cdk-nag` is installed as a dependency in `backend/package.json`
- `AwsSolutionsChecks` is added to the stack via `Aspects.of(this).add()`
- All cdk-nag suppressions include a reason string with ADR reference or justification
- No HIGH/CRITICAL findings are left unaddressed without documented risk acceptance

---

## Enforcement Integration

These rules are cross-cutting constraints that apply to every AI-DLC stage. At each stage:
- Evaluate all CIC rule verification criteria against the artifacts produced
- Include a "CIC Standards Compliance" section in the stage completion summary listing each rule as compliant, non-compliant, or N/A
- If any rule is non-compliant, this is a blocking CIC finding — follow the blocking finding behavior defined in the Overview
- Include CIC rule references in design documentation and code generation instructions
