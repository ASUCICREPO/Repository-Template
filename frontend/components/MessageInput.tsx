'use client';

/**
 * Message Input component for CincyMuse chatbot
 * Text input with validation and Enter key submission
 */

import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 1000;

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const { language } = useLanguage();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate message
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError(t('errorMessageEmpty', language));
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(t('errorMessageTooLong', language));
      return;
    }

    // Clear error and send message
    setError(null);
    onSendMessage(trimmedMessage);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }

    // Show warning if approaching limit
    if (newValue.length > MAX_MESSAGE_LENGTH) {
      setError(t('errorMessageTooLong', language));
    }
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > MAX_MESSAGE_LENGTH * 0.9;

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Error message */}
        {error && (
          <div className="mb-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={t('messagePlaceholder', language)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH + 100} // Allow typing past limit to show error
              aria-label="Message input"
              aria-invalid={!!error}
              aria-describedby={error ? 'message-error' : undefined}
            />

            {/* Character count */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
              <span className={isNearLimit ? 'text-orange-500 font-medium' : ''}>
                {characterCount}
              </span>
              /{MAX_MESSAGE_LENGTH}
            </div>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || !message.trim() || message.length > MAX_MESSAGE_LENGTH}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={t('sendButton', language)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span className="sr-only">{t('sendButton', language)}</span>
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </form>
  );
}
