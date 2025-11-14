'use client';

import { AlertCircle, CheckCircle, FileText, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface InsuranceUploadProps {
  onFileSelect: (file: File | null) => void;
  onSkip?: () => void;
  error?: string;
  required?: boolean;
  allowSkip?: boolean;
}

interface UploadedFile {
  file: File;
  preview: string;
  size: string;
}

export default function InsuranceUpload({
  onFileSelect,
  onSkip,
  error,
  required = true,
  allowSkip = false,
}: InsuranceUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, JPG, or PNG file';
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setUploadError('');

      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        onFileSelect(null);
        return;
      }

      const preview = URL.createObjectURL(file);
      setUploadedFile({
        file,
        preview,
        size: formatFileSize(file.size),
      });
      onFileSelect(file);
    },
    [onFileSelect]
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
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setUploadError('');
    onFileSelect(null);
  }, [uploadedFile, onFileSelect]);

  return (
    <div className="space-y-4">
      {/* Requirements Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 flex items-center font-semibold text-blue-900">
          <FileText className="mr-2 h-5 w-5" />
          Insurance Requirements {required && <span className="ml-1 text-red-500">*</span>}
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <strong>$2,000,000</strong> Commercial General Liability
          </li>
          <li>
            • <strong>$120,000</strong> Equipment Coverage
          </li>
          <li>
            • <strong>U-Dig It Rentals Inc.</strong> as Additional Insured
          </li>
          <li>
            • <strong>U-Dig It Rentals Inc.</strong> as Loss Payee
          </li>
          <li>• Valid Certificate of Insurance (COI)</li>
        </ul>
      </div>

      {/* Upload Area */}
      {!uploadedFile ? (
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-[#E1BC56] bg-yellow-50'
              : error || uploadError
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
              error || uploadError ? 'text-red-400' : 'text-gray-400'
            }`}
          />
          <p className="mb-2 text-lg font-medium text-gray-700">Upload Certificate of Insurance</p>
          <p className="mb-4 text-sm text-gray-500">
            Drag and drop your file here, or click to browse
          </p>
          <label className="inline-block cursor-pointer rounded-lg bg-[#E1BC56] px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#d4b04a]">
            Choose File
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
            />
          </label>
          <p className="mt-4 text-xs text-gray-400">Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
        </div>
      ) : (
        /* File Preview */
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start space-x-4">
              <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{uploadedFile.file.name}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {uploadedFile.size} • {uploadedFile.file.type.split('/')[1].toUpperCase()}
                </p>
                <p className="mt-2 text-sm font-medium text-green-700">
                  ✓ File uploaded successfully
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error || uploadError}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Your insurance document will be reviewed within 24 hours. Equipment
          cannot be released until insurance is verified and approved.
        </p>
        {allowSkip && (
          <div className="mt-3 border-t border-gray-300 pt-3">
            <p className="mb-2 text-sm text-blue-800">
              <strong>Don't have your insurance ready?</strong> You can skip this step and upload it
              later from your booking dashboard.
            </p>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-sm font-semibold text-blue-600 underline hover:text-blue-700"
              >
                Skip for now - I'll upload later →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
