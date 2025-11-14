/**
 * Typed Signature Component
 * Allows users to type their name in various signature fonts
 */

'use client';

import { useState } from 'react';

interface TypedSignatureProps {
  onSignatureCapture: (signature: string, name: string) => void;
  initialName?: string;
}

const SIGNATURE_FONTS = [
  { id: 'dancing', name: 'Dancing Script', className: 'font-dancing' },
  { id: 'great-vibes', name: 'Great Vibes', className: 'font-great-vibes' },
  { id: 'allura', name: 'Allura', className: 'font-allura' },
  { id: 'pacifico', name: 'Pacifico', className: 'font-pacifico' },
];

export default function TypedSignature({
  onSignatureCapture,
  initialName = '',
}: TypedSignatureProps) {
  const [name, setName] = useState(initialName);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);

  const generateSignatureImage = async (text: string, fontClass: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set signature style
    ctx.fillStyle = '#000000';
    ctx.font = '48px ' + fontClass.replace('font-', '');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Draw text
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleApply = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    const signatureImage = await generateSignatureImage(name, selectedFont.className);
    onSignatureCapture(signatureImage, name);
  };

  return (
    <div className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Type Your Full Legal Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
          autoFocus
        />
      </div>

      {/* Font Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Choose Signature Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SIGNATURE_FONTS.map(font => (
            <button
              key={font.id}
              type="button"
              onClick={() => setSelectedFont(font)}
              className={`relative rounded-lg border-2 p-4 transition-all ${
                selectedFont.id === font.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              } `}
            >
              <p className={`text-2xl ${font.className} truncate text-center`}>
                {name || font.name}
              </p>
              <p className="mt-1 text-center text-xs text-gray-500">{font.name}</p>
              {selectedFont.id === font.id && (
                <div className="absolute right-2 top-2">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Signature Preview */}
      {name && (
        <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-6">
          <p className="mb-2 text-center text-xs text-gray-600">Signature Preview:</p>
          <div className="border-b-2 border-gray-400 bg-white p-6 text-center">
            <p className={`text-5xl ${selectedFont.className}`}>{name}</p>
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            This is how your signature will appear on the contract
          </p>
        </div>
      )}

      {/* Apply Button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={!name.trim()}
        className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Apply Typed Signature
      </button>

      {/* Note */}
      <p className="text-center text-xs text-gray-500">
        💡 Tip: Choose a font that best matches your handwritten signature style
      </p>
    </div>
  );
}
