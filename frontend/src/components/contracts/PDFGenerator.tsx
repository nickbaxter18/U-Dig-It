'use client';

import React from 'react';

interface PDFGeneratorProps {
  data?: unknown;
  onGenerate?: (pdf: Blob) => void;
  className?: string;
}

export default function PDFGenerator({
  data: _data,
  onGenerate,
  className = '',
}: PDFGeneratorProps) {
  // _data reserved for future PDF generation
  const handleGenerate = () => {
    // Placeholder for PDF generation
    if (onGenerate) {
      // Return empty blob for now
      onGenerate(new Blob());
    }
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">PDF Generator</h3>
      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-kubota-orange text-white rounded hover:bg-orange-600"
      >
        Generate PDF
      </button>
    </div>
  );
}
