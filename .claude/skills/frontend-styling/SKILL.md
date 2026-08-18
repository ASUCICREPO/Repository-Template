---
name: frontend-styling
description: Apply CIC Tailwind CSS, typography, chat UI, forms, and responsive design standards. Triggered by: Tailwind setup, chat interface, message bubbles, responsive layout, form styling, typography, mobile design, component styling.
---

Read `references/spec.md` for Tailwind config and component patterns.

**CSS**: Tailwind CSS (latest stable). Configure `content` array in `tailwind.config.ts` to include `pages/`, `components/`, and `app/` directories.

**Typography**: Use `next/font/google` for font optimization — never CDN links.

**Chat interface requirements**:
- Visually distinct user vs assistant message bubbles
- Markdown rendering with `react-markdown`
- Avatar icons per sender
- Timestamps on messages
- Citations panel for sourced responses

**Forms**:
- Controlled components (state-driven inputs)
- Client-side validation before submission
- Loading states during API calls
- Inline error display (not alerts)
- Success feedback after completion

**Responsive design** (mobile-first):
- Breakpoints: 480px, 600px, 768px, 1024px
- Drawer or sidebar pattern for mobile navigation
- Touch-friendly interactive elements: minimum 44×44px

**Performance**:
- Dynamic imports (`next/dynamic`) for heavy components
- Next.js `Image` component for all images (never `<img>`)
- Cache API responses
- `sessionStorage` for temporary UI state

**Testing**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.

See `references/spec.md` for complete Tailwind patterns and accessibility requirements.
