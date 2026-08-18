# Frontend Core Standards — Full Reference

Core Next.js configuration, project structure, and TypeScript setup for CIC frontend projects.

## Technology Stack

**Next.js with App Router (Required)**
- Use latest stable version of Next.js (supported by Amplify: 12-15)
- React with TypeScript strict mode
- Server-Side Rendering (SSR) and Static Site Generation (SSG)
- Built-in image optimization and code splitting
- File-based routing with App Router

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Project Structure

```
frontend/
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── contexts/               # React Context providers
├── lib/                    # API clients and utilities
├── public/                 # Static files
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── tailwind.config.ts
```

## API Integration

### Environment Variables

```typescript
// lib/config.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  awsRegion: process.env.NEXT_PUBLIC_AWS_REGION!,
};
if (!config.apiUrl) throw new Error('NEXT_PUBLIC_API_URL required');
```

**Naming**: `NEXT_PUBLIC_*` for client-side, no prefix for server-side.

### Session Management

Generate unique session IDs (minimum 33 characters for AWS AgentCore):
```typescript
const sessionId = `session_${Date.now()}_${randomString()}`;
sessionStorage.setItem('session_id', sessionId);
```

## Build & Deployment

- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Test: `cd frontend && npm test`
- Lint: `cd frontend && npm run lint`

**AWS Amplify**: Automatic CI/CD from GitHub, environment variables via CDK, Next.js SSR support with WEB_COMPUTE platform.

## Security & Accessibility

- Never commit `.env` files, use HTTPS only, sanitize user inputs
- Semantic HTML, ARIA labels, keyboard navigation, color contrast, screen reader compatibility
