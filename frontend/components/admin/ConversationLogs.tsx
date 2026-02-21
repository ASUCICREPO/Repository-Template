/**
 * ConversationLogs component for CincyMuse Admin Dashboard
 * Displays searchable table of conversation history with filters
 * Requirements: 10.4, 10.5
 */

'use client';

import { useState, useEffect } from 'react';
import { getConversations, ConversationLog, ConversationFilters } from '@/lib/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export default function ConversationLogs() {
  const { language } = useLanguage();
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextToken, setNextToken] = useState<string | undefined>();
  
  // Filter state
  const [filters, setFilters] = useState<ConversationFilters>({
    limit: 50,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es' | ''>('');
  const [minConfidence, setMinConfidence] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<'positive' | 'negative' | ''>('');

  const loadConversations = async (loadMore = false) => {
    setIsLoading(true);
    setError('');

    try {
      const filterParams: ConversationFilters = {
        ...filters,
        nextToken: loadMore ? nextToken : undefined,
      };

      if (startDate) filterParams.startDate = startDate;
      if (endDate) filterParams.endDate = endDate;
      if (selectedLanguage) filterParams.language = selectedLanguage;
      if (minConfidence) filterParams.minConfidence = parseFloat(minConfidence);
      if (selectedFeedback) filterParams.feedback = selectedFeedback;

      const response = await getConversations(filterParams);
      
      if (loadMore) {
        setConversations([...conversations, ...response.conversations]);
      } else {
        setConversations(response.conversations);
      }
      
      setNextToken(response.nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleApplyFilters = () => {
    loadConversations(false);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedLanguage('');
    setMinConfidence('');
    setSelectedFeedback('');
    setFilters({ limit: 50 });
    setTimeout(() => loadConversations(false), 0);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('conversationLogs', language)}
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('filter', language)}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('startDate', language)}
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t('endDate', language)}
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              {t('languageSelector', language)}
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'es' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="en">{t('english', language)}</option>
              <option value="es">{t('spanish', language)}</option>
            </select>
          </div>

          <div>
            <label htmlFor="minConfidence" className="block text-sm font-medium text-gray-700 mb-1">
              {t('confidence', language)} (min)
            </label>
            <input
              type="number"
              id="minConfidence"
              min="0"
              max="1"
              step="0.1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              placeholder="0.0 - 1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              {t('feedback', language)}
            </label>
            <select
              id="feedback"
              value={selectedFeedback}
              onChange={(e) => setSelectedFeedback(e.target.value as 'positive' | 'negative' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="positive">{t('positive', language)}</option>
              <option value="negative">{t('negative', language)}</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('filter', language)}
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Conversations table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('thinking', language)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No conversations found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('timestamp', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('question', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('response', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('languageSelector', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('confidence', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('feedback', language)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <tr key={conv.conversationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(conv.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {conv.question}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {conv.response}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conv.language === 'en' ? t('english', language) : t('spanish', language)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conv.confidence.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {conv.feedback === 'positive' && (
                        <span className="text-green-600">👍 {t('positive', language)}</span>
                      )}
                      {conv.feedback === 'negative' && (
                        <span className="text-red-600">👎 {t('negative', language)}</span>
                      )}
                      {!conv.feedback && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more button */}
        {nextToken && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => loadConversations(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('thinking', language) : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
