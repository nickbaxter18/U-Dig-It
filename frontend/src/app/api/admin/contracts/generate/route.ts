import { logger } from '@/lib/logger';
import { contractNumberFromBooking } from '@/lib/utils';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/contracts/generate
 * Generate a contract from a booking
 *
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    

    // Get user for logging

    const { data: { user } } = await supabase.auth.getUser();

    // 2. Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id || 'unknown')
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // 3. Parse request
    const body = await request.json();
    const { bookingId, templateType = 'rental_agreement' } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // 4. Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        bookingNumber,
        startDate,
        endDate,
        subtotal,
        deliveryFee,
        "floatFee",
        taxes,
        totalAmount,
        waiver_selected,
        waiver_rate_cents,
        deliveryAddress,
        deliveryCity,
        deliveryProvince,
        deliveryPostalCode,
        customer:customerId (
          id,
          firstName,
          lastName,
          email,
          phone,
          address,
          city,
          province,
          postalCode
        ),
        equipment:equipmentId (
          make,
          model,
          serialNumber
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Type assertion for nested Supabase query
    const bookingData: any = booking;

    // 5. Get template
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Contract template not found' }, { status: 404 });
    }

    // 6. Generate contract number
    const contractNumber = contractNumberFromBooking(bookingData.bookingNumber);

    // 7. Calculate rental days
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 8. Calculate waiver fee
    const waiverFee = bookingData.waiver_selected && bookingData.waiver_rate_cents
      ? (bookingData.waiver_rate_cents / 100) * rentalDays
      : 0;

    // 9. Prepare template variables
    const customer = bookingData.customer || {};
    const equipment = bookingData.equipment || {};

    const variables = {
      contractNumber,
      currentDate: new Date().toLocaleDateString('en-CA'),
      customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A',
      customerEmail: customer.email || 'N/A',
      customerPhone: customer.phone || 'N/A',
      customerAddress: `${bookingData.deliveryAddress || customer.address || ''}, ${bookingData.deliveryCity || customer.city || ''}, ${bookingData.deliveryProvince || customer.province || ''} ${bookingData.deliveryPostalCode || customer.postalCode || ''}`.trim(),
      equipmentMake: equipment.make || 'Kubota',
      equipmentModel: equipment.model || 'SVL-75',
      equipmentSerial: equipment.serialNumber || 'TBD',
      startDate: startDate.toLocaleDateString('en-CA'),
      endDate: endDate.toLocaleDateString('en-CA'),
      dailyRate: '450.00',
      rentalDays: rentalDays.toString(),
      subtotal: parseFloat(bookingData.subtotal || '0').toFixed(2),
      deliveryFee: parseFloat(bookingData.deliveryFee || bookingData.floatFee || '0').toFixed(2),
      waiverFee: waiverFee.toFixed(2),
      taxes: parseFloat(bookingData.taxes || '0').toFixed(2),
      totalAmount: parseFloat(bookingData.totalAmount || '0').toFixed(2),
    };

    // 10. Replace template variables
    let generatedContent = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      generatedContent = generatedContent.replace(regex, value);
    });

    // 11. Create contract record
    const { data: newContract, error: createError } = await supabase
      .from('rental_contracts')
      .insert({
        bookingId,
        template_id: template.id,
        contract_number: contractNumber,
        contract_type: templateType,
        status: 'draft',
        generated_content: generatedContent,
        signer_email: customer.email,
        signer_name: variables.customerName,
        created_by: user?.id || 'unknown',
      })
      .select()
      .single();

    if (createError) throw createError;

    // 12. Log audit trail
    await supabase.from('audit_logs').insert({
      table_name: 'contracts',
      record_id: newContract.id,
      action: 'generate',
      user_id: user?.id || 'unknown',
      new_values: {
        contract_number: contractNumber,
        booking_id: bookingId,
        status: 'draft',
      },
      metadata: {
        action_type: 'contract_generated',
      },
    });

    logger.info('Contract generated successfully', {
      component: 'admin-contracts-api',
      action: 'contract_generated',
      metadata: {
        contractId: newContract.id,
        contractNumber,
        bookingId,
      },
    });

    return NextResponse.json({
      success: true,
      contract: newContract,
      contractNumber,
    });
  } catch (error: any) {
    logger.error('Contract generation error', {
      component: 'admin-contracts-api',
      action: 'error',
    }, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}







