'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
  show: boolean;
}

export default function LoadingOverlay({
  message = 'Processing...',
  submessage,
  show,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#E1BC56]" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{message}</h3>
        {submessage && <p className="text-sm text-gray-600">{submessage}</p>}
        <div className="mt-4 flex items-center justify-center space-x-1">
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-[#E1BC56]"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-[#E1BC56]"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-[#E1BC56]"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
