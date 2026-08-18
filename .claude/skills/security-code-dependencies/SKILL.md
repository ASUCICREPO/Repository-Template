---
name: security-code-dependencies
description: Apply CIC code security and dependency management standards. Triggered by: adding dependencies, pip-audit, npm audit, SAST scan, Bandit, eval/exec in code, AI input validation, Bedrock security, prompt injection, dependency pinning.
---

Read `references/spec.md` for scanning commands and AI security patterns.

**Dependency management**:
- Pin exact versions: `requirements.txt` (Python) and `package.json` npm prod deps
- Run `pip-audit` (Python) and `npm audit` (Node) in CI and before every PR
- Review and update dependencies at least monthly (Dependabot or manual)
- Every HIGH/CRITICAL finding must be fixed or have documented risk acceptance

**Code security**:
- No `eval()` or `exec()` anywhere on untrusted input
- Use `tempfile.NamedTemporaryFile(delete=True)` for temp files — never construct temp paths from user input
- Run Bandit (Python) and ESLint-security (TypeScript) as SAST on every commit
- Fix or document all HIGH/CRITICAL SAST findings

**AI/GenAI security (required for all Bedrock integrations)**:
- Sanitize and size-limit all inputs before sending to a model
- Never insert model output directly into HTML, SQL, shell commands, or code
- Keep system prompts strictly separated from user content (prompt injection prevention)
- Log all Bedrock invocations: model ID, input hash, output hash, latency, token count
- Scope Bedrock IAM to specific model ARNs only — never wildcard

See `references/spec.md` for scanning commands and structured logging patterns for AI.
