---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend State Management & Internationalization

React Context API, custom hooks, and i18n patterns for CIC frontend projects.

## State Management

### Context API

Create context with `createContext`, wrap in provider component, expose via custom hook with error boundary check.

**Rules**: Add `'use client'`, use `useCallback` for functions, use `useMemo` for expensive computations.

### Custom Hooks

Encapsulate stateful logic (streaming chat, API calls, form state) in custom hooks under `hooks/`.

## Internationalization

**Use react-i18next**: `useTranslation` hook, `public/locales/{lang}/common.json` structure.

**Features**: Browser detection, user preference storage, manual switcher, RTL support.
