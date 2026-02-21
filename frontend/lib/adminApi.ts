/**
 * Admin API client for CincyMuse chatbot
 * Handles communication with the Admin Handler Lambda Function URL
 * All requests require Cognito JWT authentication
 */

import { Source } from './chatApi';

// Get API URL from environment variable
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || '';

export interface ConversationLog {
  conversationId: string;
  timestamp: string;
  question: string;
  response: string;
  language: 'en' | 'es';
  confidence: number;
  sources: Source[];
  feedback?: 'positive' | 'negative';
  sessionId?: string;
}

export interface ConversationFilters {
  startDate?: string;
  endDate?: string;
  language?: 'en' | 'es';
  minConfidence?: number;
  feedback?: 'positive' | 'negative';
  limit?: number;
  nextToken?: string;
}

export interface ConversationsResponse {
  conversations: ConversationLog[];
  nextToken?: string;
}

export interface PDFDocument {
  pdfId: string;
  filename: string;
  s3Key: string;
  uploadDate: string;
  fileSize: number;
  status: 'processing' | 'indexed' | 'error';
  uploadedBy: string;
  errorMessage?: string;
}

export interface FAQItem {
  question: string;
  count: number;
  avgConfidence: number;
  category: string;
}

export interface SystemMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  totalRequests: number;
}

/**
 * Get the current user's JWT token from Amplify Auth
 */
async function getAuthToken(): Promise<string> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return token;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw new Error('Authentication failed');
  }
}

/**
 * Make an authenticated request to the admin API
 */
async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!ADMIN_API_URL) {
    throw new Error('Admin API URL not configured');
  }

  const token = await getAuthToken();

  const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in again');
    }
    if (response.status === 403) {
      throw new Error('Forbidden - insufficient permissions');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Query conversation logs with optional filters
 * 
 * @param filters - Filter criteria for conversation logs
 * @returns Promise resolving to conversations and pagination token
 */
export async function getConversations(
  filters: ConversationFilters = {}
): Promise<ConversationsResponse> {
  const queryParams = new URLSearchParams();

  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.language) queryParams.append('language', filters.language);
  if (filters.minConfidence !== undefined) {
    queryParams.append('minConfidence', filters.minConfidence.toString());
  }
  if (filters.feedback) queryParams.append('feedback', filters.feedback);
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.nextToken) queryParams.append('nextToken', filters.nextToken);

  const endpoint = `/conversations?${queryParams.toString()}`;
  return makeAuthenticatedRequest<ConversationsResponse>(endpoint, {
    method: 'GET',
  });
}

/**
 * Upload a PDF document to the repository
 * 
 * @param file - PDF file to upload (max 10MB)
 * @returns Promise resolving to PDF metadata
 */
export async function uploadPDF(file: File): Promise<PDFDocument> {
  if (!ADMIN_API_URL) {
    throw new Error('Admin API URL not configured');
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size must be 10MB or less');
  }

  const token = await getAuthToken();

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ADMIN_API_URL}/pdfs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please log in again');
    }
    if (response.status === 403) {
      throw new Error('Forbidden - Admin role required');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a PDF document from the repository
 * 
 * @param pdfId - ID of the PDF to delete
 */
export async function deletePDF(pdfId: string): Promise<void> {
  if (!pdfId) {
    throw new Error('PDF ID is required');
  }

  await makeAuthenticatedRequest<void>(`/pdfs/${pdfId}`, {
    method: 'DELETE',
  });
}

/**
 * Get list of all PDF documents
 * 
 * @returns Promise resolving to array of PDF metadata
 */
export async function getPDFs(): Promise<PDFDocument[]> {
  const response = await makeAuthenticatedRequest<{ pdfs: PDFDocument[] }>(
    '/pdfs',
    { method: 'GET' }
  );
  return response.pdfs;
}

/**
 * Get FAQ analytics (top 20 frequently asked questions)
 * 
 * @returns Promise resolving to array of FAQ items
 */
export async function getFAQs(): Promise<FAQItem[]> {
  const response = await makeAuthenticatedRequest<{ faqs: FAQItem[] }>(
    '/analytics/faqs',
    { method: 'GET' }
  );
  return response.faqs;
}

/**
 * Export FAQ data as CSV
 * 
 * @returns Promise resolving to CSV string
 */
export async function exportFAQsCSV(): Promise<string> {
  if (!ADMIN_API_URL) {
    throw new Error('Admin API URL not configured');
  }

  const token = await getAuthToken();

  const response = await fetch(`${ADMIN_API_URL}/analytics/faqs/export`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.text();
}

/**
 * Get system health metrics
 * 
 * @returns Promise resolving to system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  return makeAuthenticatedRequest<SystemMetrics>('/analytics/metrics', {
    method: 'GET',
  });
}

/**
 * Get feedback statistics
 * 
 * @returns Promise resolving to feedback stats
 */
export async function getFeedbackStats(): Promise<{
  totalResponses: number;
  positiveCount: number;
  negativeCount: number;
}> {
  return makeAuthenticatedRequest('/analytics/feedback', {
    method: 'GET',
  });
}
