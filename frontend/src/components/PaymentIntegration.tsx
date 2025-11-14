'use client';

import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { getStripePublishableKey } from '@/lib/stripe/config';
import { formatCurrency } from '@/lib/utils';

// Initialize Stripe promise asynchronously
let stripePromise: Promise<any> | null = null;

async function initializeStripe() {
  if (!stripePromise) {
    const publishableKey = await getStripePublishableKey();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

interface PaymentIntegrationProps {
  amount: number;
  bookingId: string;
  onPaymentSuccess: (paymentIntent: unknown) => void;
  onPaymentError: (error: string) => void;
}

function PaymentForm({
  amount,
  bookingId,
  onPaymentSuccess,
  onPaymentError,
}: PaymentIntegrationProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(true);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onPaymentError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent via API route
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          bookingId,
          currency: 'cad',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      } else {
        onPaymentError('Payment was not successful');
      }
    } catch (error) {
      logger.error(
        'Payment error:',
        { component: 'PaymentIntegration', action: 'error' },
        error instanceof Error ? error : new Error(String(error))
      );
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Payment Details</h3>

      {/* Amount Summary */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">Booking ID</span>
          <span className="font-mono text-sm text-gray-500">{bookingId}</span>
        </div>
      </div>

      {/* Stripe Card Element */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Card Details</h4>

        <div className="rounded-lg border border-gray-300 p-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start space-x-3">
          <svg className="mt-0.5 h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-green-800">Secure Payment</h4>
            <p className="mt-1 text-sm text-green-700">
              Your payment information is encrypted and secure. We use industry-standard SSL
              encryption to protect your data.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
          isProcessing
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </button>

      {/* Payment Methods Logos */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-center space-x-4 text-gray-400">
          <span className="text-sm">We accept:</span>
          <div className="flex items-center space-x-2">
            <span className="text-lg">💳</span>
            <span className="text-sm">Visa</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">💳</span>
            <span className="text-sm">Mastercard</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">💳</span>
            <span className="text-sm">American Express</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentIntegration(props: PaymentIntegrationProps) {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    initializeStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentForm {...props} />
    </Elements>
  );
}
