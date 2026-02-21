/**
 * FeedbackReview component for CincyMuse Admin Dashboard
 * Displays responses with negative feedback for quality review
 * Requirements: 11.4
 */

'use client';

import { useState, useEffect } from 'react';
import { getConversations, ConversationLog, getFeedbackStats } from '@/lib/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export default function FeedbackReview() {
  const { language } = useLanguage();
  const [negativeFeedback, setNegativeFeedback] = useState<ConversationLog[]>([]);
  const [stats, setStats] = useState<{
    totalResponses: number;
    positiveCount: number;
    negativeCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load negative feedback conversations
      const response = await getConversations({
        feedback: 'negative',
        limit: 100,
      });
      setNegativeFeedback(response.conversations);

      // Load feedback statistics
      const statsData = await getFeedbackStats();
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const calculateSatisfactionRate = (): number => {
    if (!stats || stats.totalResponses === 0) return 0;
    return (stats.positiveCount / stats.totalResponses) * 100;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Feedback Review
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Review responses with negative feedback to improve quality
        </p>
      </div>

      {/* Feedback statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Responses</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalResponses}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-green-600 mb-2">
              {t('positive', language)} 👍
            </h3>
            <p className="text-3xl font-bold text-green-900">{stats.positiveCount}</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-red-600 mb-2">
              {t('negative', language)} 👎
            </h3>
            <p className="text-3xl font-bold text-red-900">{stats.negativeCount}</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-blue-600 mb-2">Satisfaction Rate</h3>
            <p className="text-3xl font-bold text-blue-900">
              {calculateSatisfactionRate().toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Negative feedback list */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Negative Feedback ({negativeFeedback.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t('thinking', language)}
          </div>
        ) : negativeFeedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No negative feedback found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {negativeFeedback.map((conv) => (
              <div key={conv.conversationId} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(conv.timestamp)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {conv.language === 'en' ? t('english', language) : t('spanish', language)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {t('confidence', language)}: {conv.confidence.toFixed(2)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {t('question', language)}:
                      </p>
                      <p className="text-sm text-gray-900">{conv.question}</p>
                    </div>

                    {expandedId === conv.conversationId && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {t('response', language)}:
                        </p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {conv.response}
                        </p>

                        {conv.sources && conv.sources.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {t('sources', language)}:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {conv.sources.map((source, idx) => (
                                <li key={idx}>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {source.title || source.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => toggleExpanded(conv.conversationId)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                    >
                      {expandedId === conv.conversationId ? 'Show less' : 'Show more'}
                    </button>
                  </div>

                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      👎 {t('negative', language)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insights */}
      {negativeFeedback.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Quality Improvement Opportunities
              </h3>
              <p className="text-sm text-yellow-700">
                Review these conversations to identify patterns in negative feedback. 
                Consider updating knowledge base content, improving response quality, 
                or adjusting confidence thresholds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
