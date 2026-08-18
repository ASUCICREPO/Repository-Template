---
name: security-check-workflow
description: Execute the CIC 8-step security check workflow using cdk-nag and ASH. Triggered by: run security check, security review, check the code for security issues, scan before deploy, comprehensive security audit.
---

Read `references/spec.md` for the full workflow details. For tool-specific usage see the `security-scanning` skill in the `cic-security` plugin.

Execute these 8 steps in order:

**1. Determine scope** — Parse the user's message:
- Specific files/dirs mentioned → scan those only
- "backend", "CDK", "infrastructure" → focus on cdk-nag
- "Lambda", "Python", "secrets", "dependencies" → focus on ASH
- "full", "comprehensive", "everything" → run both on entire codebase
- No scope → ask the user for clarification before proceeding

**2. Select tools and commands**:
- cdk-nag: `cd backend && npx cdk synth 2>&1` — look for `[Error]` / `[Warning]` lines with rule IDs
- ASH: `uvx git+https://github.com/awslabs/automated-security-helper.git@v3.1.12 --mode local`

**3. Run selected tools** — Check tools are installed before running.

**4. Parse results**:
- cdk-nag: Extract `[Error|Warning at /Path] AwsSolutions-XXX` lines
- ASH: Read `.ash/ash_output/ash_aggregated_results.json`, group by severity

**5. Prioritize findings**:
1. Critical/High severity
2. Secrets/credentials exposure
3. IAM overpermissions
4. Data encryption issues
5. Dependency vulnerabilities with known exploits
6. Medium severity
7. Low severity

**6. Provide remediation** — For each finding: explain the risk, show the problematic code with file path and line number, provide a concrete fix with code example.

**7. Offer to fix** — Ask if user wants fixes applied. Prioritize by severity. Document suppressions with ADR format.

**8. Summary** — Provide: total findings by severity, breakdown by tool, fixes applied (if any), recommendations for next steps.

See `references/spec.md` for exact commands and output formats.
