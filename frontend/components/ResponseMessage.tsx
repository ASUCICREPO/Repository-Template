'use client';

/**
 * Response Message component for CincyMuse chatbot
 * Displays chatbot responses with confidence indicator and sources
 */

import React from 'react';
import { Source } from '@/lib/chatApi';
import { SourceCitation } from './SourceCitation';
import { FeedbackButtons } from './FeedbackButtons';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getFallbackMessage } from '@/lib/translations';

interface ResponseMessageProps {
  conversationId: string;
  response: string;
  confidence: number;
  sources: Source[];
  isLowConfidence?: boolean;
}

export function ResponseMessage({
  conversationId,
  response,
  confidence,
  sources,
  isLowConfidence = false,
}: ResponseMessageProps) {
  const { language } = useLanguage();

  // Check if this is a fallback message
  const isFallback = isLowConfidence || confidence < 0.7;
  const fallbackMessage = getFallbackMessage(language);
  const displayText = isFallback ? fallbackMessage : response;

  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          CM
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Response text */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {displayText}
            </p>
          </div>

          {/* Confidence indicator */}
          {!isFallback && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('confidence', language)}:
              </span>
              <div className="flex-1 max-w-xs h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    confidence >= 0.8
                      ? 'bg-green-500'
                      : confidence >= 0.7
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                  role="progressbar"
                  aria-valuenow={confidence * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Confidence: ${Math.round(confidence * 100)}%`}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}

          {/* Sources */}
          {!isFallback && sources && sources.length > 0 && (
            <SourceCitation sources={sources} />
          )}
        </div>

        {/* Feedback buttons */}
        <div className="mt-3">
          <FeedbackButtons conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
