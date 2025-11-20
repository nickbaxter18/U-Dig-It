'use client';

import React from 'react';

interface ContractPDFProps {
  contractData?: unknown;
  className?: string;
}

export default function ContractPDF({
  contractData: _contractData,
  className = '',
}: ContractPDFProps) {
  // Reserved for future PDF generation
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Contract PDF</h3>
      <div className="h-96 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded">
        Contract PDF viewer coming soon
      </div>
    </div>
  );
}
