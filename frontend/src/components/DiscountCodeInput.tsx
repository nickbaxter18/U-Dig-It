'use client';

import { CheckCircle, Loader2, Tag, XCircle } from 'lucide-react';
import { useState, useTransition } from 'react';

interface DiscountCodeInputProps {
  onDiscountApplied: (discount: AppliedDiscount | null) => void;
  subtotal: number;
}

export interface AppliedDiscount {
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minBookingAmount?: number;
  // Note: discountAmount is calculated dynamically in parent component
  // based on current subtotal (which includes waiver if selected)
}

export default function DiscountCodeInput({ onDiscountApplied, subtotal }: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const validateDiscount = async (codeToValidate: string): Promise<AppliedDiscount | null> => {
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToValidate,
          subtotal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate discount code');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Invalid discount code');
      }

      return result.discount;
    } catch (error) {
      // Return null for invalid codes, throw for network errors
      if (error instanceof Error && error.message.includes('Invalid')) {
        return null;
      }
      throw error;
    }
  };

  const handleApply = () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    startTransition(async () => {
      setError('');

      try {
        const validatedDiscount = await validateDiscount(code.trim());

        if (validatedDiscount) {
          setAppliedDiscount(validatedDiscount);
          onDiscountApplied(validatedDiscount);
          setError('');
        } else {
          setError('Invalid or expired discount code');
          setAppliedDiscount(null);
          onDiscountApplied(null);
        }
      } catch (err) {
        setError('Failed to validate discount code. Please try again.');
        setAppliedDiscount(null);
        onDiscountApplied(null);
      }
    });
  };

  const handleRemove = () => {
    setAppliedDiscount(null);
    setCode('');
    setError('');
    onDiscountApplied(null);
  };

  return (
    <div className="space-y-3">
      {!appliedDiscount ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                placeholder="Enter discount code"
                className={`w-full rounded-lg border py-3 pl-10 pr-4 focus:border-[#E1BC56] focus:ring-2 focus:ring-[#E1BC56] ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isPending}
              />
            </div>
            <button
              onClick={handleApply}
              disabled={isPending || !code.trim()}
              className="min-w-[100px] whitespace-nowrap rounded-lg bg-[#E1BC56] px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-[#d4b04a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Apply'}
            </button>
          </div>

          {error && (
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs italic text-gray-500">
            Have a promo code? Enter it above to apply your discount.
          </p>
        </>
      ) : (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 items-start">
              <CheckCircle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">{appliedDiscount.name}</p>
                <p className="mt-1 text-sm text-green-700">
                  Code: <span className="font-mono font-bold">{appliedDiscount.code}</span>
                </p>
                <p className="text-sm text-green-700">
                  Discount:{' '}
                  {appliedDiscount.type === 'percentage'
                    ? `${appliedDiscount.value}% off`
                    : `$${appliedDiscount.value.toFixed(2)} off`}
                </p>
                {(() => {
                  // Calculate actual savings based on current subtotal
                  const savingsAmount = appliedDiscount.type === 'percentage'
                    ? (subtotal * appliedDiscount.value) / 100
                    : Math.min(appliedDiscount.value, subtotal);

                  return (
                    <div className="mt-2 rounded-md bg-green-100 px-3 py-2">
                      <p className="text-base font-bold text-green-800">
                        🎉 Congratulations! You're saving ${savingsAmount.toFixed(2)}
                      </p>
                      {appliedDiscount.type === 'percentage' && (
                        <p className="mt-1 text-xs text-green-700">
                          ({appliedDiscount.value}% off ${subtotal.toFixed(2)})
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="ml-2 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Remove discount code"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
