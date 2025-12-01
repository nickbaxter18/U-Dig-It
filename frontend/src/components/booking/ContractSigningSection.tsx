/**
 * Contract Signing Section
 * Enhanced contract signing with full Step 4 functionality
 */

'use client';

import { logger } from '@/lib/logger';

import EnhancedContractSigner from '../contracts/EnhancedContractSigner';
import SignedContractDisplay from '../contracts/SignedContractDisplay';

interface ContractSigningSectionProps {
  booking: unknown;
  contract: unknown;
  completedDuringBooking?: boolean;
  onSigned: () => void;
}

export default function ContractSigningSection({
  booking,
  contract,
  completedDuringBooking,
  onSigned,
}: ContractSigningSectionProps) {
  // If contract is already signed, show the detailed signed contract display
  if (contract && (contract.status === 'signed' || contract.status === 'completed' || completedDuringBooking)) {
    if (!contract.id) {
      logger.error(
        'Contract missing ID',
        {
          component: 'ContractSigningSection',
          action: 'contract_missing_id',
        },
        new Error('Contract object exists but missing id field')
      );
      return (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="text-center text-red-600">
            <p>Error: Contract information is incomplete.</p>
          </div>
        </div>
      );
    }
    return <SignedContractDisplay contractId={contract.id} bookingNumber={booking?.bookingNumber || 'N/A'} />;
  }

  // If no contract exists yet, allow signing to create one
  if (!contract || !contract.id) {
    // Contract doesn't exist yet - show signer to create one
    if (!booking?.id) {
      return (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="text-center text-red-600">
            <p>Error: Booking information is missing.</p>
          </div>
        </div>
      );
    }
  }

  // Use the full EnhancedContractSigner from Step 4
  return (
    <div className="mx-auto max-w-4xl">
      <EnhancedContractSigner
        bookingId={booking.id}
        bookingData={{
          bookingNumber: booking.bookingNumber || '',
          equipmentModel:
            `${booking.equipment?.make || ''} ${booking.equipment?.model || ''}`.trim() ||
            'Kubota SVL-75',
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount || 0,
          deliveryAddress: booking.deliveryAddress,
          customerName:
            `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim(),
          customerEmail: booking.customer?.email,
          customerPhone: booking.customer?.phone,
        }}
        onSigned={() => {
          onSigned();
        }}
        onError={(error) => {
          logger.error(
            'Contract signing error',
            {
              component: 'ContractSigningSection',
              action: 'signing_error',
            },
            error instanceof Error ? error : new Error(String(error))
          );
          alert(`Error: ${error}`);
        }}
      />
    </div>
  );
}
