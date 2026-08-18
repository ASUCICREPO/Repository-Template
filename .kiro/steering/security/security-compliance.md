---
inclusion: manual
---

# Security: Compliance & Documentation

## 8. Documentation and Threat Modeling

| Practice | Detail |
|---|---|
| **Create a SECURITY.md** | Threat model summary, known risks, security contacts, vulnerability reporting. |
| **Lightweight threat model** | Asset → Threat → Mitigation → Status table. Cover top 5-10 risks. |
| **Document security controls per service** | One sentence per AWS service on how it is secured. |
| **Architecture diagram with security boundaries** | Show VPC boundaries, IAM roles, encryption markers. |
| **Shared responsibility callout** | Note customer responsibility for IAM, encryption, network controls. |

## 9. Legal and Licensing Hygiene

| Practice | Detail |
|---|---|
| **License header in every source file** | Use SPDX identifiers consistently. |
| **Single license declaration** | `LICENSE`, `package.json`, `requirements.txt` all declare same license. |
| **No internal contact info** | No internal emails or URLs in public repos. |
| **Third-party license tracking** | Maintain `THIRD-PARTY-LICENSES` file. |

## 10. Deployment Consistency

| Practice | Detail |
|---|---|
| **Single source of truth** | One deployment method (CDK). No manual AWS CLI resource creation. |
| **Validate before deploy** | Run `cdk diff` and review before every deployment. |
| **Tag everything** | Project, Environment, Owner, CostCenter tags on all resources. |
| **Meaningful resource names** | Descriptive names that convey purpose. |
