# Team Collaboration with AI-DLC

AI-DLC supports collaborative development across different roles. This guide explains how teams can work together effectively using Kiro AI-DLC.

---

## Table of Contents

- [Team Roles and Workflows](#team-roles-and-workflows)
- [UI/UX Designer Workflow](#uiux-designer-workflow)
- [Developer Workflow](#developer-workflow-joining-existing-project)
- [Backend Developer Workflow](#backend-developer-workflow)
- [Frontend Developer Workflow](#frontend-developer-workflow)
- [Collaboration Best Practices](#collaboration-best-practices)
- [Example Team Workflow](#example-team-workflow)
- [Handling Handoffs](#handling-handoffs)
- [Tips for Effective Team Collaboration](#tips-for-effective-team-collaboration)

---

## Team Roles and Workflows

### Example 3-Person Team Structure

**Team Composition:**
- **UI/UX Designer** - Creates designs and converts them to code
- **Backend Developer** - Implements backend services and infrastructure
- **Frontend Developer** - Builds frontend components and integrations

---

## UI/UX Designer Workflow

**Tools Available:**
- Figma MCP Power (configured in this project)
- AI-DLC for component generation

**Workflow Steps:**

1. **Design in Figma**
   - Create your designs in Figma as usual
   - Organize components and screens clearly

2. **Convert Figma to Code**
   ```
   Convert this Figma design to React/Next.js components: [Figma URL]
   ```
   - Use the Figma MCP power to convert designs directly to code
   - AI will generate component code matching your design

3. **Integrate with AI-DLC** (Optional)
   ```
   using AI-DLC: Implement the user authentication flow based on the Figma designs at [URL]. 
   Create reusable components for login, signup, and password reset screens.
   ```
   - For complex features, use AI-DLC to generate complete implementations
   - AI-DLC will create documentation in `aidlc-docs/` for the team

4. **Commit Your Work**
   - Push generated components to a feature branch
   - Document any design decisions in commit messages
   - Update `aidlc-docs/audit.md` if using AI-DLC workflow

---

## Developer Workflow (Joining Existing Project)

**When joining a project or picking up work:**

### Step 1: Review Project State

1. **Check AI-DLC State**
   - Open `aidlc-docs/aidlc-state.md` in your editor
   - Look at the "Current Stage" section to see workflow progress
   
   This file shows:
   - Current workflow phase (Inception/Construction/Operations)
   - Completed stages
   - Skipped stages
   - Next planned stages

2. **Review Audit Log**
   - Open `aidlc-docs/audit.md` in your editor
   - Scroll to the bottom to see recent interactions
   
   This file contains:
   - All user inputs and AI responses
   - Timestamps for each interaction
   - Context for decisions made
   - Approval history

3. **Read Generated Documentation**
   - **Requirements**: `aidlc-docs/inception/requirements/requirements.md`
   - **Architecture**: `aidlc-docs/inception/reverse-engineering/architecture.md`
   - **User Stories**: `aidlc-docs/inception/user-stories/stories.md`
   - **Design Decisions**: `aidlc-docs/inception/application-design/`
   - **Build Instructions**: `aidlc-docs/construction/build-and-test/`

### Step 2: Continue Development

**Option A: Continue AI-DLC Workflow**

If the previous developer was using AI-DLC:

```
using AI-DLC: Continue development of this application. 
I've reviewed the aidlc-state.md and audit.md files. 
I need to implement [specific feature/unit].
```

AI-DLC will:
- Load existing context from `aidlc-docs/`
- Resume from the last completed stage
- Continue generating documentation

**Option B: Add New Feature with AI-DLC**

```
using AI-DLC: Add [new feature] to the existing application. 
The current architecture is documented in aidlc-docs/inception/reverse-engineering/.
```

**Option C: Manual Development**

- Use the documentation in `aidlc-docs/` as reference
- Follow the design patterns and architecture documented
- Update `audit.md` manually if making significant decisions

### Step 3: Common Development Scenarios

**Scenario 1: Bug Fixes**

When fixing a bug in existing code:

```
using AI-DLC: Fix the bug in [component/file] where [description of bug]. 
The architecture is documented in aidlc-docs/inception/reverse-engineering/architecture.md.
Ensure the fix follows the existing patterns.
```

Or without AI-DLC:
- Review the component design in `aidlc-docs/inception/application-design/components.md`
- Check related tests in `aidlc-docs/construction/build-and-test/unit-test-instructions.md`
- Fix the bug following established patterns
- Document the fix in `audit.md` with timestamp and description

**Scenario 2: Code Review**

When reviewing AI-generated or teammate's code:

```
Review the code in [file/component] against the design documented in 
aidlc-docs/inception/application-design/. Check for:
1. Adherence to architecture patterns
2. Compliance with NFR requirements in aidlc-docs/construction/[unit]/nfr-requirements/
3. Test coverage per aidlc-docs/construction/build-and-test/unit-test-instructions.md
```

**Scenario 3: Refactoring**

When improving existing code without changing functionality:

```
using AI-DLC: Refactor [component/module] to improve [performance/maintainability/readability]. 
Current implementation is in [file]. Architecture constraints are in 
aidlc-docs/inception/reverse-engineering/architecture.md. Maintain existing API contracts.
```

**Scenario 4: Writing Tests**

When adding tests for existing code:

```
using AI-DLC: Write comprehensive tests for [component/feature]. 
Reference the test strategy in aidlc-docs/construction/build-and-test/unit-test-instructions.md.
Cover edge cases and error scenarios.
```

Or check:
- Test patterns in `aidlc-docs/construction/build-and-test/`
- Component specifications in `aidlc-docs/inception/application-design/component-methods.md`
- Expected behaviors from user stories in `aidlc-docs/inception/user-stories/stories.md`

**Scenario 5: Debugging**

When troubleshooting issues:

```
Help me debug [issue description] in [component/file]. 
The expected behavior is documented in aidlc-docs/inception/user-stories/stories.md.
The architecture is in aidlc-docs/inception/reverse-engineering/architecture.md.
```

Steps:
1. Check component design in `aidlc-docs/inception/application-design/`
2. Review API contracts in `aidlc-docs/inception/reverse-engineering/api-documentation.md`
3. Check NFR requirements in `aidlc-docs/construction/[unit]/nfr-requirements/`
4. Use AI to analyze logs and trace issues

**Scenario 6: Deployment Issues**

When fixing deployment or infrastructure problems:

```
using AI-DLC: Fix the deployment issue with [service/resource]. 
The infrastructure design is in aidlc-docs/construction/[unit]/infrastructure-design/.
Error: [error message]
```

Check:
- Infrastructure design in `aidlc-docs/construction/[unit]/infrastructure-design/`
- Build instructions in `aidlc-docs/construction/build-and-test/build-instructions.md`
- Deployment requirements in `aidlc-docs/inception/requirements/requirements.md`

**Scenario 7: Performance Optimization**

When improving performance:

```
using AI-DLC: Optimize performance of [feature/component]. 
Current implementation is in [file]. Performance requirements are in 
aidlc-docs/construction/[unit]/nfr-requirements/. Target: [specific metric].
```

Review:
- Performance requirements in `aidlc-docs/construction/[unit]/nfr-requirements/`
- Performance test instructions in `aidlc-docs/construction/build-and-test/performance-test-instructions.md`
- Architecture constraints in `aidlc-docs/inception/reverse-engineering/architecture.md`

### Step 4: Coordinate with Team

1. **Check Current Work**
   - Open `aidlc-docs/aidlc-state.md`
   - Look at the "Current Stage" section to see what stage the project is in

2. **Review Recent Changes**
   - Open `aidlc-docs/audit.md`
   - Scroll to the bottom to see recent audit entries

3. **Communicate Progress**
   - Update `aidlc-state.md` if completing a stage
   - Add entries to `audit.md` for major decisions
   - Use git commits to track code changes

---

## Backend Developer Workflow

**Typical Tasks:**

1. **Infrastructure Development**
   ```
   using AI-DLC: Implement the AWS infrastructure for [feature]. 
   Use CDK in TypeScript. Include Lambda functions, API Gateway, and DynamoDB.
   Reference the architecture in aidlc-docs/inception/reverse-engineering/architecture.md.
   ```

2. **API Development**
   ```
   using AI-DLC: Create REST API endpoints for [feature] based on the API 
   documentation in aidlc-docs/inception/reverse-engineering/api-documentation.md.
   ```

3. **Review Generated Plans**
   - Check `aidlc-docs/construction/plans/` for implementation plans
   - Review infrastructure design in `aidlc-docs/construction/[unit-name]/infrastructure-design/`
   - Follow NFR requirements in `aidlc-docs/construction/[unit-name]/nfr-requirements/`

---

## Frontend Developer Workflow

**Typical Tasks:**

1. **Component Implementation**
   ```
   using AI-DLC: Implement the [component name] based on the UI/UX designs. 
   Integrate with the backend API documented in aidlc-docs/inception/reverse-engineering/api-documentation.md.
   ```

2. **Integration with Backend**
   - Review API documentation in `aidlc-docs/inception/reverse-engineering/api-documentation.md`
   - Check component dependencies in `aidlc-docs/inception/application-design/component-dependency.md`
   - Follow integration patterns from previous implementations

3. **Use Figma Designs**
   ```
   Implement this Figma design as a Next.js component: [Figma URL]
   Follow the component structure in aidlc-docs/inception/application-design/components.md.
   ```

---

## Collaboration Best Practices

##### 1. Always Check State Before Starting

- Open `aidlc-docs/aidlc-state.md`
- Look at the "Current Stage" section for quick status check

##### 2. Review Audit Log for Context

- Open `aidlc-docs/audit.md`
- Scroll to the bottom to see recent decisions (last 100 lines or so)

##### 3. Document Your Decisions

When making significant changes:
- Add entry to `audit.md` with timestamp
- Update `aidlc-state.md` if completing a stage
- Reference related documentation files

##### 4. Use Consistent Prompts

When continuing work:
```
using AI-DLC: [Action] based on [reference to aidlc-docs file]. 
I've reviewed [specific files] and understand [context].
```

##### 5. Coordinate Through Documentation

- **Before starting**: Check `aidlc-state.md` and `audit.md`
- **During work**: Update plans in `aidlc-docs/construction/plans/`
- **After completion**: Mark stages complete in `aidlc-state.md`

---

## Example Team Workflow

**Day 1 - UI/UX Designer:**
```
1. Create Figma designs for user dashboard
2. Convert Figma to Next.js components using Figma MCP
3. Commit components to feature/dashboard-ui branch
4. Document in audit.md: "Created dashboard UI components from Figma designs"
```

**Day 2 - Backend Developer:**
```
1. Review aidlc-state.md - sees project is in Construction phase
2. Read audit.md - understands dashboard UI is ready
3. Run: using AI-DLC: Implement backend API for dashboard data based on 
   the UI components in frontend/app/admin/dashboard/. Create Lambda functions 
   and API Gateway endpoints.
4. AI-DLC generates infrastructure code and documentation
5. Update aidlc-state.md marking backend unit complete
```

**Day 3 - Frontend Developer:**
```
1. Review aidlc-state.md - sees backend API is complete
2. Check aidlc-docs/inception/reverse-engineering/api-documentation.md for API specs
3. Run: using AI-DLC: Integrate the dashboard UI components with the backend API 
   documented in aidlc-docs. Add error handling and loading states.
4. Test integration
5. Document integration decisions in audit.md
```

---

## Handling Handoffs

### When handing off work to another team member:

1. **Complete Current Stage**
   - Finish the current AI-DLC stage if possible
   - Update `aidlc-state.md` with completion status

2. **Document Context**
   - Add detailed entry to `audit.md` explaining:
     - What was completed
     - What's pending
     - Any blockers or decisions needed
     - Files modified

3. **Commit Everything**
   ```bash
   git add aidlc-docs/
   git commit -m "Complete [stage]: [description]"
   git push
   ```

4. **Notify Team**
   - Share which files to review
   - Highlight any important decisions in `audit.md`
   - Point to specific sections in `aidlc-state.md`

### When receiving a handoff:

1. **Pull Latest Changes**
   ```bash
   git pull origin main
   ```

2. **Review Documentation**
   - Open `aidlc-docs/aidlc-state.md` to check current state
   - Open `aidlc-docs/audit.md` and scroll to the bottom to see recent context

3. **Ask AI-DLC for Summary**
   ```
   Review the aidlc-state.md and audit.md files and summarize:
   1. Current project state
   2. What was completed
   3. What needs to be done next
   4. Any important decisions or blockers
   ```

4. **Continue Work**
   ```
   using AI-DLC: Continue from [stage] to implement [next task]. 
   I've reviewed the context in audit.md.
   ```

---

## Tips for Effective Team Collaboration

1. **Use Descriptive Prompts**: Always reference existing documentation
2. **Keep audit.md Updated**: Document decisions as you make them
3. **Review Before Starting**: Always check state and audit files first
4. **Commit Frequently**: Push aidlc-docs/ changes with your code
5. **Communicate Through Docs**: Use audit.md as a team communication log
6. **Follow Established Patterns**: Review existing code and documentation before adding new patterns