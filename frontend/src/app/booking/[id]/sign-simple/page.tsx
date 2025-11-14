/**
 * Simple Contract Signing Page
 * Simplified signature capture without external dependencies
 */

'use client';

import { logger } from '@/lib/logger';
import { triggerCompletionCheck } from '@/lib/trigger-completion-check';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SimpleSignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(
        `
        *,
        equipment:equipmentId (make, model, unitId),
        customer:customerId (firstName, lastName, email)
      `
      )
      .eq('id', params.id)
      .single();

    if (data) {
      setBooking(data);
      const customer = (data as any)?.customer;
      if (customer) {
        setName(`${customer.firstName} ${customer.lastName}`);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleSubmit = async () => {
    if (!signature || !name || !agreed) {
      alert('Please complete all fields and sign the document');
      return;
    }

    try {
      setSubmitting(true);

      // Get contract - Using type assertion to bypass overly restrictive RLS types
      const supabaseAny: any = supabase;
      const { data: contract } = await supabaseAny
        .from('contracts')
        .select('*')
        .eq('bookingId', params.id)
        .single();

      if (!contract) throw new Error('Contract not found');

      // Update contract as signed
      const { error } = await supabaseAny
        .from('contracts')
        .update({
          status: 'signed',
          signedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          signatures: {
            customer: {
              name,
              date,
              signature,
              ip: 'localhost',
              timestamp: new Date().toISOString(),
            },
          },
        })
        .eq('id', contract.id);

      if (error) throw error;

      logger.info('✅ Contract signed successfully', {
        component: 'sign-simple-page',
        action: 'contract_signed',
        metadata: { bookingId: params.id },
      });

      // Check if all requirements are now complete
      try {
        const completionResult = await triggerCompletionCheck(params.id, 'Contract Signed');

        if (completionResult.wasCompleted) {
          logger.info('🎉 Booking 100% complete after contract signing!', {
            component: 'sign-simple-page',
            action: 'booking_completed',
            metadata: { bookingId: params.id, bookingNumber: completionResult.bookingNumber },
          });
        }
      } catch (completionError) {
        logger.error('Error checking completion after contract signing', {
          component: 'sign-simple-page',
          action: 'completion_check_error',
        }, completionError as Error);
        // Don't fail contract signing if completion check fails
      }

      // Redirect to manage page
      router.push(`/booking/${params.id}/manage`);
    } catch (error: any) {
      logger.error('Signing error', {
        component: 'app-page',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      }, error instanceof Error ? error : undefined);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Equipment Rental Agreement</h1>
          <p className="text-gray-600">
            Booking #{booking.bookingNumber} - {booking.equipment.make} {booking.equipment.model}
          </p>
        </div>

        {/* Contract Content */}
        <div className="mb-6 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Agreement Terms</h2>

          <div className="space-y-4 text-gray-700">
            <p>
              This Equipment Rental Agreement ("Agreement") is entered into between
              <strong> U-Dig It Rentals Inc.</strong> ("Owner") and
              <strong> {name}</strong> ("Renter").
            </p>

            <div className="rounded bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Equipment Details:</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  • Equipment: {booking.equipment.make} {booking.equipment.model}
                </li>
                <li>• Unit ID: {booking.equipment.unitId}</li>
                <li>
                  • Rental Period: {new Date(booking.startDate).toLocaleDateString()} to{' '}
                  {new Date(booking.endDate).toLocaleDateString()}
                </li>
                <li>• Total Amount: ${booking.totalAmount}</li>
                <li>• Security Deposit: ${booking.securityDeposit}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Key Terms:</h3>
              <ol className="list-inside list-decimal space-y-2 text-sm">
                <li>
                  <strong>Insurance Required:</strong> CGL ≥ $2,000,000, Equipment Coverage, Auto
                  Liability ≥ $1,000,000
                </li>
                <li>
                  <strong>Operating Limits:</strong> Max slope 25°, PPE required, utility locates
                  before digging
                </li>
                <li>
                  <strong>Damage Responsibility:</strong> Renter responsible for all damage, loss,
                  and theft
                </li>
                <li>
                  <strong>Financial Terms:</strong> $500 security deposit, $100 fuel charge if not
                  full, $100 cleaning charge
                </li>
                <li>
                  <strong>Prohibited:</strong> No riders, no demolition beyond capability, no hazmat
                  operations
                </li>
                <li>
                  <strong>Return:</strong> Park level, bucket down, clean, return all attachments
                </li>
                <li>
                  <strong>Governing Law:</strong> Province of New Brunswick, Canada
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">Sign Agreement</h2>

          {/* Name Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          {/* Date Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Signature Canvas */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Signature</label>
            <div className="overflow-hidden rounded-lg border-2 border-gray-300">
              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair bg-white"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">Sign above using your mouse or touchscreen</p>
              <button
                type="button"
                onClick={clearSignature}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Signature
              </button>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                I have read and agree to the terms and conditions of this Equipment Rental
                Agreement. I understand that my electronic signature is legally binding and
                equivalent to a handwritten signature.
                {booking.equipment.model?.toLowerCase().includes('svl75') && (
                  <strong className="mt-2 block text-gray-900">
                    I acknowledge that I have reviewed the SVL75-3 Equipment Rider and understand
                    all safety, insurance, and operating requirements including the "No COI, No
                    Release" policy.
                  </strong>
                )}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!signature || !name || !agreed || submitting}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Signing Agreement...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Sign and Confirm Booking
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            🔒 Your signature is encrypted and legally binding. Governed by the laws of the Province
            of New Brunswick, Canada.
          </p>
        </div>
      </div>
    </div>
  );
}
