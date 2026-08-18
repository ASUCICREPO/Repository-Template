---
name: security-compliance
description: Apply CIC security compliance standards for documentation, threat modeling, licensing, and deployment consistency. Triggered by: SECURITY.md, threat model, licensing, SPDX header, resource tagging, cdk diff, production readiness, compliance review.
---

Read `references/spec.md` for templates and examples.

**Documentation (required for every project)**:
- Create `SECURITY.md` containing:
  - Threat model table: Asset → Threat → Mitigation → Status (cover top 5-10 risks)
  - Known risks and accepted risk decisions
  - Security contacts and vulnerability reporting process
  - One-sentence security summary per AWS service used
- Architecture diagram must show VPC boundaries, IAM roles, and encryption markers

**Legal & licensing**:
- SPDX license header in every source file
- `LICENSE`, `package.json`, and `requirements.txt` must all declare the same license
- Maintain `THIRD-PARTY-LICENSES` file
- No internal contact info, emails, or internal URLs in public repos

**Deployment consistency**:
- CDK is the single source of truth — no manual AWS Console clicks or CLI resource creation
- Run `cdk diff` and review output before every deployment
- Tag ALL resources: `Project`, `Environment`, `Owner`, `CostCenter`
- Use descriptive, purpose-conveying resource names (not random suffixes)

See `references/spec.md` for the threat model table template and SPDX header format.
