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
- documentation, README, API docs, architecture, guide, document, write docs, explain architecture, closure docs

> **Keyword Precedence (highest to lowest):** Deployment > Security > Backend > Frontend > Documentation. When a request matches multiple keyword lists, delegate to the highest-priority matching agent. For example, "deploy the Lambda function" matches both Backend and Deployment — delegate to `cic-deployment`.

> **AI-DLC vs Direct Delegation:** Keyword-triggered delegation is for changes to EXISTING code. For NEW projects or features, AI-DLC handles the planning and design phases first, then delegates to subagents during Construction. See the AI-DLC Integration section below.

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
Step 1: Is this a new project/feature to build or plan?
    ↓ YES → Use AI-DLC workflow (Inception → Construction → Operations)
    ↓ NO
    ↓
Step 2: Does it contain domain keywords for existing code?
    ↓ YES
    ↓ → Check Powers/MCP if needed (1 call)
    ↓ → Read context files if needed (1-2 calls)
    ↓ → DELEGATE TO SUBAGENT (by call #3)
    ↓
    ↓ NO
    ↓
Step 3: Is it asking to modify/fix existing code?
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

## AI-DLC Integration

The AI-DLC Power (`.kiro/powers/ai-dlc-methodology/`) provides the development workflow. The main agent orchestrates AI-DLC's phases and delegates implementation to CIC subagents.

### When AI-DLC Activates

**AI-DLC is the DEFAULT workflow for any project or feature creation.** It activates when:
- User describes a new project or feature to build (e.g., "build me a chatbot", "create a document upload system")
- User provides a scope document, requirements, or project description
- User asks to create specs, requirements, designs, or architecture
- User explicitly says "using AI-DLC"
- User asks to start, plan, or design something new

**AI-DLC does NOT activate for:**
- Direct implementation requests on existing code (e.g., "fix this bug", "add CORS headers")
- Single-file edits or quick changes
- Questions, queries, or information requests
- Deployment, debugging, or security scanning

When in doubt: if the request involves planning, designing, or building something new from scratch, use AI-DLC. If it's modifying existing code or a targeted fix, delegate directly to the appropriate subagent.

### Main Agent's Role in AI-DLC

**Inception Phase (main agent drives directly):**
- Follow the AI-DLC core workflow in `.kiro/powers/ai-dlc-methodology/steering/core-workflow.md`
- Load workflow files from `.kiro/powers/ai-dlc-methodology/workflows/` as directed
- Execute workspace detection, requirements analysis, user stories, application design, units generation
- Present approval gates to the user at each stage
- The main agent handles Inception directly — do NOT delegate to subagents during Inception

**Construction Phase (main agent delegates to subagents):**
- AI-DLC produces a code generation plan with checkboxes for each unit of work
- For each code generation step, delegate to the appropriate CIC subagent:
  - Backend steps (CDK, Lambda, DynamoDB, S3, API Gateway) → `cic-backend`
  - Frontend steps (React, Next.js, Tailwind, pages) → `cic-frontend`
  - Deployment artifacts (deploy scripts, buildspec) → `cic-deployment`
- After each subagent completes, mark the corresponding checkbox in the AI-DLC plan
- Include the path to the unit's design artifacts when delegating:
  ```
  invokeSubAgent(
    name: "cic-backend",
    prompt: "Implement the backend infrastructure for [unit-name].
  
  Read the design artifacts at:
  - aidlc-docs/construction/{unit-name}/functional-design/
  - aidlc-docs/construction/{unit-name}/infrastructure-design/
  - aidlc-docs/construction/{unit-name}/nfr-requirements/
  
  Follow CIC standards from steering files. [specific implementation details]"
  )
  ```

**Operations Phase (delegate to cic-deployment):**
- AI-DLC's Operations phase is a placeholder
- Delegate deployment work to `cic-deployment` subagent
- Delegate closure documentation to `cic-documentation` subagent

### UI/UX Design Integration

After AI-DLC's Inception phase completes and before Construction begins, offer the user the option to provide UI/UX designs:

- Figma design URL → Use Figma Power to extract design context, include URL when delegating to `cic-frontend`
- Uploaded design images → Include image references when delegating to `cic-frontend`
- Skip → Proceed with best practices

### Construction Phase Parallelization

During AI-DLC's Construction phase, apply these rules when delegating to subagents:

**Parallel Execution Rules:**
- ✅ Backend + frontend for the same unit (after API contract is defined in design artifacts)
- ✅ Different units with no shared dependencies
- ✅ Multiple instances of same agent (2x cic-backend for independent units)
- ❌ Shared files or dependencies (A needs B's output)
- ❌ Infrastructure + code using it (deploy infra first)
- ❌ Frontend integration before API contract is defined in design artifacts

**Quick Check:** Can both tasks complete without knowing the other's result? → Parallelize

**Default:** Execute sequentially. Parallelize only when clearly independent.

### Test Execution Timing

When AI-DLC's code generation plan includes test steps, follow the plan's ordering. When operating outside AI-DLC (direct subagent delegation), defer tests until all implementation is complete unless the user explicitly requests them.

### Post-Implementation

After all Construction phase units are complete:
1. `cic-security`: Run security audit against CIC standards
2. `cic-deployment`: Create deployment script and/or buildspec
3. `cic-documentation`: Synthesize `aidlc-docs/` into formal closure docs in `docs/`