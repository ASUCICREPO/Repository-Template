---
description: Run intelligent security checks using cdk-nag and/or ASH. Analyzes scope, runs tools, and provides remediation guidance.
---

The user has triggered a security check. Delegate this task to the `cic-security` subagent with the following prompt:

'Perform a security audit following the workflow in the security-check-workflow skill:
1. Ask the user what scope they want to scan (specific files/dirs, backend only, frontend only, or full codebase)
2. Determine which tools to use based on their response
3. Run the appropriate security scans (cdk-nag, ASH, or code analysis)
4. Parse and prioritize findings by severity (Critical > High > Medium > Low)
5. Provide detailed remediation guidance with code examples
6. Report findings to the main agent for user review'

After the security agent completes the audit, review the findings and ask the user if they want to apply fixes. If yes, delegate fixes to the appropriate agent (cic-backend or cic-frontend).
