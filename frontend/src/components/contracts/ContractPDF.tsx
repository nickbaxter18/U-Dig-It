'use client';

import React from 'react';

interface ContractPDFProps {
  contractData?: any;
  className?: string;
}

export default function ContractPDF({ contractData, className = '' }: ContractPDFProps) {
  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Contract PDF</h3>
      <div className="h-96 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded">
        Contract PDF viewer coming soon
      </div>
    </div>
  );
}

