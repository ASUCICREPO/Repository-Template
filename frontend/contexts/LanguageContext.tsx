'use client';

/**
 * Language Context for CincyMuse chatbot
 * Manages bilingual support (English/Spanish) with sessionStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'cincymuse_language';

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Language Provider component
 * Wraps the app to provide language context to all components
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language preference from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') {
        setLanguageState(stored);
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Update language and persist to sessionStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  };

  // Don't render children until language is loaded from storage
  // This prevents flash of wrong language content
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * Must be used within LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
