# AI-DLC Documentation

![AI-DLC Workflow](./ai-dlc.png)

This document provides comprehensive information about using AI-DLC (AI Development Lifecycle) and the files it generates.

---

## Table of Contents

- [What is AI-DLC?](#what-is-ai-dlc)
- [Getting Started](#getting-started)
- [Writing Effective Prompts](#writing-effective-prompts)
- [How AI-DLC Works](#how-ai-dlc-works)
- [Prerequisites](#prerequisites)
- [Adding Custom Rules](#adding-custom-rules-to-cic-extensions-optional)
- [Generated Files](#generated-files)
- [Team Collaboration](#team-collaboration)

---

## What is AI-DLC?

AI-DLC (AI Development Lifecycle) is a structured workflow that guides AI through requirements → design → implementation → testing. It ensures consistent, well-documented development with human oversight at each stage.

---

## Getting Started

**IMPORTANT: Always use Vibe mode in Kiro when working with AI-DLC.**

Start your request with `using AI-DLC:` to activate the workflow:

```
using AI-DLC: [your project description]
```

AI-DLC will guide you through planning, ask clarifying questions, generate documentation, and then build your application. You review and approve at each stage.

### Why Vibe Mode?

Vibe mode in Kiro provides the optimal environment for AI-DLC workflows:
- Enables subagent delegation for specialized tasks (backend, frontend, security, deployment)
- Allows autonomous execution of multi-step workflows
- Provides better context management for complex projects
- Supports the full AI-DLC lifecycle without interruptions

**To activate Vibe mode**: Look for the mode selector in Kiro's interface and ensure "Vibe" is selected before starting your AI-DLC request.

---

## Writing Effective Prompts

### Prompt Structure

```
using AI-DLC: [Goal]. [Frontend]. [Backend]. [Core features]. [Out of scope]. [Technical constraints].
```

### What to Include

- High-level goal and purpose
- Frontend requirements (framework, key UI features)
- Backend requirements (language, services, architecture)
- Core features with specific details
- What's explicitly out of scope
- Technical constraints or preferences

### Example - CIC Project (USDA Chatbot)

Kindly review the project and spec files from Github and the CIC Google Drive for better context.

```
using AI-DLC: Build an AI-powered chatbot system for USDA public inquiries that scrapes 
and indexes content from usda.gov and farmers.gov, then provides accurate, sourced responses 
using Amazon Nova Pro model. 

The application needs a NextJS frontend with a chat interface (text box for queries, streaming 
responses, source citations, confidence levels, and feedback mechanism), a floating chat widget 
for USDA website integration, and an admin dashboard for reviewing flagged responses. 

Implement backend using Python Lambda functions (not too granular - group related functionality), 
AWS CDK in TypeScript, and a RAG architecture with Amazon Bedrock Knowledge Base.

Core features: web scraping pipeline with delta-based content refresh (daily checks, update only 
modified content), confidence scoring with email capture for low-confidence responses, user 
feedback mechanism with admin notifications, and proper source attribution. Target 90% accuracy 
on USDA-provided sample Q&A test set.

Out of scope for POC: audio/video parsing, live agent handoff, 508 compliance certification, 
production deployment, multilingual support.
```

### Example - Simple Feature

```
using AI-DLC: Add Cognito authentication to my NextJS app. Users should sign up, sign in, 
and access protected routes. Use email/password authentication with MFA optional.
```

### Example - Quick Fix

```
using AI-DLC: Fix the CORS error in my API Gateway configuration.
```

---

## How AI-DLC Works

1. **Answer Questions**: AI-DLC creates markdown files with multiple-choice questions. Fill in your answer after the `[Answer]:` tag.
2. **Review Plans**: Check generated requirements, designs, and execution plans in the `aidlc-docs/` folder.
3. **Approve Stages**: AI-DLC waits for your explicit approval before moving to the next stage.
4. **Get Documentation**: All decisions, designs, and code plans are documented automatically.

The workflow adapts to your request - simple fixes skip straight to code, complex projects get full planning.

---

## Team Collaboration

For detailed guidance on how teams can work together using AI-DLC, including workflows for UI/UX designers, backend developers, frontend developers, and best practices for handoffs and coordination, see the [Team Collaboration Guide](./ai_dlc_team_collaboration.md).

---

## Prerequisites

Before starting development or deployment, you MUST run the AI-DLC update script once to ensure you have the latest workflow rules:

```bash
./update-aidlc.sh
```

This script:
- Downloads the latest AI-DLC workflow rules from the official repository
- Updates core steering files and rule details
- Preserves any custom extensions you've added
- Should be run periodically to get the latest best practices and standards

**What the script does:**
- Fetches the latest release from `awslabs/aidlc-workflows`
- Updates `.kiro/steering/aws-aidlc-rules/` (core workflow rules)
- Updates `.kiro/aws-aidlc-rule-details/` (detailed implementation guides)
- Preserves custom extensions in `aws-aidlc-rule-details/extensions/`

---

## Adding Custom Rules to CIC Extensions (Optional)

This project includes CIC-specific extension files for adding custom development rules. Add rules only if you want to enforce CIC specific standards.

### Extension Files

- **Rules file**: `.kiro/aws-aidlc-rule-details/extensions/cic-extensions/cic-specifics.md`
- **Opt-in file**: `.kiro/aws-aidlc-rule-details/extensions/cic-extensions/cic-specifics.opt-in.md`

### Example: Adding Rules to cic-specifics.md

Edit `.kiro/aws-aidlc-rule-details/extensions/cic-extensions/cic-specifics.md`:

```markdown
# CIC-Specific Development Rules

## Overview
These rules enforce CIC-specific development standards. They are blocking constraints that apply across all AI-DLC phases.

---

## Rule CIC-01: Resource Naming

**Rule**: All AWS resources must follow pattern: `{env}-{app}-{resource}-{id}`

**Verification**:
- All resource names follow the pattern
- Environment is one of: dev, staging, prod

---

## Rule CIC-02: Required Tags

**Rule**: All resources must include tags: CostCenter, Owner, Environment

**Verification**:
- All resources have CostCenter tag
- All resources have Owner tag
- All resources have Environment tag
```

**Rule format:**
- Each rule: `## Rule CIC-NN: Title` (use CIC prefix, number sequentially)
- Include **Rule** section describing the requirement
- Include **Verification** section with concrete checks

### Adding Opt-in to cic-specifics.opt-in.md

Edit `.kiro/aws-aidlc-rule-details/extensions/cic-extensions/cic-specifics.opt-in.md`:

```markdown
# CIC-Specific Rules — Opt-In

**Extension**: CIC-Specific Development Standards

## Opt-In Prompt

\`\`\`markdown
## Question: CIC Development Standards
Should CIC-specific development standards be enforced?

A) Yes — enforce CIC rules
B) No — skip CIC rules

[Answer]: 
\`\`\`
```

**Opt-in format:**
- Wrap question in markdown code block (triple backticks)
- Provide A/B options
- Include `[Answer]:` tag

### Reference Examples

See built-in security extension for complete examples:
- `.kiro/aws-aidlc-rule-details/extensions/security/baseline/security-baseline.md`
- `.kiro/aws-aidlc-rule-details/extensions/security/baseline/security-baseline.opt-in.md`

---

## Generated Files

AI-DLC automatically generates documentation in `aidlc-docs/` as it progresses through the workflow. Below are the files created so far:

## Generated Files

| Name of File | Purpose |
|--------------|---------|
| `aidlc-state.md` | Tracks workflow progress and completed stages |
| `audit.md` | Complete audit log of all user inputs and AI responses |
| **Reverse Engineering Stage** | |
| `inception/reverse-engineering/business-overview.md` | Business context, transactions, and component descriptions |
| `inception/reverse-engineering/architecture.md` | System architecture, component interactions, and data flows |
| `inception/reverse-engineering/code-structure.md` | Project structure, design patterns, and file organization |
| `inception/reverse-engineering/api-documentation.md` | API endpoints, data models, and specifications |
| `inception/reverse-engineering/component-inventory.md` | Complete catalog of all packages and components |
| `inception/reverse-engineering/technology-stack.md` | Technology choices, versions, and tools used |
| `inception/reverse-engineering/dependencies.md` | Dependency analysis and version constraints |
| `inception/reverse-engineering/code-quality-assessment.md` | Quality metrics, test coverage, and technical debt |
| `inception/reverse-engineering/reverse-engineering-timestamp.md` | Analysis metadata and recommendations |
| **Requirements Analysis Stage** | |
| `inception/requirements/requirements.md` | Comprehensive requirements document with functional, non-functional, security, testing, deployment, and integration requirements |
| `inception/requirements/requirement-verification-questions.md` | Initial [x] number of requirement clarification questions with user answers |
| `inception/requirements/requirement-verification-questions-followup.md` | Follow-up questions based on user responses |
| **User Stories Stage** | |
| `inception/plans/user-stories-assessment.md` | Assessment of whether user stories add value for this project |
| `inception/plans/story-generation-plan.md` | Detailed plan for generating user stories with clarifying questions |
| `inception/user-stories/personas.md` | User personas representing different system users |
| `inception/user-stories/stories.md` | User stories with acceptance criteria organized by persona |
| **Workflow Planning Stage** | |
| `inception/plans/execution-plan.md` | Complete workflow execution plan showing which stages will be executed and at what depth |
| **Application Design Stage** | |
| `inception/plans/application-design-plan.md` | Plan for designing application components, methods, and business rules |
| `inception/application-design/application-design.md` | Complete application design document with overview and design decisions |
| `inception/application-design/components.md` | Detailed component definitions with responsibilities and interfaces |
| `inception/application-design/component-methods.md` | Method signatures and business logic for each component |
| `inception/application-design/services.md` | Service layer design with business rules and workflows |
| `inception/application-design/component-dependency.md` | Component dependency graph and interaction patterns |
| `inception/application-design/unit-of-work.md` | Units of work breakdown for implementation |
| `inception/application-design/unit-of-work-dependency.md` | Dependencies between units of work |
| `inception/application-design/unit-of-work-story-map.md` | Mapping of user stories to units of work |
| **Units Generation Stage** | |
| `inception/plans/unit-of-work-plan.md` | Plan for generating and organizing units of work |

## CONSTRUCTION PHASE

### Construction Planning

| Name of File | Purpose |
|--------------|---------|
| `construction/construction-plans-summary.md` | Summary of all construction plans and best practices |
| `construction/plans/construction-master-plan.md` | Master plan for construction phase execution |
| `construction/plans/foundation-infrastructure-functional-design-plan.md` | Functional design plan for foundation infrastructure unit |
| `construction/plans/foundation-infrastructure-code-generation-plan.md` | Code generation plan for foundation infrastructure unit |

### Build and Test Stage

| Name of File | Purpose |
|--------------|---------|
| `construction/build-and-test/build-and-test-summary.md` | Summary of all build and test instructions |
| `construction/build-and-test/build-instructions.md` | Complete build instructions for all units |
| `construction/build-and-test/unit-test-instructions.md` | Unit testing instructions and test cases |
| `construction/build-and-test/integration-test-instructions.md` | Integration testing instructions for component interactions |
| `construction/build-and-test/performance-test-instructions.md` | Performance testing instructions and benchmarks |

## OPERATIONS PHASE

**Status**: Operations is used to help with deployment of the application

It includes:
- Deployment planning and execution
- Monitoring and observability setup
- Incident response procedures
- Maintenance and support workflows
- Production readiness checklists

All build, test, and deployment activities are currently handled in the Construction phase.

## Three-Phase Workflow

AI-DLC follows a three-phase workflow:

1. **INCEPTION PHASE** (Planning & Design)
   - Workspace Detection
   - Reverse Engineering (brownfield only)
   - Requirements Analysis
   - User Stories (conditional)
   - Workflow Planning
   - Application Design (conditional)
   - Units Generation (conditional)

2. **CONSTRUCTION PHASE** (Implementation)
   - Functional Design (per unit)
   - NFR Requirements (per unit)
   - NFR Design (per unit)
   - Infrastructure Design (per unit)
   - Code Generation (per unit)
   - Build and Test

3. **OPERATIONS PHASE** (Deployment Assistance)
   - Operations is used to help with deployment of the application
