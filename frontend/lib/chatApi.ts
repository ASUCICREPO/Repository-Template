/**
 * Chat API client for CincyMuse chatbot
 * Handles communication with the Chat Handler Lambda Function URL
 */

import { getOrCreateSessionId } from './sessionUtils';

// Get API URL from environment variable
const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || '';

export interface Source {
  title: string;
  url: string;
  type: 'website' | 'collection' | 'event' | 'podcast' | 'pdf';
}

export interface ChatResponse {
  conversationId: string;
  response: string;
  sources: Source[];
  confidence: number;
}

export interface ChatRequest {
  message: string;
  language: 'en' | 'es';
  conversationId?: string;
  sessionId?: string;
}

/**
 * Send a message to the chatbot and receive a response
 * 
 * @param message - User's question (1-1000 characters)
 * @param language - Language preference ('en' or 'es')
 * @param conversationId - Optional conversation ID for context
 * @returns Promise resolving to chat response
 */
export async function sendMessage(
  message: string,
  language: 'en' | 'es',
  conversationId?: string
): Promise<ChatResponse> {
  if (!CHAT_API_URL) {
    throw new Error('Chat API URL not configured');
  }

  // Validate message length
  if (!message || message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (message.length > 1000) {
    throw new Error('Message must be 1000 characters or less');
  }

  // Get or create session ID
  const sessionId = getOrCreateSessionId();

  const request: ChatRequest = {
    message: message.trim(),
    language,
    sessionId,
  };

  if (conversationId) {
    request.conversationId = conversationId;
  }

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send message');
  }
}

/**
 * Submit feedback for a chatbot response
 * 
 * @param conversationId - ID of the conversation to rate
 * @param rating - Feedback rating ('positive' or 'negative')
 */
export async function submitFeedback(
  conversationId: string,
  rating: 'positive' | 'negative'
): Promise<void> {
  if (!CHAT_API_URL) {
    throw new Error('Chat API URL not configured');
  }

  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'feedback',
        conversationId,
        rating,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to submit feedback');
  }
}
