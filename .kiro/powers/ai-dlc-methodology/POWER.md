---
name: "ai-dlc-methodology"
displayName: "AI-DLC Development Methodology"
description: "Comprehensive adaptive software development lifecycle that intelligently tailors workflow stages to project complexity and requirements. Guides teams through inception, construction, and operations phases with built-in quality gates and documentation."
keywords: ["ai-dlc", "development", "methodology", "lifecycle", "workflow", "adaptive", "software", "architecture"]
author: "AI-DLC Team"
---

# AI-DLC Development Methodology

## Overview

AI-DLC (AI-Driven Development Life Cycle) is a comprehensive, adaptive software development methodology that intelligently tailors workflow stages to your project's specific needs. Unlike rigid methodologies, AI-DLC analyzes your requirements, existing codebase, and complexity to determine which stages add value and which can be safely skipped.

This power provides the complete AI-DLC methodology with detailed guidance for each phase and stage. Whether you're starting a greenfield project or enhancing an existing system, AI-DLC adapts to provide the right level of process rigor for your situation.

**Key Benefits:**
- **Adaptive Execution**: Only runs stages that add value to your specific project
- **Quality Gates**: Built-in checkpoints ensure quality and stakeholder alignment
- **Complete Documentation**: Maintains full audit trail of decisions and rationale
- **Risk-Based Approach**: Complex/high-risk projects get comprehensive treatment, simple changes stay efficient
- **Team Collaboration**: Structured approval points for team review and input

## Available Workflow Files

This methodology is organized into workflow files that mirror the AI-DLC phase structure. These files are dynamically loaded using the `readFile` tool when needed:

### Core Methodology
- **core-workflow** - Complete workflow overview and execution rules (always loaded via steering)

### Common Guidelines - Always Load These
- **common/process-overview** - High-level methodology overview with workflow diagram
- **common/terminology** - Glossary of AI-DLC terms and concepts
- **common/content-validation** - Rules for validating generated content and diagrams
- **common/question-format-guide** - Guidelines for asking structured questions
- **common/session-continuity** - Rules for resuming interrupted workflows
- **common/welcome-message** - User-facing introduction to AI-DLC
- **common/depth-levels** - Explanation of adaptive depth (minimal/standard/comprehensive)
- **common/error-handling** - Error recovery and troubleshooting procedures
- **common/overconfidence-prevention** - Guidelines to prevent overconfident AI behavior
- **common/workflow-changes** - Rules for handling workflow modifications

### Inception Phase - Planning & Architecture
- **inception/workspace-detection** - Analyze workspace and determine project type
- **inception/reverse-engineering** - Analyze existing codebase (brownfield projects)
- **inception/requirements-analysis** - Gather and validate requirements (adaptive depth)
- **inception/user-stories** - Create user stories and personas (conditional)
- **inception/workflow-planning** - Create execution plan and workflow visualization
- **inception/application-design** - Design components, services, and architecture
- **inception/units-generation** - Decompose system into units of work

### Construction Phase - Design & Implementation
- **construction/functional-design** - Technology-agnostic business logic design
- **construction/nfr-requirements** - Non-functional requirements and tech stack selection
- **construction/nfr-design** - NFR patterns and logical components
- **construction/infrastructure-design** - Map to actual infrastructure services
- **construction/code-generation** - Generate code with planning and execution phases
- **construction/build-and-test** - Build instructions and comprehensive testing

### Operations Phase - Future
- **operations/operations** - Placeholder for deployment and monitoring workflows

## Getting Started

**For AI agents implementing AI-DLC:**

1. **Start with core workflow**: The `core-workflow` steering file is always loaded - it contains the complete execution rules and stage sequencing
2. **Load workflow files using readFile**: When the core-workflow references files like `common/content-validation.md`, use the `readFile` tool with path `powers/ai-dlc-methodology/workflows/common/content-validation.md`
3. **Follow adaptive principles**: Use the methodology's intelligence to determine which stages are needed
4. **Maintain audit trail**: Log all user interactions and decisions per the audit requirements

## Workflow File Loading Instructions

**For AI Agents**: When the core-workflow references workflow files, use the `readFile` tool with the pattern:
`powers/ai-dlc-methodology/workflows/{phase}/{filename}.md`

### Quick Reference

**Common files**: `powers/ai-dlc-methodology/workflows/common/{filename}.md`
**Inception files**: `powers/ai-dlc-methodology/workflows/inception/{filename}.md`  
**Construction files**: `powers/ai-dlc-methodology/workflows/construction/{filename}.md`
**Operations files**: `powers/ai-dlc-methodology/workflows/operations/{filename}.md`

### Usage Pattern

When core-workflow says "Load all steps from `inception/workspace-detection.md`":
1. Use `readFile` with `path: "powers/ai-dlc-methodology/workflows/inception/workspace-detection.md"`
2. Follow the detailed steps in that workflow file
3. Return to core-workflow for next stage

**Note**: Legacy references to `.kiro/aws-aidlc-rule-details/` should be mapped to the `workflows` folder.

**For development teams using AI-DLC:**

1. **Understand the phases**: Review the process overview to understand the three-phase lifecycle
2. **Expect adaptation**: The methodology will analyze your project and propose an appropriate workflow
3. **Participate actively**: Answer questions, review plans, and approve stages as the workflow progresses
4. **Trust the process**: Complex projects get full treatment, simple changes stay efficient

## Methodology Principles

### Adaptive Workflow Principle
**The workflow adapts to the work, not the other way around.**

The AI model intelligently assesses what stages are needed based on:
1. User's stated intent and clarity
2. Existing codebase state (if any)
3. Complexity and scope of change
4. Risk and impact assessment

### Three-Phase Lifecycle

**🔵 INCEPTION PHASE** - Planning & Architecture
- **Purpose**: Determine WHAT to build and WHY
- **Focus**: Requirements gathering, architectural decisions, planning
- **Always Execute**: Workspace Detection, Requirements Analysis, Workflow Planning
- **Conditional**: Reverse Engineering, User Stories, Application Design, Units Generation

**🟢 CONSTRUCTION PHASE** - Design, Implementation & Test
- **Purpose**: Determine HOW to build it
- **Focus**: Detailed design, code generation, testing
- **Always Execute**: Code Generation (per-unit), Build and Test
- **Conditional**: Functional Design, NFR Requirements, NFR Design, Infrastructure Design (all per-unit)

**🟡 OPERATIONS PHASE** - Deployment & Monitoring
- **Purpose**: How to DEPLOY and RUN it
- **Status**: Placeholder for future expansion
- **Current State**: Build and test activities handled in CONSTRUCTION phase

### Quality Assurance

**Mandatory Validation Rules:**
- Content validation before file creation (especially Mermaid diagrams)
- Question format compliance for structured user input
- Complete audit trail of all decisions and user interactions
- Checkbox-based progress tracking at plan and stage levels

**User Control Points:**
- Explicit approval required at each major stage
- Users can request stage inclusion/exclusion
- Transparent planning with execution rationale
- Option to modify workflow based on emerging needs

## Best Practices

### For AI Agents
- **Always load common rules first** - process overview, terminology, content validation
- **Follow the adaptive principle** - don't execute unnecessary stages
- **Maintain complete audit trail** - log every user interaction with timestamps
- **Use structured questions** - follow question format guidelines
- **Validate content before creation** - especially Mermaid diagrams and complex content
- **Present clear completion messages** - use standardized formats from stage rules

### For Development Teams
- **Engage actively in planning** - the methodology works best with team participation
- **Answer questions thoroughly** - incomplete requirements lead to poor implementations
- **Review and approve stages** - use the quality gates to ensure alignment
- **Trust the adaptive nature** - let the methodology determine appropriate depth
- **Maintain the audit trail** - it becomes valuable project documentation

### For Project Managers
- **Use AI-DLC for risk management** - complex projects automatically get more rigor
- **Leverage the documentation** - complete audit trail supports project governance
- **Plan for adaptive execution** - timeline estimates should account for conditional stages
- **Monitor quality gates** - use approval points for stakeholder alignment

## Troubleshooting

### Common Issues

**Workflow seems too heavy for simple changes**
- Trust the adaptive assessment - simple changes will skip most conditional stages
- Review the workflow planning stage output to understand why stages were included
- Request stage exclusion if you disagree with the assessment

**Missing context from previous sessions**
- Check for existing `aidlc-state.md` file in workspace
- Review session continuity guidelines in common workflow files
- Restart workflow if state cannot be recovered

**Content validation failures**
- Review content validation rules in common workflow files
- Use text alternatives when Mermaid diagrams fail validation
- Report persistent validation issues for methodology improvement

**Questions are unclear or poorly formatted**
- Reference question format guide in common workflow files
- Request clarification using the structured question format
- Use Option E ("Other") to provide custom responses when needed

### Getting Help

1. **Review workflow files** - most questions are answered in the detailed stage guidance
2. **Check terminology** - ensure you're using AI-DLC terms correctly
3. **Examine audit trail** - review previous decisions and rationale
4. **Consult process overview** - understand the big picture and phase relationships

## Configuration

**No additional configuration required** - this is a pure methodology power with no MCP server dependencies.

**File Structure Created:**
- `aidlc-docs/` - All methodology artifacts and documentation
- `aidlc-state.md` - Workflow state tracking
- `audit.md` - Complete audit trail of decisions and interactions

**Integration with Kiro:**
- Uses Kiro's power system with core workflow via steering and detailed workflows via `readFile`
- Core workflow always loaded via steering, detailed workflows loaded on-demand
- Leverages Kiro's file management tools for artifact creation
- Compatible with Kiro's project workspace structure

---

**Methodology:** AI-DLC (AI-Driven Development Life Cycle)
**Version:** Comprehensive methodology with adaptive workflow principles