'use client';

/**
 * Chat Container component for CincyMuse chatbot
 * Main layout with language selector, opening message, and conversation management
 */

import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { LanguageSelector } from './LanguageSelector';
import { sendMessage, ChatResponse } from '@/lib/chatApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { getOpeningMessage } from '@/lib/translations';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: ChatResponse;
}

export function ChatContainer() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Display opening message on initial load
  useEffect(() => {
    const openingMessage = getOpeningMessage(language);
    setMessages([
      {
        id: 'opening',
        type: 'assistant',
        content: openingMessage,
        timestamp: new Date(),
        response: {
          conversationId: 'opening',
          response: openingMessage,
          sources: [],
          confidence: 1.0,
        },
      },
    ]);
  }, [language]);

  const handleSendMessage = async (messageText: string) => {
    // Add user message to conversation
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Send message to API
      const response = await sendMessage(messageText, language, conversationId);

      // Update conversation ID for context
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant response to conversation
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);

      // Add error message to conversation
      const errorResponse: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        response: {
          conversationId: conversationId || 'error',
          response: errorMessage,
          sources: [],
          confidence: 0,
        },
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              CM
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                CincyMuse
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cincinnati Museum Center Digital Guide
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-red-800 dark:text-red-200">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
