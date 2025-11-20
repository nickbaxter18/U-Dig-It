/**
 * Booking Details Summary Card
 * Shows compact overview of booking information
 */

'use client';

interface BookingDetailsCardProps {
  booking: unknown;
}

export default function BookingDetailsCard({ booking }: BookingDetailsCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">📋 Booking Details</h2>

      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 text-gray-600">Booking Number</div>
          <div className="font-semibold text-gray-900">{booking.bookingNumber}</div>
        </div>

        <div className="border-t pt-3">
          <div className="mb-1 text-gray-600">Equipment</div>
          <div className="font-semibold text-gray-900">
            {booking.equipment?.make} {booking.equipment?.model}
          </div>
          <div className="text-xs text-gray-500">Unit: {booking.equipment?.unitId}</div>
        </div>

        <div className="border-t pt-3">
          <div className="mb-1 text-gray-600">Rental Period</div>
          <div className="font-medium text-gray-900">
            {new Date(booking.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-xs text-gray-600">to</div>
          <div className="font-medium text-gray-900">
            {new Date(booking.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        {booking.deliveryAddress && (
          <div className="border-t pt-3">
            <div className="mb-1 text-gray-600">Delivery Address</div>
            <div className="text-gray-900">
              {booking.deliveryAddress}
              {booking.deliveryCity && `, ${booking.deliveryCity}`}
              {booking.deliveryProvince && `, ${booking.deliveryProvince}`}
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="border-t pt-3">
          <div className="mb-3 font-semibold text-gray-900">Invoice Breakdown</div>

          {/* Calculate rental days */}
          {(() => {
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            const rentalDays = Math.ceil(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const dailyRate = booking.equipment?.dailyRate || 450;
            const subtotal = booking.subtotal || dailyRate * rentalDays;
            const deliveryFee = booking.floatFee || booking.deliveryFee || 300;
            const taxes = booking.taxes || (subtotal + deliveryFee) * 0.15;
            const _totalAmount = booking.totalAmount || subtotal + deliveryFee + taxes; // Reserved for future total display

            // Use actual distance and fees from booking
            const actualDistanceKm = booking.distanceKm || 0;
            const includedKm = 30;

            // Calculate what base fee per direction should be based on total floatFee
            const baseFeePerDirection = deliveryFee / 2;
            const expectedBaseFee = 150; // Standard base fee per direction
            // Distance is already rounded to 1 decimal in LocationPicker
            const hasAdditionalMileage = actualDistanceKm > includedKm;
            const extraKm = hasAdditionalMileage ? actualDistanceKm - includedKm : 0;
            const additionalMileageFeePerDirection = hasAdditionalMileage ? extraKm * 3 : 0;

            // Determine what to display
            const displayBaseFee = hasAdditionalMileage ? expectedBaseFee : baseFeePerDirection;

            return (
              <div className="space-y-2 text-xs">
                {/* Equipment Rental */}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Equipment Rental ({rentalDays} {rentalDays === 1 ? 'day' : 'days'} @ $
                    {dailyRate}/day)
                  </span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>

                {/* Transportation & Staging */}
                <div className="border-l-2 border-gray-300 pl-3">
                  <div className="mb-1 text-xs font-medium text-gray-700">
                    Transportation & Staging
                  </div>

                  {/* Delivery Breakdown */}
                  <div className="mb-2 ml-2 space-y-0.5">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span>• Delivery to site:</span>
                      {!hasAdditionalMileage && <span>${baseFeePerDirection.toFixed(2)}</span>}
                    </div>
                    {hasAdditionalMileage && extraKm > 0 && (
                      <div className="ml-3 space-y-0.5 text-gray-600">
                        <div className="flex justify-between text-xs">
                          <span>- Standard mileage:</span>
                          <span>${displayBaseFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>- Additional mileage ({extraKm.toFixed(1)}km × $3):</span>
                          <span>${additionalMileageFeePerDirection.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-0.5 text-xs font-medium text-gray-700">
                          <span>Subtotal:</span>
                          <span>
                            ${(displayBaseFee + additionalMileageFeePerDirection).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup Breakdown */}
                  <div className="ml-2 space-y-0.5">
                    <div className="flex justify-between text-xs font-medium text-gray-700">
                      <span>• Pickup from site:</span>
                      {!hasAdditionalMileage && <span>${baseFeePerDirection.toFixed(2)}</span>}
                    </div>
                    {hasAdditionalMileage && extraKm > 0 && (
                      <div className="ml-3 space-y-0.5 text-gray-600">
                        <div className="flex justify-between text-xs">
                          <span>- Standard mileage:</span>
                          <span>${displayBaseFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>- Additional mileage ({extraKm.toFixed(1)}km × $3):</span>
                          <span>${additionalMileageFeePerDirection.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-300 pt-0.5 text-xs font-medium text-gray-700">
                          <span>Subtotal:</span>
                          <span>
                            ${(displayBaseFee + additionalMileageFeePerDirection).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex justify-between border-t border-gray-400 pt-1 text-xs font-medium">
                    <span>Transport Total:</span>
                    <span>
                      $
                      {(hasAdditionalMileage
                        ? (displayBaseFee + additionalMileageFeePerDirection) * 2
                        : deliveryFee
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Waiver (if applicable) - included in subtotal */}
                {booking.waiver_selected && booking.waiver_rate_cents && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Damage Waiver ({rentalDays} {rentalDays === 1 ? 'day' : 'days'} × $
                      {(booking.waiver_rate_cents / 100).toFixed(2)})
                    </span>
                    <span className="font-medium text-gray-900">
                      ${((booking.waiver_rate_cents / 100) * rentalDays).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Subtotal (Equipment + Transport + Waiver) */}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-gray-900">
                    Subtotal (Equipment + Transport{booking.waiver_selected ? ' + Waiver' : ''})
                  </span>
                  <span className="font-semibold text-gray-900">
                    $
                    {(() => {
                      // ✅ FIX: Use corrected transport fee including additional mileage
                      const correctTransportFee = hasAdditionalMileage
                        ? (displayBaseFee + additionalMileageFeePerDirection) * 2
                        : deliveryFee;
                      return (
                        subtotal +
                        correctTransportFee +
                        (booking.waiver_selected && booking.waiver_rate_cents
                          ? (booking.waiver_rate_cents / 100) * rentalDays
                          : 0)
                      ).toFixed(2);
                    })()}
                  </span>
                </div>

                {/* Coupon Discount - Calculate dynamically */}
                {booking.couponCode &&
                  (() => {
                    // ✅ FIX: Use corrected transport fee including additional mileage
                    const correctTransportFee = hasAdditionalMileage
                      ? (displayBaseFee + additionalMileageFeePerDirection) * 2
                      : deliveryFee;
                    const subtotalBeforeDiscount =
                      subtotal +
                      correctTransportFee +
                      (booking.waiver_selected && booking.waiver_rate_cents
                        ? (booking.waiver_rate_cents / 100) * rentalDays
                        : 0);

                    let discountAmount = 0;
                    if (
                      booking.couponType &&
                      booking.couponValue !== null &&
                      booking.couponValue !== undefined
                    ) {
                      // Calculate dynamically from metadata
                      if (booking.couponType === 'percentage') {
                        discountAmount =
                          subtotalBeforeDiscount * (parseFloat(booking.couponValue) / 100);
                      } else if (
                        booking.couponType === 'fixed' ||
                        booking.couponType === 'fixed_amount'
                      ) {
                        // ✅ FIX: Handle both 'fixed' and 'fixed_amount' (Spin to Win) coupon types
                        discountAmount = Math.min(
                          parseFloat(booking.couponValue),
                          subtotalBeforeDiscount
                        );
                      }
                    } else if (booking.couponDiscount) {
                      // Fallback to stored amount for backwards compatibility
                      discountAmount = parseFloat(booking.couponDiscount);
                    }

                    return discountAmount > 0 ? (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center font-medium">
                            <svg
                              className="mr-1 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Discount ({booking.couponCode}
                            {booking.couponType === 'percentage'
                              ? ` - ${booking.couponValue}%`
                              : ''}
                            )
                          </span>
                          <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
                          <span>Subtotal after discount</span>
                          <span>${(subtotalBeforeDiscount - discountAmount).toFixed(2)}</span>
                        </div>
                      </>
                    ) : null;
                  })()}

                {/* Taxes - Recalculate if discount applied */}
                {(() => {
                  // ✅ FIX: Use corrected transport fee including additional mileage
                  const correctTransportFee = hasAdditionalMileage
                    ? (displayBaseFee + additionalMileageFeePerDirection) * 2
                    : deliveryFee;
                  // Calculate final taxes and total including discount
                  const subtotalBeforeDiscount =
                    subtotal +
                    correctTransportFee +
                    (booking.waiver_selected && booking.waiver_rate_cents
                      ? (booking.waiver_rate_cents / 100) * rentalDays
                      : 0);

                  let discountAmount = 0;
                  if (
                    booking.couponType &&
                    booking.couponValue !== null &&
                    booking.couponValue !== undefined
                  ) {
                    if (booking.couponType === 'percentage') {
                      discountAmount =
                        subtotalBeforeDiscount * (parseFloat(booking.couponValue) / 100);
                    } else if (
                      booking.couponType === 'fixed' ||
                      booking.couponType === 'fixed_amount'
                    ) {
                      discountAmount = Math.min(
                        parseFloat(booking.couponValue),
                        subtotalBeforeDiscount
                      );
                    }
                  }

                  const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;
                  const finalTaxes = subtotalAfterDiscount * 0.15; // 15% HST on discounted amount
                  const finalTotal = subtotalAfterDiscount + finalTaxes;

                  return (
                    <>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">HST (15%)</span>
                        <span className="font-medium text-gray-900">${finalTaxes.toFixed(2)}</span>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between border-t-2 border-gray-300 pt-2">
                        <span className="font-semibold text-gray-900">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </>
                  );
                })()}

                <div className="text-xs text-gray-500">CAD • All taxes included</div>

                {/* Security Deposit Note */}
                <div className="mt-2 rounded bg-yellow-50 p-2 text-xs text-yellow-800">
                  <strong>Note:</strong> A $500 refundable security deposit is required.
                </div>
              </div>
            );
          })()}
        </div>

        {booking.notes && (
          <div className="border-t pt-3">
            <div className="mb-1 text-gray-600">Notes</div>
            <div className="text-xs italic text-gray-900">{booking.notes}</div>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="mb-1 text-gray-600">Created</div>
          <div className="text-gray-900">
            {new Date(booking.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
