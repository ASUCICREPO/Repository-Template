/**
 * SystemHealth component for CincyMuse Admin Dashboard
 * Displays real-time system metrics
 * Requirements: 14.5
 */

'use client';

import { useState, useEffect } from 'react';
import { getSystemMetrics, SystemMetrics } from '@/lib/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

export default function SystemHealth() {
  const { language } = useLanguage();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadMetrics = async () => {
    setError('');

    try {
      const metricsData = await getSystemMetrics();
      setMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const getHealthStatus = (): { status: string; color: string; bgColor: string } => {
    if (!metrics) return { status: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    
    if (metrics.errorRate > 0.05) {
      return { status: 'Degraded', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    
    if (metrics.avgResponseTime > 3000) {
      return { status: 'Slow', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    }
    
    return { status: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('systemHealth', language)}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <button
          onClick={loadMetrics}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('thinking', language) : 'Refresh'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Overall health status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Status</h3>
            <p className="text-sm text-gray-600 mt-1">System health indicator</p>
          </div>
          <div className={`px-6 py-3 rounded-full ${healthStatus.bgColor}`}>
            <span className={`text-xl font-bold ${healthStatus.color}`}>
              {healthStatus.status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      {isLoading && !metrics ? (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          {t('thinking', language)}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Average Response Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {t('avgResponseTime', language)}
              </h3>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatResponseTime(metrics.avgResponseTime)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Target: &lt; 3s
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.avgResponseTime < 3000 ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min((metrics.avgResponseTime / 3000) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Max Response Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                Max Response Time
              </h3>
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatResponseTime(metrics.maxResponseTime)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Peak latency
            </p>
          </div>

          {/* Error Rate */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {t('errorRate', language)}
              </h3>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(metrics.errorRate * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Target: &lt; 5%
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.errorRate < 0.05 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(metrics.errorRate * 2000, 100)}%` }}
              />
            </div>
          </div>

          {/* Total Requests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">
                {t('totalRequests', language)}
              </h3>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {metrics.totalRequests.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Last 24 hours
            </p>
          </div>
        </div>
      ) : null}

      {/* Health indicators */}
      {metrics && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <div className="flex items-center">
                {metrics.avgResponseTime < 3000 ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-600">Good</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-600">Slow</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <div className="flex items-center">
                {metrics.errorRate < 0.05 ? (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-600">Normal</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-red-600">High</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Availability</span>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
