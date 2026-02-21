'use client';

/**
 * Language Selector component for CincyMuse chatbot
 * Allows users to toggle between English and Spanish
 */

import React from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('languageSelector', language)}:
      </span>
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => handleLanguageChange('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          aria-label="Switch to English"
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <button
          onClick={() => handleLanguageChange('es')}
          className={`px-3 py-1 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
            language === 'es'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          aria-label="Cambiar a Español"
          aria-pressed={language === 'es'}
        >
          ES
        </button>
      </div>
    </div>
  );
}
