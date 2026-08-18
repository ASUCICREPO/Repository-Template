---
inclusion: manual
---

# Security: Code & Dependencies

## 4. Code Security and Dependency Management

| Practice | Detail |
|---|---|
| **Pin dependencies** | Exact versions in `requirements.txt`, `package.json`. |
| **Scan dependencies** | `pip-audit` (Python) and `npm audit` (TypeScript) in CI. |
| **Update regularly** | Dependabot or manual review (at least monthly). |
| **Run SAST** | Bandit (Python) and ESLint-security (TypeScript) on every commit. |
| **Fix or document** | Every HIGH/CRITICAL finding must be fixed or have documented risk acceptance. |
| **Secure temp files** | `tempfile.NamedTemporaryFile(delete=True)`. Never construct temp paths with user input. |
| **No `eval()` or `exec()`** | Never use dynamic code execution on untrusted input. |

## 5. AI and GenAI Security

| Practice | Detail |
|---|---|
| **Validate AI inputs** | Sanitize all content before sending to a model. Limit input size. |
| **Filter AI outputs** | Never insert model output directly into HTML, SQL, or code. |
| **Protect against prompt injection** | Separate system prompts from user content. |
| **Log all invocations** | Model ID, input hash, output hash, latency, token count. |
| **Scope Bedrock permissions** | `bedrock:InvokeModel` only for specific model ARNs. |
