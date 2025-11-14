'use client';

import Link from 'next/link';
import { useState } from 'react';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function InsuranceUploadPage() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus({
          status: 'error',
          message: 'Please upload a PDF, JPEG, or PNG file only.',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          status: 'error',
          message: 'File size must be less than 10MB.',
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus({ status: 'idle' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus({ status: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('insurance', selectedFile);
      formData.append('bookingNumber', 'TEST-001'); // In real app, get from context/params

      const response = await fetch('/api/upload-insurance', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus({
          status: 'success',
          message: 'Insurance certificate uploaded successfully!',
        });
      } else {
        setUploadStatus({
          status: 'error',
          message: result.error || 'Upload failed. Please try again.',
        });
      }
    } catch (_error) {
      setUploadStatus({
        status: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-[#A90F0F] px-4 py-2 text-sm font-semibold text-white">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
              Insurance Upload Required
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Upload Your <span className="text-[#A90F0F]">Certificate of Insurance</span>
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
              Complete your booking by uploading your Certificate of Insurance. This is required
              before equipment delivery.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload Section */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                Upload Insurance Certificate
              </h2>

              <div className="space-y-6">
                {/* File Upload Area */}
                <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-[#A90F0F]">
                  <div className="space-y-4">
                    <div className="text-4xl">📄</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Choose your insurance file
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        PDF, JPEG, or PNG files up to 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      id="insurance-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="insurance-upload"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-[#A90F0F] px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Select File
                    </label>
                  </div>
                </div>

                {/* Selected File Display */}
                {selectedFile && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-green-600">
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadStatus({ status: 'idle' });
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Status */}
                {uploadStatus.status !== 'idle' && (
                  <div
                    className={`rounded-lg p-4 ${
                      uploadStatus.status === 'success'
                        ? 'border border-green-200 bg-green-50'
                        : uploadStatus.status === 'error'
                          ? 'border border-red-200 bg-red-50'
                          : 'border border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {uploadStatus.status === 'uploading' && (
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      )}
                      {uploadStatus.status === 'success' && (
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {uploadStatus.status === 'error' && (
                        <svg
                          className="h-5 w-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <p
                        className={`font-medium ${
                          uploadStatus.status === 'success'
                            ? 'text-green-800'
                            : uploadStatus.status === 'error'
                              ? 'text-red-800'
                              : 'text-blue-800'
                        }`}
                      >
                        {uploadStatus.status === 'uploading' && 'Uploading...'}
                        {uploadStatus.status === 'success' && uploadStatus.message}
                        {uploadStatus.status === 'error' && uploadStatus.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStatus.status === 'uploading'}
                  className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                    selectedFile && uploadStatus.status !== 'uploading'
                      ? 'bg-[#A90F0F] text-white hover:bg-red-700'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500'
                  }`}
                >
                  {uploadStatus.status === 'uploading'
                    ? 'Uploading...'
                    : 'Upload Insurance Certificate'}
                </button>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-6">
              {/* Insurance Requirements */}
              <div className="rounded-2xl bg-white p-8 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold text-gray-900">Required Coverage</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        $2,000,000 Commercial General Liability
                      </p>
                      <p className="text-sm text-gray-600">
                        Coverage for bodily injury and property damage
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        $120,000 Rented Equipment Coverage
                      </p>
                      <p className="text-sm text-gray-600">
                        Specific coverage for rented equipment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        U-Dig It Rentals Inc. as Additional Insured
                      </p>
                      <p className="text-sm text-gray-600">Must be listed on the certificate</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        U-Dig It Rentals Inc. as Loss Payee
                      </p>
                      <p className="text-sm text-gray-600">For equipment damage claims</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="rounded-2xl bg-blue-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-blue-900">
                  Need Help Getting Insurance?
                </h3>
                <p className="mb-4 text-sm text-blue-800">
                  We can connect you with insurance providers who understand construction and
                  equipment rental needs.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/getting-insurance"
                    className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Get Insurance Help
                  </Link>
                  <a
                    href="tel:+15066431575"
                    className="block w-full rounded-lg border border-blue-600 bg-white px-4 py-2 text-center font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Call (506) 643-1575
                  </a>
                </div>
              </div>

              {/* Next Steps */}
              <div className="rounded-2xl bg-gray-50 p-6">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">What Happens Next?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A90F0F] text-xs font-bold text-white">
                      1
                    </span>
                    <span>We review your insurance certificate (usually within 2 hours)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A90F0F] text-xs font-bold text-white">
                      2
                    </span>
                    <span>You'll receive confirmation via email</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#A90F0F] text-xs font-bold text-white">
                      3
                    </span>
                    <span>Dispatch team contacts you to schedule delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Booking */}
          <div className="mt-12 text-center">
            <Link
              href="/book"
              className="inline-flex items-center rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
