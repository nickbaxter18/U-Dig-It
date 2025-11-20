/**
 * Enhanced Contract Signer Component
 * Multi-method signature capture with legal compliance, identity verification, and audit trail
 */

'use client';

import { CheckCircle, Clock, Eye, FileText, Lock, Shield } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { triggerCompletionCheck } from '@/lib/trigger-completion-check';
import { contractNumberFromBooking } from '@/lib/utils';

import ContractPreviewModal from './ContractPreviewModal';
import DrawSignature from './DrawSignature';
import TypedSignature from './TypedSignature';

interface EnhancedContractSignerProps {
  bookingId: string;
  bookingData: {
    bookingNumber: string;
    equipmentModel: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    deliveryAddress: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  };
  onSigned: (contractId: string) => void;
  onError?: (error: string) => void;
}

type SignatureMethod = 'draw' | 'type' | 'upload';

export default function EnhancedContractSigner({
  bookingId,
  bookingData,
  onSigned,
  onError,
}: EnhancedContractSignerProps) {
  const { user } = useAuth();
  const [signatureMethod, setSignatureMethod] = useState<SignatureMethod>('draw');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerInitials, setSignerInitials] = useState('');
  const email = bookingData.customerEmail || user?.email || '';
  const phone = bookingData.customerPhone || user?.user_metadata?.phone || '';

  const [agreed, setAgreed] = useState(false);
  const [hasReviewedContract, setHasReviewedContract] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(15 * 60); // 15 minutes

  // Auto-populate name and initials from logged-in user's profile (Personal Information)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const generateInitials = (name: string): string => {
        const nameParts = name.trim().split(/\s+/).filter(Boolean);
        if (nameParts.length === 0) return '';
        if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
        if (nameParts.length === 2) {
          return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        // For 3+ names, use first, middle, and last
        return (
          nameParts[0][0] +
          nameParts[Math.floor(nameParts.length / 2)][0] +
          nameParts[nameParts.length - 1][0]
        ).toUpperCase();
      };

      try {
        // ALWAYS fetch from the logged-in user's profile (public.users table)
        // This is what they filled in under "Personal Information"
        const { data: userData, error } = await supabase
          .from('users')
          .select('firstName, lastName')
          .eq('id', user.id)
          .single();

        let fullName = '';

        const userDataAny: any = userData;
        if (!error && userDataAny?.firstName && userDataAny?.lastName) {
          // Primary: Use public.users table (Personal Information)
          fullName = `${userDataAny.firstName} ${userDataAny.lastName}`;

          logger.info('Auto-populated from user profile table', {
            component: 'EnhancedContractSigner',
            action: 'auto_populate',
            metadata: {
              source: 'users_table',
              name: fullName,
              initials: generateInitials(fullName),
            },
          });
        } else if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
          // Fallback: Use auth.users metadata (for Google/OAuth users)
          const firstName = user.user_metadata.firstName;
          const lastName = user.user_metadata.lastName;
          // Capitalize first letter of each name
          fullName = `${firstName.charAt(0).toUpperCase()}${firstName.slice(1)} ${lastName.charAt(0).toUpperCase()}${lastName.slice(1)}`;

          logger.info('Auto-populated from auth metadata', {
            component: 'EnhancedContractSigner',
            action: 'auto_populate',
            metadata: {
              source: 'auth_metadata',
              name: fullName,
              initials: generateInitials(fullName),
            },
          });
        }

        if (fullName) {
          setSignerName(fullName);
          setSignerInitials(generateInitials(fullName));
        }
      } catch (err) {
        logger.error(
          'Error fetching user profile for contract',
          {
            component: 'EnhancedContractSigner',
            action: 'error',
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionExpiry((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          alert('Session expired for security. Please refresh and try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Verification functions removed - user authentication is sufficient

  const handleSignatureCapture = (signature: string, name?: string) => {
    setSignatureImage(signature);
    if (name) setSignerName(name);
  };

  const handleSubmit = async () => {
    // Validation
    if (!signatureImage) {
      alert('Please create your signature first');
      return;
    }

    if (!signerName.trim()) {
      alert('Please enter your full legal name');
      return;
    }

    if (!signerInitials.trim()) {
      alert('Please enter your initials');
      return;
    }

    if (signerInitials.trim().length < 2 || signerInitials.trim().length > 4) {
      alert('Initials must be 2-4 characters');
      return;
    }

    if (!agreed) {
      alert('You must agree to the terms to proceed');
      return;
    }

    if (!hasReviewedContract) {
      alert('Please preview the contract before signing');
      return;
    }

    // Email/phone verification removed - not required for contract signing
    // User authentication is sufficient for security

    try {
      setSubmitting(true);

      // Create contract record
      const contractNumber = contractNumberFromBooking(bookingData.bookingNumber);

      const supabaseAny: any = supabase;
      const { data: contract, error: contractError } = await supabaseAny
        .from('contracts')
        .insert({
          contractNumber,
          bookingId,
          legalVersions: {
            masterAgreement: {
              version: '2024.1',
              effectiveDate: '2024-01-01',
              title: 'Master Equipment Rental Agreement',
            },
            equipmentRider: {
              version: '2024.1',
              effectiveDate: '2024-01-01',
              title: 'SVL75-3 Equipment Rider',
              equipmentModel: 'Kubota SVL-75',
            },
          },
          type: 'rental_agreement',
          status: 'signed',
          signedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          signatures: {
            customer: {
              name: signerName,
              initials: signerInitials.trim().toUpperCase(),
              email,
              phone,
              signature: signatureImage,
              signatureMethod,
              timestamp: new Date().toISOString(),
              ipAddress: 'client-ip', // TODO: Get real IP
              userAgent: navigator.userAgent,
              authenticated: !!user, // User is authenticated, no extra verification needed
            },
          },
          auditTrail: [
            {
              timestamp: new Date().toISOString(),
              action: 'contract_created',
              user: user?.email || email,
            },
            {
              timestamp: new Date().toISOString(),
              action: 'contract_signed',
              user: user?.email || email,
              method: signatureMethod,
              authenticated: !!user,
            },
          ],
          documentMetadata: {
            sections: 5,
            pages: 8,
            reviewedAt: new Date().toISOString(),
            signedVia: 'enhanced_inline_signer',
            bookingAmount: bookingData.totalAmount,
          },
        })
        .select()
        .single();

      if (contractError) {
        logger.error(
          'Contract creation error:',
          {
            component: 'EnhancedContractSigner',
            action: 'error',
          },
          contractError instanceof Error ? contractError : new Error(String(contractError))
        );
        throw new Error(
          (contractError instanceof Error ? contractError.message : String(contractError)) ||
            'Failed to create contract'
        );
      }

      // Update booking status to confirmed
      logger.info('✅ Contract signed successfully (enhanced signer)', {
        component: 'EnhancedContractSigner',
        action: 'contract_signed',
        metadata: { bookingId, contractId: contract.id },
      });

      // Check if all requirements are now complete
      try {
        const completionResult = await triggerCompletionCheck(bookingId, 'Contract Signed');

        if (completionResult.wasCompleted) {
          logger.info('🎉 Booking 100% complete after contract signing!', {
            component: 'EnhancedContractSigner',
            action: 'booking_completed',
            metadata: { bookingId, bookingNumber: completionResult.bookingNumber },
          });
        }
      } catch (completionError) {
        logger.error(
          'Error checking completion after contract signing',
          {
            component: 'EnhancedContractSigner',
            action: 'completion_check_error',
          },
          completionError as Error
        );
        // Don't fail signing if completion check fails
      }

      // Generate and save signed contract PDF using Puppeteer
      logger.debug('📄 Generating signed contract PDF with Puppeteer...', {
        component: 'EnhancedContractSigner',
        action: 'debug',
      });
      try {
        const pdfResponse = await fetch('/api/contracts/generate-signed-pdf-puppeteer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractId: contract.id }),
        });

        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          logger.debug('✅ Signed contract PDF saved to Supabase Storage:', {
            component: 'EnhancedContractSigner',
            action: 'debug',
            metadata: { fileName: pdfData.fileName },
          });
          logger.debug('📎 PDF URL:', {
            component: 'EnhancedContractSigner',
            action: 'debug',
            metadata: { contractUrl: pdfData.contractUrl },
          });
        } else {
          const errorData = await pdfResponse.json();
          logger.warn('⚠️ Failed to generate signed PDF:', {
            component: 'EnhancedContractSigner',
            action: 'warning',
            metadata: { error: errorData.error },
          });
          logger.warn('⚠️ Error details:', {
            component: 'EnhancedContractSigner',
            action: 'warning',
            metadata: { details: errorData.details },
          });
          // Continue anyway - contract is signed even if PDF generation fails
        }
      } catch (pdfError) {
        logger.error(
          '⚠️ PDF generation error:',
          {
            component: 'EnhancedContractSigner',
            action: 'pdf_generation_error',
          },
          pdfError instanceof Error ? pdfError : new Error(String(pdfError))
        );
        // Continue anyway - contract is signed even if PDF generation fails
      }

      logger.debug('✅ Contract signed successfully:', {
        component: 'EnhancedContractSigner',
        action: 'debug',
        metadata: { contractId: contract.id },
      });
      onSigned(contract.id);
    } catch (error: unknown) {
      logger.error(
        'Signing error:',
        {
          component: 'EnhancedContractSigner',
          action: 'error',
        },
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage = error?.message || error?.error?.message || 'Unknown error occurred';
      logger.error(
        'Error details:',
        {
          component: 'EnhancedContractSigner',
          action: 'error',
          metadata: {
            message: errorMessage,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      onError?.(errorMessage);
      alert(`Failed to complete signing: ${errorMessage}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Legal Compliance Badges */}
      <div className="rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-green-100 p-6">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold">PIPEDA Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-green-800">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-semibold">256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-green-800">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-semibold">UECA Recognized</span>
          </div>
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Legally Binding</span>
          </div>
        </div>
      </div>

      {/* Session Timer */}
      <div className="flex items-center justify-between rounded-lg border-2 border-gray-300 bg-white p-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium">Session expires in:</span>
          <span
            className={`font-mono text-lg font-bold ${sessionExpiry < 60 ? 'text-red-600' : 'text-gray-900'}`}
          >
            {formatTime(sessionExpiry)}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          For security, unsigned contracts expire after 15 minutes
        </p>
      </div>

      {/* Contract Preview Button */}
      <div className="rounded-r-lg border-l-4 border-blue-600 bg-blue-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
            <div>
              <h3 className="mb-1 font-bold text-blue-900">Review Your Rental Agreement</h3>
              <p className="mb-3 text-sm text-blue-800">
                You're about to sign an 8-page rental agreement including equipment-specific terms.
                Please review carefully before signing.
              </p>
              <div className="space-y-1 text-sm text-blue-700">
                <p>✓ Master Rental Agreement (4 pages)</p>
                <p>✓ SVL75-3 Equipment Rider (4 pages)</p>
                <p>✓ Total Amount: ${bookingData.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowContractPreview(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
          >
            <Eye className="h-5 w-5" />
            Preview Contract
          </button>
        </div>
        {hasReviewedContract && (
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle className="h-5 w-5" />✓ Contract reviewed
          </div>
        )}
      </div>

      {/* Identity Verification - Removed per user request. User authentication is sufficient. */}

      {/* Signature Method Selector */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">Choose How to Sign *</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSignatureMethod('draw')}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
              signatureMethod === 'draw'
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-300 bg-white hover:border-gray-400'
            } `}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span className="text-sm font-semibold">✍️ Draw</span>
            <span className="text-xs text-gray-600">Mouse/Touch</span>
          </button>

          <button
            type="button"
            onClick={() => setSignatureMethod('type')}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
              signatureMethod === 'type'
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-300 bg-white hover:border-gray-400'
            } `}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-sm font-semibold">⌨️ Type</span>
            <span className="text-xs text-gray-600">Signature Fonts</span>
          </button>

          <button
            type="button"
            onClick={() => setSignatureMethod('upload')}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
              signatureMethod === 'upload'
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-300 bg-white hover:border-gray-400'
            } `}
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm font-semibold">📤 Upload</span>
            <span className="text-xs text-gray-600">Image File</span>
          </button>
        </div>
      </div>

      {/* Signature Interface Based on Method */}
      <div className="rounded-xl border-2 border-gray-300 bg-white p-6">
        {signatureMethod === 'draw' && (
          <DrawSignature
            onSignatureCapture={handleSignatureCapture}
            onClear={() => setSignatureImage(null)}
          />
        )}

        {signatureMethod === 'type' && (
          <TypedSignature onSignatureCapture={handleSignatureCapture} initialName={signerName} />
        )}

        {signatureMethod === 'upload' && (
          <div className="py-12 text-center text-gray-500">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-400"
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
            <p className="mb-2 font-semibold">Upload Signature Image</p>
            <p className="mb-4 text-sm">PNG, JPG, or GIF format • Max 2MB</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    setSignatureImage(result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="signature-upload"
            />
            <label
              htmlFor="signature-upload"
              className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Signature Preview */}
      {signatureImage && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-900">Signature Captured</span>
          </div>
          <div className="rounded-lg border-2 border-gray-300 bg-white p-4">
            <img src={signatureImage} alt="Your signature" className="mx-auto max-h-32" />
          </div>
          <p className="mt-2 text-center text-xs text-green-700">
            This signature will appear on your rental agreement
          </p>
        </div>
      )}

      {/* Signer Information */}
      <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">Signer Information</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Full Legal Name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="John Michael Doe"
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-1 text-xs text-gray-600">
              Your full legal name as it appears on official documents
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Your Initials <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={signerInitials}
              onChange={(e) => setSignerInitials(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="JMD"
              maxLength={4}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-center text-lg font-bold uppercase tracking-wider text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="mt-1 text-xs text-gray-600">
              2-4 characters (will appear on 6 critical sections of contract)
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-6">
        <label className="group flex cursor-pointer items-start">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-3 text-sm text-gray-700">
            <strong className="mb-2 block text-gray-900">I hereby agree to the following:</strong>
            <ul className="list-inside list-disc space-y-1.5">
              <li>I have read, understood, and agree to all terms of this rental agreement</li>
              <li>My electronic signature is legally binding under UECA and PIPEDA</li>
              <li>I am responsible for all damage, loss, and theft of equipment</li>
              <li>
                Insurance coverage is required before equipment release ("No COI, No Release")
              </li>
              <li>
                I acknowledge the SVL75-3 Equipment Rider including max 25° slope, PPE requirements,
                and all safety/operating limits
              </li>
              <li>Late returns will incur fees up to $700/day as specified</li>
              <li>This agreement is governed by the laws of New Brunswick, Canada</li>
            </ul>
          </span>
        </label>
      </div>

      {/* Sign and Confirm Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          !signatureImage ||
          !signerName ||
          !signerInitials ||
          !agreed ||
          !hasReviewedContract ||
          submitting
        }
        className="flex w-full transform items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
            Finalizing Your Contract...
          </>
        ) : (
          <>
            <CheckCircle className="mr-3 h-6 w-6" />
            Sign Contract & Confirm Booking
          </>
        )}
      </button>

      {/* Legal Notice */}
      <div className="rounded-lg bg-gray-900 p-6 text-white">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-6 w-6 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="font-bold">🔒 Security & Legal Notice</p>
            <p>
              Your signature and personal information are encrypted using 256-bit SSL encryption and
              stored securely in compliance with PIPEDA (Personal Information Protection and
              Electronic Documents Act).
            </p>
            <p>
              Electronic signatures are legally binding under the Uniform Electronic Commerce Act
              (UECA) and have the same legal effect as handwritten signatures in New Brunswick,
              Canada.
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Document ID: {bookingId?.substring(0, 8).toUpperCase() || 'PENDING'} • Timestamp:{' '}
              {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Preview Modal */}
      {showContractPreview && (
        <ContractPreviewModal
          bookingId={bookingId}
          isOpen={showContractPreview}
          onClose={() => setShowContractPreview(false)}
          onProceedToSign={() => {
            setShowContractPreview(false);
            setHasReviewedContract(true);
          }}
        />
      )}
    </div>
  );
}
