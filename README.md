# [INSERT_PROJECT_NAME]

[INSERT_PROJECT_DESCRIPTION - 2-3 sentences describing what the project does, who it's for, and the key problem it solves]

---

## Disclaimers

Customers are responsible for making their own independent assessment of the information in this document. This document:

(a) is for informational purposes only,

(b) references AWS product offerings and practices, which are subject to change without notice,

(c) does not create any commitments or assurances from AWS and its affiliates, suppliers or licensors. AWS products or services are provided "as is" without warranties, representations, or conditions of any kind, whether express or implied. The responsibilities and liabilities of AWS to its customers are controlled by AWS agreements, and this document is not part of, nor does it modify, any agreement between AWS and its customers, and

(d) is not to be considered a recommendation or viewpoint of AWS.

Additionally, you are solely responsible for testing, security and optimizing all code and assets on GitHub repo, and all such code and assets should be considered:

(a) as-is and without warranties or representations of any kind,

(b) not suitable for production environments, or on production or other critical data, and

(c) to include shortcuts in order to support rapid prototyping such as, but not limited to, relaxed authentication and authorization and a lack of strict adherence to security best practices.

All work produced is open source. More information can be found in the GitHub repo.

---

## Visual Demo

![User Interface Demo](./docs/media/user-interface.gif)

> **[PLACEHOLDER]** Please provide a GIF or screenshot of the application interface and save it as `docs/media/user-interface.gif`

---

## Table of Contents

| Index                                               | Description                                              |
| :-------------------------------------------------- | :------------------------------------------------------- |
| [High Level Architecture](#high-level-architecture) | High level overview illustrating component interactions  |
| [Deployment Guide](#deployment-guide)               | How to deploy the project                                |
| [User Guide](#user-guide)                           | End-user instructions and walkthrough                    |
| [API Documentation](#api-documentation)             | Documentation on the APIs the project uses               |
| [Directories](#directories)                         | General project directory structure                      |
| [Modification Guide](#modification-guide)           | Guide for developers extending the project               |
| [Credits](#credits)                                 | Contributors and acknowledgments                         |
| [License](#license)                                 | License information                                      |

---

## High Level Architecture

[INSERT_ARCHITECTURE_OVERVIEW - Brief paragraph explaining the architecture, how components interact, and the overall system design]

![Architecture Diagram](./docs/media/architecture.png)

> **[PLACEHOLDER]** Please create and provide an architecture diagram showing:
> - All major components/services
> - Data flow between components
> - User interaction points
> - External services/APIs
> 
> Save the diagram as `docs/media/architecture.png` (or .jpeg/.jpg)

For a detailed explanation of the architecture, see the [Architecture Deep Dive](./docs/architectureDeepDive.md).

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

### Adding Rules to cic-specifics.md

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

## Deployment Guide

For complete deployment instructions, see the [Deployment Guide](./docs/deploymentGuide.md).

**Quick Start:**
1. Run `./update-aidlc.sh` to get the latest AI-DLC rules (first time only)
2. [INSERT_QUICK_START_STEP_2]
3. [INSERT_QUICK_START_STEP_3]

---

## User Guide

For detailed usage instructions with screenshots, see the [User Guide](./docs/userGuide.md).

---

## API Documentation

For complete API reference, see the [API Documentation](./docs/APIDoc.md).

---

## Modification Guide

For developers looking to extend or modify this project, see the [Modification Guide](./docs/modificationGuide.md).

---

## Directories

```
├── backend/
│   ├── bin/
│   │   └── backend.ts
│   ├── lambda/
│   │   └── [INSERT_LAMBDA_FUNCTIONS]
│   ├── lib/
│   │   └── backend-stack.ts
│   ├── agent/
│   │   └── [INSERT_AGENT_FILES]
│   ├── cdk.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── public/
│   └── package.json
├── docs/
│   ├── architectureDeepDive.md
│   ├── deploymentGuide.md
│   ├── userGuide.md
│   ├── APIDoc.md
│   ├── modificationGuide.md
│   └── media/
│       ├── architecture.png
│       └── user-interface.gif
├── LICENSE
└── README.md
```

### Directory Explanations:

1. **backend/** - Contains all backend infrastructure and serverless functions
   - `bin/` - CDK app entry point
   - `lambda/` - AWS Lambda function handlers
   - `lib/` - CDK stack definitions
   - `agent/` - [INSERT_AGENT_DESCRIPTION]

2. **frontend/** - Next.js frontend application
   - `app/` - Next.js App Router pages and layouts
   - `public/` - Static assets

3. **docs/** - Project documentation
   - `media/` - Images, diagrams, and GIFs for documentation

---

## Credits

This application was developed by:

- <a href="[INSERT_LINKEDIN_URL]" target="_blank">[INSERT_CONTRIBUTOR_NAME_1]</a>
- <a href="[INSERT_LINKEDIN_URL]" target="_blank">[INSERT_CONTRIBUTOR_NAME_2]</a>
- <a href="[INSERT_LINKEDIN_URL]" target="_blank">[INSERT_CONTRIBUTOR_NAME_3]</a>

[INSERT_ADDITIONAL_ACKNOWLEDGMENTS - Teams, supporters, or organizations to acknowledge]

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

