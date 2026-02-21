'use client';

/**
 * Feedback Buttons component for CincyMuse chatbot
 * Displays thumbs up/down buttons for rating responses
 */

import React, { useState } from 'react';
import { submitFeedback } from '@/lib/chatApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

interface FeedbackButtonsProps {
  conversationId: string;
}

export function FeedbackButtons({ conversationId }: FeedbackButtonsProps) {
  const { language } = useLanguage();
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (feedback || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback(conversationId, rating);
      setFeedback(rating);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedback) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>{t('feedbackThanks', language)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('feedbackPrompt', language)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleFeedback('positive')}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Thumbs up"
            title="Helpful"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Thumbs down"
            title="Not helpful"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
              />
            </svg>
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
