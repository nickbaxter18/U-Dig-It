/**
 * Insurance Document Upload Section
 * Allows customers to upload Certificate of Insurance (COI) and other insurance docs
 */

'use client';

import { useState, useCallback } from 'react';
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import type { Tables } from '@/../../supabase/types';
import { getErrorMessage } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { triggerCompletionCheck } from '@/lib/trigger-completion-check';
import { useToast } from '@/hooks/useToast';

type InsuranceDocument = Tables<'insurance_documents'>;

interface InsuranceUploadSectionProps {
  bookingId: string;
  existingDocuments: InsuranceDocument[];
  onUploadComplete: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function InsuranceUploadSection({
  bookingId,
  existingDocuments,
  onUploadComplete,
}: InsuranceUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const { success, error: showError, warning } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF, JPEG, or PNG file.';
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB.`;
    }

    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      setFileError('');
      const validationError = validateFile(file);
      if (validationError) {
        setFileError(validationError);
        showError('Invalid File', validationError);
        return;
      }
      setSelectedFile(file);
    },
    [validateFile, showError]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFileError('');
    const fileInput = document.getElementById('insurance-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bookingId', bookingId);

      const response = await fetch('/api/upload-insurance', {
        method: 'POST',
        body: formData,
        });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed. Please try again.');
      }

      logger.info('Insurance certificate uploaded successfully', {
        component: 'InsuranceUploadSection',
        action: 'insurance_uploaded',
        metadata: { bookingId, documentId: result.document?.id },
      });

      // Check if all requirements are now complete
      try {
        const completionResult = await triggerCompletionCheck(bookingId, 'Insurance Uploaded');

        if (completionResult.wasCompleted) {
          logger.info('Booking 100% complete after insurance upload!', {
            component: 'InsuranceUploadSection',
            action: 'booking_completed',
            metadata: { bookingId, bookingNumber: completionResult.bookingNumber },
          });
        }
      } catch (completionError) {
        logger.error(
          'Error checking completion after insurance upload',
          {
            component: 'InsuranceUploadSection',
            action: 'completion_check_error',
          },
          completionError as Error
        );
        // Don't fail upload if completion check fails
      }

      success('Upload Successful', 'Insurance certificate uploaded successfully');
      setSelectedFile(null);
      handleRemoveFile();

      // Call onUploadComplete after a short delay to allow user to see success message
      setTimeout(() => {
        onUploadComplete();
      }, 500);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      logger.error(
        'Insurance upload error',
        {
          component: 'InsuranceUploadSection',
          action: 'upload_error',
          metadata: {
            bookingId,
            fileName: selectedFile.name,
            error: errorMessage,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      setFileError(errorMessage);
      showError('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (doc: InsuranceDocument) => {
    try {
      // Check if fileUrl is available
      if (!doc.fileUrl || doc.fileUrl.trim() === '') {
        if (doc.status === 'approved') {
          warning(
            'No File Available',
            'This document was approved in person by an admin, but no file was uploaded. Please contact support if you need a copy.'
          );
        } else {
          showError('File Not Available', 'File URL is not available for this document.');
        }
        return;
      }

      // If it's already a full URL, use it directly
      if (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) {
        window.open(doc.fileUrl, '_blank', 'noopener');
        return;
      }

      // Otherwise, it's a storage path - create signed URL
      let cleanPath = doc.fileUrl.trim();
      if (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1);
      }
      if (cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
    }

      // Try insurance-documents bucket first (newer)
      const { data: data1, error: error1 } = await supabase.storage
        .from('insurance-documents')
        .createSignedUrl(cleanPath, 3600);

      if (!error1 && data1?.signedUrl) {
        window.open(data1.signedUrl, '_blank', 'noopener');
        return;
      }

      // Try insurance bucket (older) as fallback
      const { data: data2, error: error2 } = await supabase.storage
        .from('insurance')
        .createSignedUrl(cleanPath, 3600);

      if (!error2 && data2?.signedUrl) {
        window.open(data2.signedUrl, '_blank', 'noopener');
        return;
      }

      // Both failed
      const errorMessage = error2?.message || error1?.message || 'Failed to generate download link';
      logger.error(
        'Failed to generate signed URL for insurance document',
        {
          component: 'InsuranceUploadSection',
          action: 'signed_url_failed',
          metadata: {
            documentId: doc.id,
            path: cleanPath,
            originalFileUrl: doc.fileUrl,
            error: errorMessage,
          },
        },
        new Error(errorMessage)
      );
      showError('Unable to View Document', 'Failed to generate download link. Please try again or contact support.');
    } catch (viewError) {
      logger.error(
        'Failed to open insurance document',
        {
          component: 'InsuranceUploadSection',
          action: 'view_document_error',
          metadata: {
            documentId: doc.id,
            fileUrl: doc.fileUrl,
            error: viewError instanceof Error ? viewError.message : String(viewError),
          },
        },
        viewError instanceof Error ? viewError : new Error(String(viewError))
      );
      showError(
        'View Failed',
        viewError instanceof Error ? viewError.message : 'Unknown error. Please try again or contact support.'
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🛡️ Insurance Documents</h2>
        <p className="mt-1 text-gray-600">
          Upload your Certificate of Insurance (COI) or insurance policy
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Insurance Document
        </label>

        {!selectedFile ? (
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : fileError
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload
              className={`mx-auto mb-4 h-12 w-12 ${
                fileError ? 'text-red-400' : 'text-gray-400'
              }`}
            />
            <p className="mb-2 text-lg font-medium text-gray-700">
              Upload Certificate of Insurance
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Drag and drop your file here, or click to browse
            </p>
            <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
              Choose File
          <input
            id="insurance-file-input"
            type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
            disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="mt-4 text-xs text-gray-400">
              Accepted formats: PDF, JPG, PNG (Max {MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  className="rounded-md p-2 text-gray-400 hover:bg-green-100 hover:text-gray-600 disabled:opacity-50"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          <button
            onClick={handleUpload}
              disabled={uploading}
              className="mt-4 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload File'
              )}
          </button>
          </div>
        )}

        {fileError && (
          <div className="mt-3 flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{fileError}</p>
          </div>
        )}
      </div>

      {/* Requirements Info */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="mb-2 flex items-center font-semibold text-yellow-900">
          <FileText className="mr-2 h-5 w-5" />
          Insurance Requirements
        </h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• General Liability: Minimum $1,000,000</li>
          <li>• Equipment Coverage: Replacement value or higher</li>
          <li>• Additional Insured: U-Dig It Rentals must be listed</li>
          <li>• Certificate must be current and valid for rental period</li>
          <li>• Accepted formats: PDF, JPG, PNG (max {MAX_FILE_SIZE / 1024 / 1024}MB)</li>
        </ul>
      </div>

      {/* Existing Documents */}
      {existingDocuments && existingDocuments.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">📎 Uploaded Documents</h3>
          <div className="space-y-2">
            {existingDocuments.map((doc: InsuranceDocument) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center">
                  <FileText className="mr-3 h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{doc.fileName}</div>
                    <div className="text-xs text-gray-500">
                      {doc.fileUrl && doc.fileUrl.trim() !== '' ? (
                        <>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</>
                      ) : (
                        <>Approved in person {new Date(doc.createdAt).toLocaleDateString()}</>
                      )}
                      {doc.insuranceCompany && ` • ${doc.insuranceCompany}`}
                    </div>
                    {(!doc.fileUrl || doc.fileUrl.trim() === '') && (
                      <div className="mt-1 text-xs text-amber-600">
                        ⚠️ No file uploaded - approved in person by admin
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      doc.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : doc.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!doc.fileUrl || doc.fileUrl.trim() === ''}
                    title={
                      !doc.fileUrl || doc.fileUrl.trim() === ''
                        ? 'No file available - document was approved in person'
                        : 'View document'
                    }
                  >
                    View
                  </button>
                  {(!doc.fileUrl || doc.fileUrl.trim() === '') && (
                    <span className="ml-2 text-xs italic text-gray-500">(No file uploaded)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
