'use client';

/**
 * Source Citation component for CincyMuse chatbot
 * Displays linked sources grouped by type
 */

import React from 'react';
import { Source } from '@/lib/chatApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

interface SourceCitationProps {
  sources: Source[];
}

const sourceTypeIcons: Record<Source['type'], string> = {
  website: '🌐',
  collection: '🏛️',
  event: '📅',
  podcast: '🎙️',
  pdf: '📄',
};

const sourceTypeLabels: Record<Source['type'], string> = {
  website: 'Website',
  collection: 'Collection',
  event: 'Event',
  podcast: 'Podcast',
  pdf: 'Document',
};

export function SourceCitation({ sources }: SourceCitationProps) {
  const { language } = useLanguage();

  if (!sources || sources.length === 0) {
    return null;
  }

  // Group sources by type
  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.type]) {
      acc[source.type] = [];
    }
    acc[source.type].push(source);
    return acc;
  }, {} as Record<Source['type'], Source[]>);

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t('sources', language)}
      </h4>
      <div className="space-y-3">
        {Object.entries(groupedSources).map(([type, typeSources]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" aria-hidden="true">
                {sourceTypeIcons[type as Source['type']]}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                {sourceTypeLabels[type as Source['type']]}
              </span>
            </div>
            <ul className="space-y-1 ml-7">
              {typeSources.map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{source.title || source.url}</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
