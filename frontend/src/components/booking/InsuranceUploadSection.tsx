/**
 * Insurance Document Upload Section
 * Allows customers to upload Certificate of Insurance (COI) and other insurance docs
 */

'use client';

import { logger } from '@/lib/logger';
import { triggerCompletionCheck } from '@/lib/trigger-completion-check';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';

interface InsuranceUploadSectionProps {
  bookingId: string;
  existingDocuments: any[];
  onUploadComplete: () => void;
}

export default function InsuranceUploadSection({
  bookingId,
  existingDocuments,
  onUploadComplete,
}: InsuranceUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 10MB.');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload PDF or image (JPG, PNG, WebP).');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate secure upload path
      const supabaseAny: any = supabase;
      const { data: pathData, error: pathError } = await supabaseAny.rpc(
        'generate_insurance_upload_path',
        {
          p_booking_id: bookingId,
          p_file_name: selectedFile.name,
        }
      );

      if (pathError) throw pathError;

      // Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('insurance-documents')
        .upload(pathData, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record (matching existing schema)
      const { error: dbError } = await supabaseAny.from('insurance_documents').insert({
        bookingId,
        fileName: selectedFile.name,
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        fileUrl: uploadData.path,
        type: 'coi', // Certificate of Insurance
        status: 'pending',
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setSelectedFile(null);

      logger.info('✅ Insurance uploaded successfully', {
        component: 'InsuranceUploadSection',
        action: 'insurance_uploaded',
        metadata: { bookingId },
      });

      // Check if all requirements are now complete
      try {
        const completionResult = await triggerCompletionCheck(bookingId, 'Insurance Uploaded');

        if (completionResult.wasCompleted) {
          logger.info('🎉 Booking 100% complete after insurance upload!', {
            component: 'InsuranceUploadSection',
            action: 'booking_completed',
            metadata: { bookingId, bookingNumber: completionResult.bookingNumber },
          });
        }
      } catch (completionError) {
        logger.error('Error checking completion after insurance upload', {
          component: 'InsuranceUploadSection',
          action: 'completion_check_error',
        }, completionError as Error);
        // Don't fail upload if completion check fails
      }

      // Reset file input
      const fileInput = document.getElementById('insurance-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        onUploadComplete();
      }, 500);
    } catch (error: any) {
      logger.error('Upload error:', {
        component: 'InsuranceUploadSection',
        action: 'error',
      }, error instanceof Error ? error : new Error(String(error)));
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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
        <div className="flex items-center gap-4">
          <input
            id="insurance-file-input"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full flex-1 cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 file:mr-4 file:rounded-l-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {selectedFile && !uploading && (
          <div className="mt-2 text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-gray-600">Uploading...</span>
              <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Requirements Info */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="mb-2 font-semibold text-yellow-900">📋 Insurance Requirements</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• General Liability: Minimum $1,000,000</li>
          <li>• Equipment Coverage: Replacement value or higher</li>
          <li>• Additional Insured: U-Dig It Rentals must be listed</li>
          <li>• Certificate must be current and valid for rental period</li>
          <li>• Accepted formats: PDF, JPG, PNG (max 10MB)</li>
        </ul>
      </div>

      {/* Existing Documents */}
      {existingDocuments && existingDocuments.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">📎 Uploaded Documents</h3>
          <div className="space-y-2">
            {existingDocuments.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center">
                  <svg
                    className="mr-3 h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">{doc.fileName}</div>
                    <div className="text-xs text-gray-500">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      {doc.insuranceCompany && ` • ${doc.insuranceCompany}`}
                    </div>
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
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.storage
                          .from('insurance-documents')
                          .createSignedUrl(doc.fileUrl, 300);

                        if (error || !data?.signedUrl) {
                          throw error || new Error('Unable to generate download link');
                        }

                        window.open(data.signedUrl, '_blank', 'noopener');
                      } catch (viewError) {
                        logger.error('Failed to open insurance document', {
                          component: 'InsuranceUploadSection',
                          action: 'view_document_error',
                          metadata: { documentId: doc.id },
                        }, viewError instanceof Error ? viewError : new Error(String(viewError)));
                        alert('Unable to open document. Please try again or contact support.');
                      }
                    }}
                    className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
