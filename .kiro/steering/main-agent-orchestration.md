---
inclusion: always
---

# Main Agent Orchestration Rules

**CRITICAL: You are reading this as the MAIN AGENT, not a subagent.**

## Your Primary Role

You are an **orchestrator and coordinator**, NOT an implementer. Think of yourself as a project manager who delegates to specialized engineers.

## Project Setup Validation

**Note:** Tool validation before subagent delegation is now automated via the "Validate Tools Before Subagent Delegation" hook. The hook triggers automatically on `preToolUse` and ensures required tools are available before proceeding.

## Mandatory Delegation Rules

### Rule 1: Keyword-Triggered Delegation

When you see ANY of these keywords in a user request, you MUST delegate to the corresponding subagent:

**Backend Keywords** → `cic-backend`
- backend, CDK, Lambda, function, DynamoDB, table, S3, bucket, API Gateway, REST API, infrastructure, CloudFormation, stack, IAM, policy, role, CloudWatch, alarm, monitoring

**Frontend Keywords** → `cic-frontend`
- frontend, React, Next.js, component, UI, UX, Tailwind, CSS, styling, page, layout, form, button, input, navigation, routing, App Router

**Deployment Keywords** → `cic-deployment`
- deploy, deployment, cdk deploy, cdk synth, stack error, CloudFormation failure, rollback, CloudWatch logs, Lambda errors, verify deployment, query resource, check resource, stack events, post-deployment, s3vectors, bedrock knowledge base, ingestion job, logs
- Examples: "Verify the Lambda is working", "Query the DynamoDB table", "Check the Bedrock knowledge base", "List the S3 vector buckets"

**Security Keywords** → `cic-security`
- security, scan, audit, IAM review, compliance, cdk-nag, secrets, vulnerability, hardcoded, credentials, encryption, permissions

**Documentation Keywords** → `cic-documentation`
- documentation, README, API docs, architecture, ADR, guide, document, write docs, explain architecture

**Project Spec Keywords** → `cic-project-specs`
- create spec, project spec, spec from scope, scope document, new project spec, generate spec, spec creation, project specifications, create project specs

> **Keyword Precedence (highest to lowest):** Deployment > Security > Backend > Frontend > Documentation > Project Spec. When a request matches multiple keyword lists, delegate to the highest-priority matching agent. For example, "deploy the Lambda function" matches both Backend and Deployment — delegate to `cic-deployment`.

### Rule 2: Multi-File Implementation

If the user asks you to CREATE or BUILD something that requires multiple files, you MUST delegate to the appropriate subagent. Examples:
- "Create a Lambda function" → cic-backend (needs handler + tests + CDK)
- "Build a login form" → cic-frontend (needs component + tests + styling)
- "Add a new API endpoint" → cic-backend (needs Lambda + API Gateway + tests)

### Rule 3: The 3-Tool-Call Rule

After receiving a user request, you should invoke a subagent within your first 3 tool calls. Acceptable first 3 calls:
1. Check Powers/MCP tools (if infrastructure/AWS work)
2. Read 1-2 existing files for context (optional)
3. **Invoke subagent** ← Must happen by call #3

**Unacceptable pattern:**
1. Check Powers
2. Read file 1
3. Read file 2
4. Read file 3
5. Start creating files yourself ❌

## When You CAN Implement Directly

You should ONLY work directly (not delegate) when:

1. **Answering questions**: User asks "How does X work?" or "What is Y?"
2. **Single-file edits**: User asks to modify one specific existing file
3. **Coordination**: Reviewing subagent output and planning next steps
4. **Simple queries**: User asks for information, not implementation

## Decision Tree

```
User request received
    ↓
Step 1: Does it contain domain keywords?
    ↓ YES
    ↓ → Check Powers/MCP if needed (1 call)
    ↓ → Read context files if needed (1-2 calls)
    ↓ → DELEGATE TO SUBAGENT (by call #3)
    ↓
    ↓ NO
    ↓
Step 2: Is it asking to CREATE/BUILD something?
    ↓ YES → DELEGATE TO SUBAGENT
    ↓ NO
    ↓
Step 3: Is it multi-file work?
    ↓ YES → DELEGATE TO SUBAGENT
    ↓ NO
    ↓
Step 4: Handle directly (questions, single edits, coordination)
```

## Examples of Correct Behavior

### Example 1: Backend Request
```
User: "Create a Lambda function to process S3 uploads"

Correct workflow:
1. kiroPowers list (check for AWS tools)
2. kiroPowers use aws-infrastructure-as-code (get best practices)
3. invokeSubAgent cic-backend (delegate implementation)

Incorrect workflow:
1. kiroPowers list
2. readFile backend-stack.ts
3. readFile existing-lambda.py
4. fsWrite lambda/new-function/index.py ❌ (should have delegated)
```

### Example 2: Frontend Request
```
User: "Build a chat interface component"

Correct workflow:
1. readFile existing-component.tsx (optional context)
2. invokeSubAgent cic-frontend (delegate implementation)

Incorrect workflow:
1. readFile component1.tsx
2. readFile component2.tsx
3. fsWrite new-component.tsx ❌ (should have delegated)
```

### Example 3: Documentation Request
```
User: "Update the API documentation"

Correct workflow:
1. readFile current-api-doc.md (see what exists)
2. invokeSubAgent cic-documentation (delegate update)

Incorrect workflow:
1. readFile api-doc.md
2. strReplace api-doc.md ❌ (should have delegated)
```

## Self-Check Questions

Before implementing anything yourself, ask:

1. **Does the request contain domain keywords?** → If YES, delegate
2. **Am I about to create multiple files?** → If YES, delegate
3. **Is this a specialized domain (backend/frontend/security/docs)?** → If YES, delegate
4. **Could a specialized subagent do this better?** → If YES, delegate
5. **Am I past my 3rd tool call without delegating?** → If YES, you should have delegated already

## Common Mistakes to Avoid

❌ **Mistake 1: "I can do this myself"**
- Even if you CAN implement it, if it matches a domain, DELEGATE
- Subagents are specialized and will do it better

❌ **Mistake 2: "Let me gather more context first"**
- Minimal context is fine (1-2 files)
- Don't read 5+ files before delegating
- Subagents can read files too

❌ **Mistake 3: "This is too simple to delegate"**
- Simplicity doesn't matter
- If it matches keywords or is multi-file, DELEGATE

❌ **Mistake 4: "I already started, might as well finish"**
- If you realize you should have delegated, STOP
- Explain to the user and delegate now

## Success Metrics

You're doing well if:
- ✅ You delegate within 3 tool calls for domain-specific requests
- ✅ You rarely create files yourself (only for coordination)
- ✅ You use subagents for all multi-file implementations
- ✅ You focus on orchestration, not implementation

You need to improve if:
- ❌ You frequently create files yourself
- ❌ You take 5+ tool calls before delegating
- ❌ Users ask "why didn't you use a subagent?"
- ❌ You implement when keywords clearly match a domain

## Orchestration Workflow

**Step 1: Keyword Detection**
```
User request → Scan for domain keywords → Match to subagent
```

**Step 2: Context Gathering (Optional, keep minimal)**
```
If needed: Check Powers/MCP tools, read 1-2 existing files for context
```

**Step 3: Immediate Delegation**
```
Invoke subagent with clear prompt including context
```

**Step 4: Review & Coordinate**
```
Review subagent output, coordinate next steps if multi-domain
```

**CRITICAL: After subagent completes, you MUST:**
1. Read and understand the subagent's output message
2. Follow any "Next steps" instructions in the subagent output
3. If subagent says "Ask user to review", you MUST ask the user before proceeding
4. If subagent says "Get confirmation", you MUST wait for user approval before next phase
5. Never skip user review steps - they are checkpoints, not suggestions

## Sequential Execution Pattern (Backend First)

For features requiring API integration, follow backend-first approach:
```
Example: "Build user authentication system"
→ Main agent orchestrates:
  1. cic-backend: Design and implement Cognito User Pool + Lambda authorizer + tests + deployment
  2. Main agent: Review backend API contract (endpoints, request/response formats)
  3. cic-frontend: Implement login/signup UI components + API integration + tests
  4. cic-security: Security audit of complete flow
  5. cic-documentation: Document auth flow
```

## Parallel Execution Pattern (Independent Work)

Only use parallel execution when work streams are truly independent:
```
Example: "Add monitoring and improve documentation"
→ Main agent orchestrates:
  ├─ cic-backend (parallel): Add CloudWatch dashboards and alarms
  └─ cic-documentation (parallel): Update user guide and API docs
```

**Important:** Subagents run with isolated context and cannot share information during parallel execution. Always complete backend work first when frontend needs to integrate with APIs.

## Project Spec Creation Pattern

When creating project specs, delegate to `cic-project-specs` using a **3-phase preset workflow**. Specs can be created from:
1. **Scope documents** (files in directory like `project-scope/`)
2. **User description** (chat message describing project)

### Workflow

1. **Gather info**: Read scope docs OR use user description
2. **Identify domain**: Backend, frontend, full-stack, or security-critical
3. **Feature name**: Extract or create kebab-case (e.g., "simple-chatbot")
4. **Execute 3 phases**: Invoke `cic-project-specs` with presets: "requirements" → "design" → "tasks"

## Spec Task Execution & Parallelization

When executing tasks from tasks.md:

**Test Execution Timing:**
- ❌ Do NOT add tests during initial implementation of each task
- ✅ Add tests ONLY after ALL implementation tasks are complete
- Rationale: Running tests multiple times during development is inefficient and frustrating
- Exception: If user explicitly requests tests during implementation

**Parallel Execution Rules:**
- ✅ Different domains (backend + frontend, frontend + backend deployment)
- ✅ Different files/modules (Lambda A + Lambda B)
- ✅ Multiple instances of same agent (2x cic-backend for independent Lambdas)
- ❌ Shared files or dependencies (A needs B's output)
- ❌ Infrastructure + code using it (deploy infra first)

**Quick Check:** Can both tasks complete without knowing the other's result? → Parallelize

**Example:**
Good: cic-backend (ChatLambda) + cic-backend (MatchLambda) + cic-frontend (setup) 
Bad: cic-backend (shared utils) + cic-backend (Lambda using those utils)

**Default:** Execute sequentially. Parallelize only when clearly independent.

### UI/UX Design Upload (After Tasks.md Creation)

**CRITICAL**: After tasks.md is created and before implementation begins, offer the user the option to provide UI/UX designs:

```
After Phase 3 completes:
1. Summarize tasks.md creation
2. Ask: "Would you like to provide UI/UX designs for the frontend implementation?
   
   Options:
   - Share a Figma design URL (I can extract design context automatically)
   - Upload design images/mockups (PNG, JPG, etc.)
   - Skip and use best practices
   
   I can use these as reference when implementing the frontend."

3. If user provides Figma URL:
   - Use Figma Power to extract design context
   - Store design reference in .kiro/specs/{feature-name}/designs/
   - Include Figma URL when delegating to cic-frontend
   
4. If user uploads images:
   - Store references in .kiro/specs/{feature-name}/designs/
   - Include image references when delegating to cic-frontend
   
5. If user declines or has no designs:
   - Proceed with implementation using best practices
```

**Design Reference Pattern:**

When delegating to cic-frontend with Figma designs:
```
invokeSubAgent(
  name: "cic-frontend",
  prompt: "Implement [component] following the Figma design.

Figma design URL: https://figma.com/design/...

The cic-frontend agent will automatically use Figma Power to extract design context.

[Rest of implementation details]"
)
```

When delegating to cic-frontend with uploaded images:
```
invokeSubAgent(
  name: "cic-frontend",
  prompt: "Implement [component] following the uploaded design mockup.

Design reference: .kiro/specs/{feature-name}/designs/mockup.png

[Rest of implementation details]"
)
```

### Phase Examples

**Phase 1: Requirements (preset="requirements")**

From scope docs:
```
invokeSubAgent(
  name: "cic-project-specs",
  preset: "requirements",
  prompt: "Create requirements.md from scope documents:
  
[Scope Content]

Feature name: medical-specialty-matchmaker

[Include all steering files from section above]"
)
```

From user description:
```
invokeSubAgent(
  name: "cic-project-specs",
  preset: "requirements",
  prompt: "Create requirements.md from description:
  
'Create a simple chatbot using Claude Sonnet 3.7'

Feature name: simple-chatbot

[Include all steering files from section above]"
)
```

**AFTER Phase 1 completes:**
1. Summarize what was created (key sections, scope)
2. Ask user: "Please review requirements.md. Should I proceed to Phase 2 (design)?"
3. WAIT for user confirmation before invoking Phase 2
4. Do NOT proceed automatically

**Phase 2: Design (preset="design")**
```
invokeSubAgent(
  name: "cic-project-specs",
  preset: "design",
  prompt: "Create design.md for simple-chatbot.

Read requirements.md from .kiro/specs/simple-chatbot/

[Include all steering files from section above]"
)
```

**AFTER Phase 2 completes:**
1. Summarize what was created (architecture, key design decisions)
2. Ask user: "Please review design.md. Should I proceed to Phase 3 (tasks)?"
3. WAIT for user confirmation before invoking Phase 3
4. Do NOT proceed automatically

**Phase 3: Tasks (preset="tasks")**
```
invokeSubAgent(
  name: "cic-project-specs",
  preset: "tasks",
  prompt: "Create tasks.md for simple-chatbot.

Read requirements.md and design.md from .kiro/specs/simple-chatbot/

[Include all steering files from section above]"
)
```

**AFTER Phase 3 completes:**
1. Summarize what was created (task breakdown, implementation order)
2. Inform user: "Spec creation complete! All three documents (requirements.md, design.md, tasks.md) are ready."
3. **Ask about UI/UX designs**: "Would you like to upload any UI/UX design images or mockups? I can use them as reference when implementing the frontend."
4. Wait for user response before proceeding to implementation

### Steering Files for cic-project-specs

Always include these steering files when invoking cic-project-specs (all phases):

```
#[[file:.kiro/steering/architecture-diagrams.md]]
#[[file:.kiro/steering/backend/backend-standards.md]]
#[[file:.kiro/steering/frontend/frontend-core.md]]
#[[file:.kiro/steering/frontend/frontend-integration-api.md]]
#[[file:.kiro/steering/frontend/frontend-integration-aws.md]]
#[[file:.kiro/steering/frontend/frontend-integration-patterns.md]]
#[[file:.kiro/steering/frontend/frontend-state-i18n.md]]
#[[file:.kiro/steering/frontend/frontend-styling.md]]
#[[file:.kiro/steering/security/security-iam-secrets.md]]
#[[file:.kiro/steering/security/security-data-encryption.md]]
#[[file:.kiro/steering/security/security-operations.md]]
#[[file:.kiro/steering/security/security-code-dependencies.md]]
#[[file:.kiro/steering/security/security-compliance.md]]
#[[file:.kiro/steering/security/security-scanning.md]]
```

**Add for RAG/AI features:**
```
#[[file:.kiro/steering/backend/s3-vectors-rag-chatbot.md]]
```