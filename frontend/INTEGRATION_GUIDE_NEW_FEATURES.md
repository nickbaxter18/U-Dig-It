# 🔌 **FRONTEND INTEGRATION GUIDE - NEW FEATURES**

**Date**: November 4, 2025
**Purpose**: Code examples for integrating new Supabase features into your Next.js frontend

---

## 📋 **TABLE OF CONTENTS**

1. [Equipment Attachments](#1-equipment-attachments)
2. [Hourly Rental Rates](#2-hourly-rental-rates)
3. [Equipment Categories](#3-equipment-categories)
4. [Operator Certifications](#4-operator-certifications)
5. [Damage Reporting](#5-damage-reporting)
6. [Customer Credit Management](#6-customer-credit-management)
7. [Multi-Location Support](#7-multi-location-support)

---

## **1. EQUIPMENT ATTACHMENTS**

### **Component: Attachment Selection Modal**

```typescript
// frontend/src/components/AttachmentSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/../supabase/types';

type EquipmentAttachment = Database['public']['Tables']['equipment_attachments']['Row'];

interface AttachmentSelectorProps {
  equipmentModel: string;
  rentalDays: number;
  onAttachmentsSelected: (attachments: SelectedAttachment[]) => void;
}

interface SelectedAttachment {
  id: string;
  name: string;
  quantity: number;
  daily_rate: number;
  total: number;
}

export default function AttachmentSelector({
  equipmentModel,
  rentalDays,
  onAttachmentsSelected
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
        console.error('Error fetching attachments:', error);
        return;
      }

      setAttachments(data || []);
      setLoading(false);
    }

    fetchAttachments();
  }, [equipmentModel]);

  const toggleAttachment = (attachment: EquipmentAttachment) => {
    const existing = selected.find(s => s.id === attachment.id);

    if (existing) {
      // Remove
      const updated = selected.filter(s => s.id !== attachment.id);
      setSelected(updated);
      onAttachmentsSelected(updated);
    } else {
      // Add
      const newSelection: SelectedAttachment = {
        id: attachment.id,
        name: attachment.name,
        quantity: 1,
        daily_rate: attachment.daily_rate,
        total: attachment.daily_rate * rentalDays
      };
      const updated = [...selected, newSelection];
      setSelected(updated);
      onAttachmentsSelected(updated);
    }
  };

  const totalAttachmentCost = selected.reduce((sum, att) => sum + att.total, 0);

  if (loading) return <div>Loading attachments...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add Equipment Attachments</h3>
      <p className="text-sm text-gray-600">
        Enhance your rental with specialized attachments ({rentalDays} days)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map(attachment => {
          const isSelected = selected.some(s => s.id === attachment.id);
          const available = (attachment.quantity_available || 0) - (attachment.quantity_in_use || 0);
          const isFree = attachment.daily_rate === 0;

          return (
            <div
              key={attachment.id}
              onClick={() => available > 0 && toggleAttachment(attachment)}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}
                ${available === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{attachment.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-sm font-medium ${isFree ? 'text-green-600' : 'text-gray-900'}`}>
                      {isFree ? 'Included FREE' : `$${attachment.daily_rate}/day`}
                    </span>
                    {!isFree && (
                      <span className="text-xs text-gray-500">
                        (${attachment.daily_rate * rentalDays} total)
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {available > 0 ? (
                      <span className="text-green-600">✓ Available ({available} in stock)</span>
                    ) : (
                      <span className="text-red-600">Out of stock</span>
                    )}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={available === 0}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium mb-2">Selected Attachments</h4>
          {selected.map(att => (
            <div key={att.id} className="flex justify-between text-sm mb-1">
              <span>{att.name}</span>
              <span className="font-medium">${att.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Total Attachment Cost:</span>
            <span className="text-orange-600">${totalAttachmentCost.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

### **Server Action: Save Attachments to Booking**

```typescript
// frontend/src/app/book/actions-attachments.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface AttachmentInput {
  attachment_id: string;
  quantity: number;
  daily_rate: number;
  days_rented: number;
  total_amount: number;
}

export async function addAttachmentsToBooking(
  bookingId: string,
  attachments: AttachmentInput[]
) {
  const supabase = await createClient();

  // Verify user owns this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('customerId')
    .eq('id', bookingId)
    .single();

  const { data: { user } } = await supabase.auth.getUser();

  if (!booking || !user || booking.customerId !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Insert all attachments
  const { data, error } = await supabase
    .from('booking_attachments')
    .insert(
      attachments.map(att => ({
        booking_id: bookingId,
        attachment_id: att.attachment_id,
        quantity: att.quantity,
        daily_rate: att.daily_rate,
        days_rented: att.days_rented,
        total_amount: att.total_amount
      }))
    )
    .select();

  if (error) {
    logger.error('Failed to add attachments to booking', {
      component: 'booking-attachments',
      action: 'insert_failed',
      metadata: { bookingId, error: error.message }
    }, new Error(error.message));
    return { success: false, error: error.message };
  }

  // Update booking total amount
  const attachmentTotal = attachments.reduce((sum, att) => sum + att.total_amount, 0);

  await supabase
    .from('bookings')
    .update({
      totalAmount: supabase.rpc('calculate_new_total', {
        booking_id: bookingId,
        attachment_total: attachmentTotal
      })
    })
    .eq('id', bookingId);

  logger.info('Attachments added to booking successfully', {
    component: 'booking-attachments',
    action: 'attachments_added',
    metadata: {
      bookingId,
      attachment_count: attachments.length,
      attachment_total: attachmentTotal
    }
  });

  return { success: true, data };
}
```

---

## **2. HOURLY RENTAL RATES**

### **Component: Rental Duration Selector**

```typescript
// frontend/src/components/RentalDurationSelector.tsx
'use client';

import { useState } from 'react';

interface RentalRates {
  hourly: number;
  halfDay: number;
  daily: number;
  weekly: number;
  monthly: number;
  minimumHours: number;
}

interface DurationOption {
  value: 'hourly' | 'half-day' | 'daily' | 'weekly' | 'monthly';
  label: string;
  description: string;
  hours?: number;
  days?: number;
  price: number;
  savings?: number;
  bestValue?: boolean;
}

export default function RentalDurationSelector({
  rates,
  onDurationChange
}: {
  rates: RentalRates;
  onDurationChange: (option: DurationOption) => void;
}) {
  const [selectedDuration, setSelectedDuration] = useState<DurationOption['value']>('daily');

  // Calculate all options with savings
  const options: DurationOption[] = [
    {
      value: 'hourly',
      label: 'Hourly',
      description: `${rates.minimumHours}-hour minimum`,
      hours: rates.minimumHours,
      price: rates.hourly * rates.minimumHours,
    },
    {
      value: 'half-day',
      label: 'Half-Day',
      description: '4-8 hours',
      hours: 6,
      price: rates.halfDay,
      savings: (rates.hourly * 6) - rates.halfDay,
      bestValue: rates.halfDay < rates.daily && rates.halfDay < (rates.hourly * 6)
    },
    {
      value: 'daily',
      label: 'Daily',
      description: 'Up to 24 hours',
      days: 1,
      price: rates.daily,
    },
    {
      value: 'weekly',
      label: 'Weekly',
      description: '7 days',
      days: 7,
      price: rates.weekly,
      savings: (rates.daily * 7) - rates.weekly,
      bestValue: true
    },
    {
      value: 'monthly',
      label: 'Monthly',
      description: '30 days',
      days: 30,
      price: rates.monthly,
      savings: (rates.daily * 30) - rates.monthly,
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Rental Duration</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {options.map(option => (
          <div
            key={option.value}
            onClick={() => {
              setSelectedDuration(option.value);
              onDurationChange(option);
            }}
            className={`
              relative border rounded-lg p-4 cursor-pointer transition-all
              ${selectedDuration === option.value
                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                : 'border-gray-200 hover:border-orange-300'
              }
            `}
          >
            {option.bestValue && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                BEST VALUE
              </div>
            )}

            <div className="text-center">
              <div className="font-bold text-lg">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">{option.description}</div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-gray-900">
                  ${option.price.toFixed(2)}
                </div>
                {option.hours && (
                  <div className="text-xs text-gray-500">
                    ${rates.hourly.toFixed(2)}/hour
                  </div>
                )}
                {option.days && (
                  <div className="text-xs text-gray-500">
                    ${(option.price / option.days).toFixed(2)}/day
                  </div>
                )}
              </div>

              {option.savings && option.savings > 0 && (
                <div className="mt-2 text-xs font-medium text-green-600">
                  Save ${option.savings.toFixed(2)}!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick comparison */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pricing Tip</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Need it for 4 hours? Hourly rate = ${(rates.hourly * 4).toFixed(2)}</div>
          <div>• Need it for 6 hours? Half-day = ${rates.halfDay.toFixed(2)} (saves ${((rates.hourly * 6) - rates.halfDay).toFixed(2)}!)</div>
          <div>• Need it for 3 days? Daily = ${(rates.daily * 3).toFixed(2)}</div>
          <div>• Need it for 7+ days? Weekly = ${rates.weekly.toFixed(2)} (saves ${((rates.daily * 7) - rates.weekly).toFixed(2)}!)</div>
        </div>
      </div>
    </div>
  );
}
```

### **API Route: Fetch Equipment with Attachments**

```typescript
// frontend/src/app/api/equipment/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Get equipment
  const { data: equipment, error: equipmentError } = await supabase
    .from('equipment')
    .select('id, model, category_id')
    .eq('id', params.id)
    .single();

  if (equipmentError || !equipment) {
    return NextResponse.json(
      { error: 'Equipment not found' },
      { status: 404 }
    );
  }

  // Get compatible attachments
  const { data: attachments, error: attachmentsError } = await supabase
    .from('equipment_attachments')
    .select('*')
    .eq('is_active', true)
    .or(`compatible_models.cs.{${equipment.model}},compatible_equipment_categories.cs.{${equipment.category_id}}`)
    .order('attachment_type')
    .order('daily_rate');

  if (attachmentsError) {
    return NextResponse.json(
      { error: attachmentsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    equipment,
    attachments: attachments || [],
    count: attachments?.length || 0
  });
}
```

---

## **2. HOURLY RENTAL RATES**

### **Utility: Pricing Calculator**

```typescript
// frontend/src/lib/pricing-calculator.ts
import type { Database } from '@/../supabase/types';

type Equipment = Database['public']['Tables']['equipment']['Row'];

export interface PricingOption {
  type: 'hourly' | 'half-day' | 'daily' | 'weekly' | 'monthly';
  label: string;
  hours?: number;
  days?: number;
  rate: number;
  total: number;
  savings?: number;
  avgDailyRate?: number;
  recommended?: boolean;
}

export function calculatePricingOptions(
  equipment: Equipment,
  startDate: Date,
  endDate: Date
): PricingOption[] {
  const hoursDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const daysDiff = Math.ceil(hoursDiff / 24);

  const options: PricingOption[] = [];

  // Hourly option (if rental < 8 hours)
  if (hoursDiff <= 8 && equipment.hourly_rate) {
    const hours = Math.max(hoursDiff, equipment.minimum_rental_hours || 4);
    options.push({
      type: 'hourly',
      label: 'Hourly',
      hours: Math.ceil(hours),
      rate: equipment.hourly_rate,
      total: equipment.hourly_rate * Math.ceil(hours),
      recommended: hoursDiff <= 4
    });
  }

  // Half-day option (if rental is 4-8 hours)
  if (hoursDiff >= 4 && hoursDiff <= 8 && equipment.half_day_rate) {
    const hourlyEquivalent = equipment.hourly_rate
      ? equipment.hourly_rate * hoursDiff
      : 0;

    options.push({
      type: 'half-day',
      label: 'Half-Day',
      hours: Math.ceil(hoursDiff),
      rate: equipment.half_day_rate,
      total: equipment.half_day_rate,
      savings: hourlyEquivalent > equipment.half_day_rate
        ? hourlyEquivalent - equipment.half_day_rate
        : 0,
      recommended: hoursDiff >= 5 && hoursDiff <= 8
    });
  }

  // Daily option
  if (daysDiff < 7) {
    options.push({
      type: 'daily',
      label: 'Daily',
      days: daysDiff,
      rate: equipment.dailyRate,
      total: equipment.dailyRate * daysDiff,
      avgDailyRate: equipment.dailyRate,
      recommended: daysDiff >= 1 && daysDiff < 7
    });
  }

  // Weekly option (if >= 7 days)
  if (daysDiff >= 7 && daysDiff < 30) {
    const weeks = Math.ceil(daysDiff / 7);
    const dailyEquivalent = equipment.dailyRate * daysDiff;
    const weeklyTotal = equipment.weeklyRate * weeks;

    options.push({
      type: 'weekly',
      label: 'Weekly',
      days: daysDiff,
      rate: equipment.weeklyRate,
      total: weeklyTotal,
      savings: dailyEquivalent - weeklyTotal,
      avgDailyRate: weeklyTotal / daysDiff,
      recommended: daysDiff >= 7 && daysDiff < 30
    });
  }

  // Monthly option (if >= 30 days)
  if (daysDiff >= 30) {
    const months = Math.ceil(daysDiff / 30);
    const dailyEquivalent = equipment.dailyRate * daysDiff;
    const monthlyTotal = equipment.monthlyRate * months;

    options.push({
      type: 'monthly',
      label: 'Monthly',
      days: daysDiff,
      rate: equipment.monthlyRate,
      total: monthlyTotal,
      savings: dailyEquivalent - monthlyTotal,
      avgDailyRate: monthlyTotal / daysDiff,
      recommended: daysDiff >= 30
    });
  }

  return options;
}

export function getRecommendedPricing(
  equipment: Equipment,
  startDate: Date,
  endDate: Date
): PricingOption | null {
  const options = calculatePricingOptions(equipment, startDate, endDate);
  const recommended = options.find(opt => opt.recommended);

  // If no recommended, pick the one with best value (lowest avg daily rate)
  if (!recommended && options.length > 0) {
    return options.reduce((best, current) => {
      const bestAvg = best.avgDailyRate || (best.total / (best.days || best.hours || 1));
      const currentAvg = current.avgDailyRate || (current.total / (current.days || current.hours || 1));
      return currentAvg < bestAvg ? current : best;
    });
  }

  return recommended || options[0] || null;
}
```

### **Usage in Booking Flow**:

```typescript
// In your booking form component
const [startDate, setStartDate] = useState<Date>(new Date());
const [endDate, setEndDate] = useState<Date>(new Date());
const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(null);

useEffect(() => {
  if (equipment && startDate && endDate) {
    const options = calculatePricingOptions(equipment, startDate, endDate);
    const recommended = getRecommendedPricing(equipment, startDate, endDate);
    setSelectedPricing(recommended);
  }
}, [equipment, startDate, endDate]);

// Display pricing
{selectedPricing && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle className="text-green-600" size={20} />
      <span className="font-medium text-green-900">Recommended: {selectedPricing.label}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">
      ${selectedPricing.total.toFixed(2)}
    </div>
    {selectedPricing.savings && selectedPricing.savings > 0 && (
      <div className="text-sm text-green-600 mt-1">
        You save ${selectedPricing.savings.toFixed(2)} vs. daily rate!
      </div>
    )}
  </div>
)}
```

---

## **3. EQUIPMENT CATEGORIES**

### **Component: Category Browser**

```typescript
// frontend/src/components/EquipmentCategoryBrowser.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type EquipmentCategory = Database['public']['Tables']['equipment_categories']['Row'];

export default function EquipmentCategoryBrowser() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
      setLoading(false);
    }

    fetchCategories();
  }, []);

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map(category => (
        <Link
          key={category.id}
          href={`/equipment?category=${category.slug}`}
          className="group"
        >
          <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 hover:shadow-lg transition-all">
            {/* Icon */}
            <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <span className="text-3xl">
                {category.icon_name === 'loader' && '🚜'}
                {category.icon_name === 'excavator' && '🏗️'}
                {category.icon_name === 'forklift' && '🏗️'}
                {category.icon_name === 'tool' && '🔧'}
              </span>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {category.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {category.description}
            </p>

            {/* Applications */}
            {category.typical_applications && category.typical_applications.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 uppercase">
                  Typical Uses:
                </div>
                <div className="flex flex-wrap gap-1">
                  {category.typical_applications.slice(0, 3).map((app, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-4 text-sm font-medium text-orange-600 group-hover:text-orange-700">
              Browse Equipment →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

### **Page: Equipment Catalog with Category Filter**

```typescript
// frontend/src/app/equipment/page.tsx (enhanced)
import { createClient } from '@/lib/supabase/server';
import EquipmentCard from '@/components/EquipmentCard';

export default async function EquipmentPage({
  searchParams
}: {
  searchParams: { category?: string }
}) {
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('equipment')
    .select(`
      *,
      category:category_id (
        id,
        name,
        slug,
        typical_applications
      ),
      location:home_location_id (
        id,
        name,
        city,
        province
      )
    `)
    .eq('status', 'available');

  // Filter by category if provided
  if (searchParams.category) {
    query = query.eq('category.slug', searchParams.category);
  }

  const { data: equipment, error } = await query.order('model');

  if (error) {
    console.error('Error fetching equipment:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {searchParams.category
          ? `${searchParams.category.replace('-', ' ')} Equipment`
          : 'All Equipment'}
      </h1>

      {/* Equipment grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment?.map(item => (
          <EquipmentCard key={item.id} equipment={item} />
        ))}
      </div>

      {equipment?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No equipment available in this category yet.
        </div>
      )}
    </div>
  );
}
```

---

## **4. OPERATOR CERTIFICATIONS**

### **Component: Certification Upload**

```typescript
// frontend/src/components/CertificationUpload.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface CertificationFormData {
  certification_type: string;
  certification_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  document_file?: File;
}

export default function CertificationUpload() {
  const [formData, setFormData] = useState<CertificationFormData>({
    certification_type: 'Heavy Equipment Operator',
    certification_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: ''
  });
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let documentUrl = null;

      // Upload document if provided
      if (formData.document_file) {
        const fileName = `${user.id}/certifications/${Date.now()}-${formData.document_file.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, formData.document_file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(fileName);

        documentUrl = urlData.publicUrl;
      }

      // Insert certification
      const { data, error } = await supabase
        .from('operator_certifications')
        .insert({
          customer_id: user.id,
          certification_type: formData.certification_type,
          certification_number: formData.certification_number,
          issuing_authority: formData.issuing_authority,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date || null,
          document_url: documentUrl,
          is_verified: false // Admin must verify
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Operator certification uploaded', {
        component: 'certification-upload',
        action: 'certification_uploaded',
        metadata: { certificationId: data.id, userId: user.id }
      });

      alert('Certification uploaded successfully! It will be reviewed by our team.');

      // Reset form
      setFormData({
        certification_type: 'Heavy Equipment Operator',
        certification_number: '',
        issuing_authority: '',
        issue_date: '',
        expiry_date: ''
      });
    } catch (error) {
      console.error('Error uploading certification:', error);
      alert('Failed to upload certification. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <h3 className="text-xl font-bold">Upload Operator Certification</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Certification Type</label>
        <select
          value={formData.certification_type}
          onChange={e => setFormData({ ...formData, certification_type: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option>Heavy Equipment Operator</option>
          <option>Excavator Operator</option>
          <option>Skid Steer Operator</option>
          <option>Forklift Operator</option>
          <option>Safety Training</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Certification Number</label>
        <input
          type="text"
          value={formData.certification_number}
          onChange={e => setFormData({ ...formData, certification_number: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="HEO-2024-12345"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Issuing Authority</label>
        <input
          type="text"
          value={formData.issuing_authority}
          onChange={e => setFormData({ ...formData, issuing_authority: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="WorkSafeNB"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Issue Date</label>
          <input
            type="date"
            value={formData.issue_date}
            onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Upload Certificate (PDF or Image)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={e => setFormData({ ...formData, document_file: e.target.files?.[0] })}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Certification'}
      </button>
    </form>
  );
}
```

---

## **5. DAMAGE REPORTING**

### **Component: Damage Report Form**

```typescript
// frontend/src/components/DamageReportForm.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DamageReportForm({ bookingId }: { bookingId: string }) {
  const [formData, setFormData] = useState({
    report_type: 'damage',
    severity: 'minor',
    description: '',
    location_of_incident: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get equipment ID from booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('equipmentId')
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking not found');

      // Create damage report (report_number auto-generated!)
      const { data, error } = await supabase
        .from('damage_reports')
        .insert({
          booking_id: bookingId,
          equipment_id: booking.equipmentId,
          reported_by: user.id,
          report_type: formData.report_type,
          severity: formData.severity,
          description: formData.description,
          location_of_incident: formData.location_of_incident,
          incident_date: new Date().toISOString(),
          repair_status: 'reported'
        })
        .select()
        .single();

      if (error) throw error;

      alert(`Damage report ${data.report_number} created successfully! Our team will review it shortly.`);

      // Reset form
      setFormData({
        report_type: 'damage',
        severity: 'minor',
        description: '',
        location_of_incident: ''
      });
    } catch (error) {
      console.error('Error creating damage report:', error);
      alert('Failed to create damage report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Report Equipment Damage</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Type of Issue</label>
        <select
          value={formData.report_type}
          onChange={e => setFormData({ ...formData, report_type: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="damage">Damage</option>
          <option value="malfunction">Malfunction</option>
          <option value="accident">Accident</option>
          <option value="missing_parts">Missing Parts</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity</label>
        <select
          value={formData.severity}
          onChange={e => setFormData({ ...formData, severity: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="minor">Minor - Cosmetic only</option>
          <option value="moderate">Moderate - Needs attention</option>
          <option value="major">Major - Equipment impaired</option>
          <option value="severe">Severe - Equipment inoperable</option>
          <option value="critical">Critical - Safety hazard</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full border rounded px-3 py-2 h-32"
          placeholder="Describe the damage or issue in detail..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location of Incident</label>
        <input
          type="text"
          value={formData.location_of_incident}
          onChange={e => setFormData({ ...formData, location_of_incident: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="123 Main St, Saint John, NB"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting Report...' : 'Submit Damage Report'}
      </button>

      <p className="text-xs text-gray-500">
        Report number will be auto-generated (DR-YYYYMMDD-####)
      </p>
    </form>
  );
}
```

---

## **6. CUSTOMER CREDIT MANAGEMENT**

### **Component: Credit Application Form**

```typescript
// frontend/src/components/CreditApplicationForm.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CreditApplicationForm() {
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    years_in_business: 1,
    requested_limit: 5000
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('credit_applications')
        .insert({
          customer_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          years_in_business: formData.years_in_business,
          requested_limit: formData.requested_limit,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      alert('Credit application submitted! We will review it within 1-2 business days.');
    } catch (error) {
      console.error('Error submitting credit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Apply for Credit Account</h2>
        <p className="text-gray-600">
          Get approved for NET 30 payment terms and streamlined booking approvals.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Business Name</label>
        <input
          type="text"
          value={formData.business_name}
          onChange={e => setFormData({ ...formData, business_name: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Business Type</label>
        <select
          value={formData.business_type}
          onChange={e => setFormData({ ...formData, business_type: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select type...</option>
          <option value="construction">Construction</option>
          <option value="landscaping">Landscaping</option>
          <option value="excavation">Excavation</option>
          <option value="property_management">Property Management</option>
          <option value="municipality">Municipality/Government</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Years in Business</label>
        <input
          type="number"
          value={formData.years_in_business}
          onChange={e => setFormData({ ...formData, years_in_business: parseInt(e.target.value) })}
          className="w-full border rounded px-3 py-2"
          min="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Requested Credit Limit</label>
        <select
          value={formData.requested_limit}
          onChange={e => setFormData({ ...formData, requested_limit: parseInt(e.target.value) })}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="5000">$5,000</option>
          <option value="10000">$10,000</option>
          <option value="25000">$25,000</option>
          <option value="50000">$50,000</option>
          <option value="100000">$100,000</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Credit Account Benefits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ NET 30 payment terms</li>
          <li>✓ No deposit required (for approved amounts)</li>
          <li>✓ Auto-approved bookings (no wait time!)</li>
          <li>✓ Consolidated monthly billing</li>
          <li>✓ Priority customer support</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting Application...' : 'Submit Credit Application'}
      </button>
    </form>
  );
}
```

### **Server Action: Approve Credit Application (Admin)**

```typescript
// frontend/src/app/admin/credit/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function approveCreditApplication(
  applicationId: string,
  approvedLimit: number,
  paymentTerms: number = 30
) {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin' && userData?.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized' };
  }

  // Get application
  const { data: application } = await supabase
    .from('credit_applications')
    .select('customer_id')
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  // Update application status
  await supabase
    .from('credit_applications')
    .update({
      status: 'approved',
      approved_limit: approvedLimit,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      approval_notes: `Approved by ${user.email} on ${new Date().toLocaleDateString()}`
    })
    .eq('id', applicationId);

  // Update customer account
  const { error } = await supabase
    .from('users')
    .update({
      credit_limit: approvedLimit,
      payment_terms_days: paymentTerms,
      auto_approve_bookings: true,
      requires_deposit: false
    })
    .eq('id', application.customer_id);

  if (error) {
    return { success: false, error: error.message };
  }

  logger.info('Credit application approved', {
    component: 'admin-credit',
    action: 'application_approved',
    metadata: { applicationId, customerId: application.customer_id, approvedLimit, paymentTerms }
  });

  return { success: true };
}
```

---

## **7. MULTI-LOCATION SUPPORT**

### **Component: Location Selector**

```typescript
// frontend/src/components/LocationSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Location = Database['public']['Tables']['locations']['Row'];

export default function LocationSelector({
  onLocationSelected
}: {
  onLocationSelected: (location: Location) => void;
}) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLocations() {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('city');

      if (data) {
        setLocations(data);
        // Auto-select primary location
        const primary = data.find(l => l.is_primary);
        if (primary) {
          setSelected(primary.id);
          onLocationSelected(primary);
        }
      }
    }

    fetchLocations();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Pickup/Delivery Location</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map(location => (
          <div
            key={location.id}
            onClick={() => {
              setSelected(location.id);
              onLocationSelected(location);
            }}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all
              ${selected === location.id
                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                : 'border-gray-200 hover:border-orange-300'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{location.name}</h4>
                {location.is_primary && (
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Primary Location
                  </span>
                )}

                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>{location.address}</div>
                  <div>{location.city}, {location.province} {location.postal_code}</div>
                  {location.phone && <div>📞 {location.phone}</div>}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Service radius: {location.service_radius_km}km
                </div>
              </div>

              <input
                type="radio"
                checked={selected === location.id}
                readOnly
                className="mt-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 **INTEGRATION ROADMAP**

### **Week 1: Attachment System**
1. ✅ Create `AttachmentSelector` component
2. ✅ Add to booking flow after equipment selection
3. ✅ Update booking summary to show attachments
4. ✅ Create `addAttachmentsToBooking` server action
5. ✅ Test end-to-end attachment rental

### **Week 2: Hourly Rates**
1. ✅ Create pricing calculator utility
2. ✅ Update booking form with duration selector
3. ✅ Show pricing comparison (hourly vs half-day vs daily)
4. ✅ Update invoice to show hourly breakdown
5. ✅ Market hourly rentals on homepage

### **Week 3: Categories & Certifications**
1. ✅ Add category browser to homepage
2. ✅ Filter equipment by category
3. ✅ Create certification upload page
4. ✅ Admin certification review UI
5. ✅ Show certification status in profile

### **Week 4: Damage Reporting**
1. ✅ Add damage report button to active bookings
2. ✅ Create damage report form
3. ✅ Admin damage report management UI
4. ✅ Email notifications for new reports
5. ✅ Track repair costs and customer liability

---

## 📚 **HELPER FUNCTIONS**

### **Calculate Booking with Attachments**

```typescript
// frontend/src/lib/booking-calculator.ts
import type { Database } from '@/../supabase/types';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Attachment = Database['public']['Tables']['equipment_attachments']['Row'];

interface BookingCalculation {
  equipment_cost: number;
  attachment_cost: number;
  delivery_fee: number;
  float_fee: number;
  subtotal: number;
  taxes: number;
  total: number;
  breakdown: {
    equipment_daily_rate: number;
    rental_days: number;
    equipment_subtotal: number;
    attachments: Array<{
      name: string;
      daily_rate: number;
      days: number;
      total: number;
    }>;
  };
}

export function calculateBookingWithAttachments(
  equipment: Equipment,
  selectedAttachments: Array<{ attachment: Attachment; quantity: number }>,
  startDate: Date,
  endDate: Date,
  deliveryFee: number,
  floatFee: number,
  taxRate: number = 0.15 // 15% HST in NB
): BookingCalculation {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const rentalDays = Math.max(daysDiff, 1);

  // Equipment cost
  const equipmentCost = equipment.dailyRate * rentalDays;

  // Attachment costs
  const attachmentBreakdown = selectedAttachments.map(({ attachment, quantity }) => ({
    name: attachment.name,
    daily_rate: attachment.daily_rate,
    days: rentalDays,
    total: attachment.daily_rate * rentalDays * quantity
  }));

  const attachmentCost = attachmentBreakdown.reduce((sum, att) => sum + att.total, 0);

  // Calculate totals
  const subtotal = equipmentCost + attachmentCost + deliveryFee + floatFee;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  return {
    equipment_cost: equipmentCost,
    attachment_cost: attachmentCost,
    delivery_fee: deliveryFee,
    float_fee: floatFee,
    subtotal,
    taxes,
    total,
    breakdown: {
      equipment_daily_rate: equipment.dailyRate,
      rental_days: rentalDays,
      equipment_subtotal: equipmentCost,
      attachments: attachmentBreakdown
    }
  };
}
```

---

## 🎨 **UI COMPONENT PLANS**

### **Attachment Rental Flow**:
```
1. Equipment Selection Page
   └─> Show "Available Attachments" section
       └─> Display 6 attachment cards with pricing
       └─> Show availability status
       └─> Allow multi-select

2. Booking Summary
   └─> Show selected attachments
   └─> Show individual attachment costs
   └─> Show total with attachments

3. Invoice/Receipt
   └─> Line item for each attachment
   └─> Total attachment revenue highlighted
```

### **Hourly Rental Flow**:
```
1. Date/Time Selection
   └─> Calculate hours between dates
   └─> Show pricing comparison:
       - Hourly (if < 8 hours)
       - Half-day (if 4-8 hours)
       - Daily (always shown)
       - Weekly (if >= 7 days)
   └─> Highlight recommended option

2. Pricing Display
   └─> Show "Best Value" badge
   └─> Show savings amount
   └─> Show average cost per hour/day

3. Confirmation
   └─> Show selected duration type
   └─> Show hourly breakdown if applicable
```

---

**Next**: Let me create admin dashboard queries and consolidate RLS policies!

