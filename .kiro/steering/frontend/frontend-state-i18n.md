---
inclusion: fileMatch
fileMatchPattern: "frontend/**/*"
---

# Frontend State Management & Internationalization

React Context API, custom hooks, and i18n patterns for CIC frontend projects.

## State Management

### Context API

```typescript
// contexts/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const LanguageContext = createContext<{language: string; setLanguage: (lang: string) => void} | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
```

**Usage in layout**:
```typescript
// app/layout.tsx
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
```

### Custom Hooks

```typescript
// hooks/useStreamingChat.ts
'use client';

import { useState, useCallback } from 'react';

export function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sendMessage = useCallback(async (text: string) => {
    setIsStreaming(true);
    try {
      // Implementation
    } finally {
      setIsStreaming(false);
    }
  }, []);
  
  return { messages, isStreaming, sendMessage };
}
```

**Rules**: Add `'use client'`, use `useCallback` for functions, use `useMemo` for expensive computations

## Internationalization

**Use react-i18next**:
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
<p>{t('welcome.message')}</p>
```

**Structure**: `public/locales/{lang}/common.json`
**Features**: Browser detection, user preference storage, manual switcher
