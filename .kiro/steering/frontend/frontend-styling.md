---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend Styling Standards

Tailwind CSS configuration, typography, and responsive design patterns for CIC frontend projects.

## Styling

**Tailwind CSS (Required)**: Use latest stable version. Configure `content` paths for `pages/`, `components/`, `app/`.

**Typography**: Use Next.js font optimization with `next/font/google`.

## Component Patterns

**Chat interfaces**: Separate user/assistant messages, markdown rendering with `react-markdown`, avatars, timestamps, citations.

**Forms**: Controlled components, validation before submission, loading states, error display, success feedback.

**Responsive design**: Mobile-first, breakpoints (480px, 600px, 768px, 1024px), drawer/sidebar for mobile, touch-friendly buttons (min 44x44px).

## Performance & Testing

**Optimization**: Dynamic imports for heavy components, Next.js Image component, cache API responses, sessionStorage for temp data.

**Testing**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
