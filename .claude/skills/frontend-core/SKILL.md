---
name: frontend-core
description: Apply CIC frontend core standards for Next.js App Router projects. Triggered by: Next.js project setup, App Router, TypeScript config, session management, Amplify deployment, frontend project structure.
---

Read `references/spec.md` before implementing any frontend code.

**Stack**: Next.js with App Router (latest stable, Amplify-supported 12-15). TypeScript strict mode. React SSR/SSG.

**Project structure**:
```
frontend/
├── app/          # App Router pages and layouts
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── contexts/     # React Context providers
├── lib/          # API clients and utilities
└── public/       # Static files
```

**Environment variables**: `NEXT_PUBLIC_*` for client-side access. No prefix for server-side only. Validate required vars at startup — throw if missing.

**Session IDs** (AWS AgentCore compatible): Minimum 33 characters. Format: `session_<timestamp>_<random><random>`. Store in `sessionStorage`.

**Build commands**:
- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Test: `cd frontend && npm test`
- Lint: `cd frontend && npm run lint`

**Amplify**: `WEB_COMPUTE` platform for SSR. CI/CD from GitHub. Set `AMPLIFY_MONOREPO_APP_ROOT` for monorepos. Next.js 12-15 only.

**Security**: Never commit `.env` files. HTTPS only. Sanitize all user inputs.

**Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, color contrast, screen reader compatibility.

See `references/spec.md` for TypeScript tsconfig and full setup patterns.
