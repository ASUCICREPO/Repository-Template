/**
 * PDFManager component for CincyMuse Admin Dashboard
 * Upload/delete interface for PDF documents (Admin only)
 * Requirements: 9.1, 9.2, 9.3
 */

'use client';

import { useState, useEffect } from 'react';
import { getPDFs, uploadPDF, deletePDF, PDFDocument } from '@/lib/adminApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';

interface PDFManagerProps {
  userRole: 'Admin' | 'Viewer';
}

export default function PDFManager({ userRole }: PDFManagerProps) {
  const { language } = useLanguage();
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAdmin = userRole === 'Admin';

  const loadPDFs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const pdfList = await getPDFs();
      setPdfs(pdfList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDFs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPDFs();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      setSelectedFile(null);
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be 10MB or less');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError('');

    try {
      await uploadPDF(selectedFile);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Reload PDFs
      await loadPDFs();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (pdfId: string, filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      await deletePDF(pdfId);
      await loadPDFs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const getStatusBadge = (status: PDFDocument['status']) => {
    const statusColors = {
      processing: 'bg-yellow-100 text-yellow-800',
      indexed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
        {t(status, language)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('pdfManagement', language)}
        </h2>
        {!isAdmin && (
          <p className="mt-2 text-sm text-gray-600">
            {t('viewerNote', language)}
          </p>
        )}
      </div>

      {/* Upload section - Admin only */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('uploadPDF', language)}
          </h3>

          {uploadError && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF file (max 10MB)
              </label>
              <input
                type="file"
                id="pdf-upload"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? t('thinking', language) : t('uploadPDF', language)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* PDFs table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t('thinking', language)}
          </div>
        ) : pdfs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No PDFs uploaded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('filename', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('uploadDate', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('fileSize', language)}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', language)}
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pdfs.map((pdf) => (
                  <tr key={pdf.pdfId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pdf.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(pdf.uploadDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(pdf.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(pdf.status)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(pdf.pdfId, pdf.filename)}
                          className="text-red-600 hover:text-red-900 font-medium focus:outline-none focus:underline"
                        >
                          {t('deletePDF', language)}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
