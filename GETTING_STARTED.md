# ASU CIC Repository Template

This is the official repository template for ASU Cloud Innovation Center (CIC) projects. It provides a complete, production-ready foundation for building AWS-powered applications with AI/ML capabilities, including pre-configured Kiro AI agents, security standards, and deployment automation.

**Use this template to**: Rapidly scaffold new CIC projects with best practices built-in, automated spec generation, and specialized AI agents for backend, frontend, security, and deployment tasks.

---

## Quick Start: Using This Template

Follow these steps to create a new project from this template:

### 1. Clone the repository template

```bash
git clone https://github.com/ASUCICREPO/Repository-Template.git
```

Alternate: Open Kiro and click on "Clone Repository" and paste this link: https://github.com/ASUCICREPO/Repository-Template.git

### 2. Set up MCP configuration

Review the [.kiro/README.md](./.kiro/README.md) for detailed MCP setup instructions.

### 3. Start your project with AI-DLC

**In Vibe mode**, describe your project or paste your scope document into Kiro chat. Start with:

```
using AI-DLC: [your project description]
```

AI-DLC will guide you through an adaptive workflow — gathering requirements, asking clarifying questions, creating designs, and planning implementation. You review and approve at each stage.

### 4. Review and approve each stage

AI-DLC works in phases:
- **Inception**: Requirements analysis, user stories, application design, workflow planning
- **Construction**: Functional design, code generation, build and test
- **Operations**: Deployment (handled by cic-deployment agent)

At each stage, AI-DLC waits for your explicit approval before proceeding. Review the generated documentation in `aidlc-docs/` as it's created.

### 5. Implementation

During the Construction phase, AI-DLC delegates code generation to specialized CIC subagents (cic-backend, cic-frontend) that follow CIC standards automatically.

### 6. Deploy the application

After the agent completes all tasks, prompt Kiro to start deployment:
```
Start the deployment process
```

### 7. Post-deployment verification

After successful deployment:
- Test the application thoroughly
- Use the `cic-documentation` agent to complete all your docs/
- Run security scans using the `cic-security` agent

---
---

## Customizing Your Project

After creating your project from this template, you can use Kiro agents to customize it:

### Update Project Information

Prompt Kiro in Vibe mode:
```
Update the relevant sections in the project README.md and package.json files with my project details
```

### Modify Backend or Frontend

Use the specialized agents to make changes:
```
Use cic-backend to add a new Lambda function for [functionality]
```
```
Use cic-frontend to create a new component for [feature]
```

### Update Documentation

After your project is built, use the documentation agent:
```
Use cic-documentation to update the architecture documentation based on the implemented code
```

### Fix Deployment

If you face issues with deployment, use the deployment agent:
```
Use cic-deployment to fix [deployment_issue] with error code [Paste Error Code from console logs or AWS console]
```

The agents will handle the updates automatically, no manual editing required.