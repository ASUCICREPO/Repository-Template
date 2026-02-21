/**
 * Admin Dashboard page for CincyMuse
 * Implements role-based UI rendering and session timeout handling
 * Requirements: 12.1, 12.3, 12.4, 12.5
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAuthUser, logout, isAuthenticated } from '@/lib/authUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { LanguageSelector } from '@/components/LanguageSelector';
import ConversationLogs from '@/components/admin/ConversationLogs';
import PDFManager from '@/components/admin/PDFManager';
import FAQAnalytics from '@/components/admin/FAQAnalytics';
import SystemHealth from '@/components/admin/SystemHealth';
import FeedbackReview from '@/components/admin/FeedbackReview';

type TabType = 'conversations' | 'pdfs' | 'faqs' | 'health' | 'feedback';

export default function AdminDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [userRole, setUserRole] = useState<'Admin' | 'Viewer' | null>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Session timeout: 30 minutes (1800000 ms)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  useEffect(() => {
    checkAuth();
  }, []);

  // Session timeout handler
  useEffect(() => {
    const checkSessionTimeout = () => {
      const now = Date.now();
      if (now - lastActivity > SESSION_TIMEOUT) {
        handleLogout();
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60000);

    // Update last activity on user interaction
    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [lastActivity]);

  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        router.push('/admin/login');
        return;
      }

      const user = await getCurrentAuthUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      setUserRole(user.role);
      setUsername(user.username);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'conversations', label: t('conversationLogs', language), icon: '💬' },
    { id: 'pdfs', label: t('pdfManagement', language), icon: '📄' },
    { id: 'faqs', label: t('faqAnalytics', language), icon: '❓' },
    { id: 'health', label: t('systemHealth', language), icon: '🏥' },
    { id: 'feedback', label: 'Feedback Review', icon: '📊' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('thinking', language)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('adminDashboard', language)}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {username} • {userRole}
                {userRole === 'Viewer' && (
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded-full">
                    {t('viewerNote', language)}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('logout', language)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'conversations' && <ConversationLogs />}
        {activeTab === 'pdfs' && userRole && <PDFManager userRole={userRole} />}
        {activeTab === 'faqs' && <FAQAnalytics />}
        {activeTab === 'health' && <SystemHealth />}
        {activeTab === 'feedback' && <FeedbackReview />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            CincyMuse Admin Dashboard • Cincinnati Museum Center
          </p>
        </div>
      </footer>
    </div>
  );
}
