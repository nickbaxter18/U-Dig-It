'use client';

import type { Database } from '@/supabase/types';

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';

type EquipmentAttachment = Database['public']['Tables']['equipment_attachments']['Row'];

interface AttachmentSelectorProps {
  equipmentModel: string;
  rentalDays: number;
  onAttachmentsSelected: (attachments: SelectedAttachment[]) => void;
  className?: string;
}

export interface SelectedAttachment {
  id: string;
  name: string;
  quantity: number;
  daily_rate: number;
  days_rented: number;
  total: number;
}

export default function AttachmentSelector({
  equipmentModel,
  rentalDays,
  onAttachmentsSelected,
  className = '',
}: AttachmentSelectorProps) {
  const [attachments, setAttachments] = useState<EquipmentAttachment[]>([]);
  const [selected, setSelected] = useState<SelectedAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch compatible attachments
  useEffect(() => {
    async function fetchAttachments() {
      const { data, error } = await supabase
        .from('equipment_attachments')
        .select('*')
        .eq('is_active', true)
        .contains('compatible_models', [equipmentModel])
        .order('attachment_type', { ascending: true })
        .order('daily_rate', { ascending: true });

      if (error) {
        logger.error(
          'Error fetching attachments',
          {
            component: 'AttachmentSelector',
            action: 'fetch_attachments_failed',
            metadata: { equipmentModel },
          },
          error
        );
        setLoading(false);
        return;
      }

      setAttachments(data || []);
      setLoading(false);
    }

    if (equipmentModel) {
      fetchAttachments();
    }
  }, [equipmentModel, supabase]);

  const toggleAttachment = (attachment: EquipmentAttachment) => {
    const existing = selected.find((s) => s.id === attachment.id);

    if (existing) {
      // Remove
      const updated = selected.filter((s) => s.id !== attachment.id);
      setSelected(updated);
      onAttachmentsSelected(updated);
    } else {
      // Add
      const newSelection: SelectedAttachment = {
        id: attachment.id,
        name: attachment.name,
        quantity: 1,
        daily_rate: attachment.daily_rate,
        days_rented: rentalDays,
        total: attachment.daily_rate * rentalDays,
      };
      const updated = [...selected, newSelection];
      setSelected(updated);
      onAttachmentsSelected(updated);
    }
  };

  // Recalculate totals when rental days change
  useEffect(() => {
    if (selected.length > 0) {
      const updated = selected.map((att) => ({
        ...att,
        days_rented: rentalDays,
        total: att.daily_rate * rentalDays,
      }));
      setSelected(updated);
      onAttachmentsSelected(updated);
    }
  }, [rentalDays, selected, onAttachmentsSelected]);

  const totalAttachmentCost = selected.reduce((sum, att) => sum + att.total, 0);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return null; // No compatible attachments
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Equipment Attachments</h3>
        <p className="text-sm text-gray-600 mt-1">
          Enhance your rental with specialized attachments ({rentalDays}{' '}
          {rentalDays === 1 ? 'day' : 'days'})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment) => {
          const isSelected = selected.some((s) => s.id === attachment.id);
          const available =
            (attachment.quantity_available || 0) - (attachment.quantity_in_use || 0);
          const isFree = attachment.daily_rate === 0 || attachment.included_with_rental;
          const totalCost = attachment.daily_rate * rentalDays;

          return (
            <div
              key={attachment.id}
              onClick={() => available > 0 && toggleAttachment(attachment)}
              className={`
                relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-sm'
                }
                ${available === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Free badge */}
              {isFree && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                  INCLUDED FREE
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{attachment.name}</h4>

                  {attachment.description && (
                    <p className="text-sm text-gray-600 mb-2">{attachment.description}</p>
                  )}

                  <div className="space-y-1">
                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-lg font-bold ${isFree ? 'text-green-600' : 'text-gray-900'}`}
                      >
                        {isFree ? 'FREE' : `$${attachment.daily_rate.toFixed(2)}/day`}
                      </span>
                      {!isFree && rentalDays > 1 && (
                        <span className="text-sm text-gray-500">
                          (${totalCost.toFixed(2)} total)
                        </span>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="text-xs">
                      {available > 0 ? (
                        <span className="text-green-600 font-medium">
                          ✓ Available ({available} in stock)
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Out of stock</span>
                      )}
                    </div>

                    {/* Specifications preview */}
                    {attachment.specifications && (
                      <div className="text-xs text-gray-500 mt-2">
                        {typeof attachment.specifications === 'object' && (
                          <div className="space-y-0.5">
                            {Object.entries(attachment.specifications as Record<string, unknown>)
                              .slice(0, 2)
                              .map(([key, value]) => (
                                <div key={key}>
                                  {key.replace(/_/g, ' ')}: {String(value)}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={available === 0}
                    onChange={() => {}} // Handled by parent div onClick
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected attachments summary */}
      {selected.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border-2 border-orange-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Selected Attachments ({selected.length})
          </h4>

          <div className="space-y-2 mb-3">
            {selected.map((att) => (
              <div
                key={att.id}
                className="flex justify-between items-center text-sm bg-white rounded px-3 py-2"
              >
                <span className="text-gray-700">{att.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    ${att.daily_rate.toFixed(2)}/day × {att.days_rented}{' '}
                    {att.days_rented === 1 ? 'day' : 'days'}
                  </span>
                  <span className="font-semibold text-gray-900">${att.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-orange-300 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Attachment Cost:</span>
            <span className="text-2xl font-bold text-orange-600">
              ${totalAttachmentCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Upsell message */}
      {selected.length === 0 && attachments.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">💡 Maximize Your Rental</h4>
              <p className="text-sm text-blue-800">
                Add specialized attachments to handle any job! Popular choices: Hydraulic Auger for
                post holes, Pallet Forks for material handling, or Hydraulic Breaker for concrete
                work.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
