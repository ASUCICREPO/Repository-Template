/**
 * FAQAnalytics component for CincyMuse Admin Dashboard
 * Displays top 20 FAQs with CSV export functionality
 * Requirements: 13.2, 13.5
 */

'use client';

import { useState, useEffect } from 'react';
import { getFAQs, exportFAQsCSV, FAQItem } from '@/lib/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export default function FAQAnalytics() {
  const { language } = useLanguage();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const loadFAQs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const faqList = await getFAQs();
      setFaqs(faqList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    setError('');

    try {
      const csvData = await exportFAQsCSV();
      
      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faqs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('faqAnalytics', language)}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Top 20 frequently asked questions
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={isExporting || faqs.length === 0}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? t('thinking', language) : `${t('export', language)} CSV`}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* FAQs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t('thinking', language)}
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No FAQ data available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('question', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('count', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('avgConfidence', language)}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {faq.question}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {faq.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{faq.avgConfidence.toFixed(2)}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              faq.avgConfidence >= 0.7 ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${faq.avgConfidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary statistics */}
      {faqs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Questions</p>
              <p className="text-2xl font-bold text-blue-900">
                {faqs.reduce((sum, faq) => sum + faq.count, 0)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Average Confidence</p>
              <p className="text-2xl font-bold text-green-900">
                {(faqs.reduce((sum, faq) => sum + faq.avgConfidence, 0) / faqs.length).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Unique Categories</p>
              <p className="text-2xl font-bold text-purple-900">
                {new Set(faqs.map(faq => faq.category)).size}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
