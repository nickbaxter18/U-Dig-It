'use client';

import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import Link from 'next/link';
import { useState } from 'react';
import { logger } from '@/lib/logger';

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  category: 'forms' | 'guides' | 'manuals' | 'insurance' | 'safety';
  fileType: 'PDF' | 'DOC' | 'XLS';
  fileSize: string;
  downloadUrl: string;
  requiresAuth: boolean;
  icon: string;
}

export default function DownloadsPage() {
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const downloads: DownloadItem[] = [
    {
      id: '1',
      title: 'Equipment Rental Agreement',
      description: 'Standard rental agreement template for Kubota SVL-75 equipment',
      category: 'forms',
      fileType: 'PDF',
      fileSize: '245 KB',
      downloadUrl: '/downloads/rental-agreement.pdf',
      requiresAuth: false,
      icon: '📄',
    },
    {
      id: '2',
      title: 'Certificate of Insurance Template',
      description: 'Template showing required insurance coverage and information',
      category: 'insurance',
      fileType: 'PDF',
      fileSize: '180 KB',
      downloadUrl: '/downloads/insurance-template.pdf',
      requiresAuth: false,
      icon: '🛡️',
    },
    {
      id: '3',
      title: 'Equipment Rental Checklist',
      description: 'Pre-rental inspection and safety checklist for operators',
      category: 'safety',
      fileType: 'PDF',
      fileSize: '156 KB',
      downloadUrl: '/downloads/equipment-rental-checklist',
      requiresAuth: false,
      icon: '✅',
    },
    {
      id: '4',
      title: 'Kubota SVL-75 Operator Manual',
      description: 'Complete operator manual with safety guidelines and operating procedures',
      category: 'manuals',
      fileType: 'PDF',
      fileSize: '2.4 MB',
      downloadUrl: '/downloads/svl-75-manual.pdf',
      requiresAuth: true,
      icon: '📖',
    },
    {
      id: '5',
      title: 'Equipment Specifications Sheet',
      description: 'Detailed technical specifications for Kubota SVL-75',
      category: 'guides',
      fileType: 'PDF',
      fileSize: '320 KB',
      downloadUrl: '/downloads/svl-75-specs.pdf',
      requiresAuth: false,
      icon: '📊',
    },
    {
      id: '6',
      title: 'Safety Guidelines & Best Practices',
      description: 'Comprehensive safety guide for compact track loader operation',
      category: 'safety',
      fileType: 'PDF',
      fileSize: '890 KB',
      downloadUrl: '/downloads/safety-guidelines.pdf',
      requiresAuth: false,
      icon: '⚠️',
    },
    {
      id: '7',
      title: 'Pre-Operation Inspection Form',
      description: 'Daily inspection checklist for equipment operators',
      category: 'forms',
      fileType: 'PDF',
      fileSize: '125 KB',
      downloadUrl: '/downloads/inspection-form.pdf',
      requiresAuth: true,
      icon: '🔍',
    },
    {
      id: '8',
      title: 'Maintenance Schedule',
      description: 'Recommended maintenance schedule and service intervals',
      category: 'manuals',
      fileType: 'PDF',
      fileSize: '210 KB',
      downloadUrl: '/downloads/maintenance-schedule.pdf',
      requiresAuth: true,
      icon: '🔧',
    },
    {
      id: '9',
      title: 'Rental Rate Sheet',
      description: 'Current pricing for daily, weekly, and monthly rentals',
      category: 'guides',
      fileType: 'PDF',
      fileSize: '95 KB',
      downloadUrl: '/downloads/rate-sheet.pdf',
      requiresAuth: false,
      icon: '💰',
    },
    {
      id: '10',
      title: 'Insurance Requirements Guide',
      description: 'Detailed guide to insurance requirements and how to obtain coverage',
      category: 'insurance',
      fileType: 'PDF',
      fileSize: '420 KB',
      downloadUrl: '/downloads/insurance-guide.pdf',
      requiresAuth: false,
      icon: '📋',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Downloads', icon: '📁' },
    { id: 'forms', label: 'Forms', icon: '📄' },
    { id: 'guides', label: 'Guides', icon: '📚' },
    { id: 'manuals', label: 'Manuals', icon: '📖' },
    { id: 'insurance', label: 'Insurance', icon: '🛡️' },
    { id: 'safety', label: 'Safety', icon: '⚠️' },
  ];

  const filteredDownloads = downloads.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (item: DownloadItem) => {
    if (item.requiresAuth && !user) {
      alert('Please sign in to download this file');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Downloading: ${item.title}`, { component: 'app-page', action: 'debug' });
    }
    // In production, this would trigger actual file download
    window.open(item.downloadUrl, '_blank');
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Downloads Center</h1>
            <p className="mt-2 text-gray-600">
              Access forms, guides, manuals, and resources for your equipment rental
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
                  Search Downloads
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by title or description..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Downloads Grid */}
          {filteredDownloads.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No downloads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDownloads.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="text-4xl">{item.icon}</div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {item.fileType}
                        </span>
                        {item.requiresAuth && !user && (
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                            🔒 Login Required
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mb-4 text-sm text-gray-600">{item.description}</p>

                    <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{item.category}</span>
                      <span>{item.fileSize}</span>
                    </div>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={item.requiresAuth && !user}
                      className={`w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                        item.requiresAuth && !user
                          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {item.requiresAuth && !user ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          Sign In to Download
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg
                            className="mr-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download {item.fileType}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white shadow-lg">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold">Need Additional Resources?</h2>
              <p className="mb-6 text-blue-100">
                Can't find what you're looking for? Our support team can help you get the documents
                you need.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/support"
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                >
                  Contact Support
                </Link>
                <a
                  href="tel:+15066431575"
                  className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Call (506) 643-1575
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <div className="mr-3 rounded-lg bg-blue-100 p-2">
                  <svg
                    className="h-6 w-6 text-blue-600"
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
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Forms & Agreements</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Download rental agreements, inspection forms, and other required documents
              </p>
              <button
                onClick={() => setSelectedCategory('forms')}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                View Forms →
              </button>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <div className="mr-3 rounded-lg bg-green-100 p-2">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Safety Resources</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Access safety guidelines, checklists, and best practices for equipment operation
              </p>
              <button
                onClick={() => setSelectedCategory('safety')}
                className="text-sm font-medium text-green-600 hover:text-green-800"
              >
                View Safety Docs →
              </button>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center">
                <div className="mr-3 rounded-lg bg-purple-100 p-2">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Equipment Manuals</h3>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Download operator manuals and technical documentation for our equipment
              </p>
              <button
                onClick={() => setSelectedCategory('manuals')}
                className="text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                View Manuals →
              </button>
            </div>
          </div>

          {/* Info Banner */}
          {!user && (
            <div className="mt-8 border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-3 h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Some downloads require authentication
                  </p>
                  <p className="text-sm text-yellow-700">
                    <Link
                      href="/auth/signin?callbackUrl=/downloads"
                      className="font-semibold underline"
                    >
                      Sign in
                    </Link>{' '}
                    to access operator manuals and detailed technical documentation
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
