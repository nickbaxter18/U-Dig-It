/**
 * Contract Signing Section
 * Enhanced contract signing with full Step 4 functionality
 */

'use client';

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
  if (contract?.status === 'signed' || contract?.status === 'completed' || completedDuringBooking) {
    return <SignedContractDisplay contractId={contract.id} bookingNumber={booking.bookingNumber} />;
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
