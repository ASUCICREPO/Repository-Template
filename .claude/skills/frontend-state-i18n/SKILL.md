---
name: frontend-state-i18n
description: Implement React state management with Context API and internationalization with react-i18next in CIC Next.js frontends. Triggered by: global state, React Context, custom hooks, i18n, multi-language support, RTL, language switcher.
---

Read `references/spec.md` for provider setup and i18n configuration.

**Context API pattern**:
1. Create context with `createContext` and a typed default value
2. Build a provider component that wraps children
3. Expose via a custom hook with error boundary check (throw if used outside provider)

**Context rules**:
- Add `'use client'` directive to all context files
- Wrap callback functions with `useCallback`
- Memoize expensive computations with `useMemo`
- Encapsulate stateful logic (streaming chat, API calls, form state) in custom hooks under `hooks/`

**i18n with react-i18next**:
- Translation files: `public/locales/{lang}/common.json`
- Use `useTranslation` hook in every component with user-visible strings
- Implement browser language detection
- Store user language preference in `localStorage`
- Provide a manual language switcher component
- Support RTL layout switching for RTL languages (Arabic, Hebrew, etc.)

See `references/spec.md` for i18next configuration and custom hook examples.
