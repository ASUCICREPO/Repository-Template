'use client';

/**
 * Message List component for CincyMuse chatbot
 * Displays conversation history with user and assistant messages
 */

import React, { useEffect, useRef } from 'react';
import { ResponseMessage } from './ResponseMessage';
import { ChatResponse } from '@/lib/chatApi';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: ChatResponse;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'user' ? (
              <UserMessage content={message.content} timestamp={message.timestamp} />
            ) : message.response ? (
              <ResponseMessage
                conversationId={message.response.conversationId}
                response={message.response.response}
                confidence={message.response.confidence}
                sources={message.response.sources}
                isLowConfidence={message.response.confidence < 0.7}
              />
            ) : null}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 mb-6">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                CM
              </div>
            </div>
            <div className="flex-1 max-w-3xl">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * User Message component
 */
function UserMessage({ content, timestamp }: { content: string; timestamp: Date }) {
  return (
    <div className="flex gap-3 mb-6 justify-end">
      <div className="flex-1 max-w-3xl">
        <div className="bg-blue-600 text-white rounded-lg p-4 shadow-sm">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
          U
        </div>
      </div>
    </div>
  );
}
