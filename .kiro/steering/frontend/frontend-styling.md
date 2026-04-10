---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend Styling Standards

Tailwind CSS configuration, typography, and responsive design patterns for CIC frontend projects.

## Styling

**Tailwind CSS (Required)**
- Use latest stable version

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```javascript
// postcss.config.mjs
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} }
};
```

**Typography** - Use Next.js font optimization:

```typescript
import { Geist_Sans, Poppins } from 'next/font/google';

const geistSans = Geist_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className={geistSans.className}>{children}</body>
    </html>
  );
}
```

## Component Patterns

**Chat interfaces**: Separate user/assistant messages, markdown rendering with `react-markdown`, avatars, timestamps, citations, retry/rating actions

**Forms**: Controlled components, validation before submission, loading states, error display, success feedback

**Responsive design**: Mobile-first, breakpoints (480px, 600px, 768px, 1024px), drawer/sidebar for mobile, touch-friendly buttons (min 44x44px)

## AWS Integration

```typescript
// components/AmplifyConfigClient.tsx
import { Amplify } from 'aws-amplify';
import amplifyOutputs from '@/amplify_outputs.json';
Amplify.configure(amplifyOutputs);
```

**Common integrations**: Cognito (auth), S3 (file uploads), Bedrock (AI), Lambda Function URLs (API)

## Performance & Testing

**Optimization**: Dynamic imports for heavy components, Next.js Image component, cache API responses, sessionStorage for temp data

**Testing**: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
