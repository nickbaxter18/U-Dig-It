import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Growth Metrics - Admin Dashboard',
  description: 'Monitor equipment performance, attachment revenue, and growth KPIs',
};

export default async function GrowthMetricsPage() {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  // Fetch equipment performance data
  const { data: equipmentPerformance } = await supabase
    .from('equipment')
    .select(
      `
      id,
      model,
      unitId,
      status,
      utilization_rate,
      last_rental_date,
      total_rental_days,
      revenue_generated,
      category:category_id (name),
      location:current_location_id (name, city)
    `
    )
    .order('utilization_rate', { ascending: false, nullsFirst: false });

  // Fetch attachment performance
  const { data: _attachmentStats } = (await supabase.rpc(
    'get_attachment_performance' as any
  )) as any;

  // If RPC doesn't exist, fetch manually
  const { data: attachments } = await supabase
    .from('equipment_attachments')
    .select(
      `
      id,
      name,
      attachment_type,
      daily_rate,
      quantity_available,
      quantity_in_use
    `
    )
    .eq('is_active', true)
    .order('attachment_type');

  const usageWindowStart = new Date();
  usageWindowStart.setMonth(usageWindowStart.getMonth() - 6);

  const { data: bookingAttachments } = await supabase
    .from('booking_attachments')
    .select('attachment_id, total_amount, quantity, days_rented, created_at')
    .gte('created_at', usageWindowStart.toISOString());

  // Fetch booking stats with attachments
  const { data: bookingStats } = await supabase
    .from('bookings')
    .select(
      `
      id,
      bookingNumber,
      totalAmount,
      createdAt,
      startDate,
      endDate
    `
    )
    .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .in('status', ['confirmed', 'completed'])
    .order('createdAt', { ascending: false });

  // Calculate rental duration breakdown
  const durationBreakdown = bookingStats?.reduce((acc: unknown, booking: unknown) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);

    if (hours <= 8) {
      acc.hourly = (acc.hourly || 0) + 1;
      acc.hourlyRevenue = (acc.hourlyRevenue || 0) + parseFloat(booking.totalAmount);
    } else if (days < 7) {
      acc.daily = (acc.daily || 0) + 1;
      acc.dailyRevenue = (acc.dailyRevenue || 0) + parseFloat(booking.totalAmount);
    } else if (days < 30) {
      acc.weekly = (acc.weekly || 0) + 1;
      acc.weeklyRevenue = (acc.weeklyRevenue || 0) + parseFloat(booking.totalAmount);
    } else {
      acc.monthly = (acc.monthly || 0) + 1;
      acc.monthlyRevenue = (acc.monthlyRevenue || 0) + parseFloat(booking.totalAmount);
    }

    return acc;
  }, {});

  const totalBookings = bookingStats?.length || 0;

  const attachmentUsageMap = new Map<string, { count: number; revenue: number; days: number }>();

  (bookingAttachments ?? []).forEach((record) => {
    if (!record.attachment_id) return;
    const usage = attachmentUsageMap.get(record.attachment_id) ?? { count: 0, revenue: 0, days: 0 };
    usage.count += record.quantity ?? 1;
    usage.revenue += record.total_amount ?? 0;
    usage.days += record.days_rented ?? 0;
    attachmentUsageMap.set(record.attachment_id, usage);
  });

  const attachmentsWithUsage = (attachments ?? []).map((att) => {
    const usage = attachmentUsageMap.get(att.id) ?? { count: 0, revenue: 0, days: 0 };
    return {
      ...att,
      usageCount: usage.count,
      revenueGenerated: usage.revenue,
      averageDays: usage.count > 0 ? usage.days / usage.count : 0,
    };
  });

  const totalAttachmentRevenue = attachmentsWithUsage.reduce(
    (sum, att) => sum + att.revenueGenerated,
    0
  );
  const totalAttachmentRentals = attachmentsWithUsage.reduce((sum, att) => sum + att.usageCount, 0);
  const averageAttachmentRevenue =
    totalAttachmentRentals > 0 ? totalAttachmentRevenue / totalAttachmentRentals : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Growth Metrics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor new features performance and growth opportunities
        </p>
      </div>

      {/* Equipment Performance */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🚜 Equipment Performance</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipmentPerformance?.map((eq: unknown) => {
                const utilization = eq.utilization_rate || 0;
                const utilizationClass =
                  utilization >= 80
                    ? 'text-green-600 bg-green-100'
                    : utilization >= 60
                      ? 'text-yellow-600 bg-yellow-100'
                      : utilization >= 40
                        ? 'text-orange-600 bg-orange-100'
                        : 'text-red-600 bg-red-100';

                return (
                  <tr key={eq.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{eq.model}</div>
                      <div className="text-sm text-gray-500">{eq.unitId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {eq.category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {eq.location ? `${eq.location.name.substring(0, 20)}...` : 'No location'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${utilizationClass}`}
                      >
                        {utilization.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {eq.total_rental_days || 0} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${(eq.revenue_generated || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          eq.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : eq.status === 'rented'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Attachment Performance */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔧 Equipment Attachments</h2>
        <div className="mb-4 grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Rentals (6 mo)
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{totalAttachmentRentals}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Revenue from Attachments
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              ${totalAttachmentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Avg Revenue per Rental
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              ${averageAttachmentRevenue.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachmentsWithUsage.map((att) => {
            const available = (att.quantity_available || 0) - (att.quantity_in_use || 0);
            const isFree = att.daily_rate === 0;

            return (
              <div key={att.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{att.name}</h3>
                  {isFree && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                      FREE
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{att.attachment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Rate:</span>
                    <span className="font-bold text-gray-900">
                      {isFree ? 'Included' : `$${att.daily_rate.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span
                      className={`font-medium ${available > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {available} / {att.quantity_available}
                    </span>
                  </div>
                </div>

                {/* Usage stats */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Times Rented (6 mo)</span>
                      <span className="font-medium">{att.usageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">${att.revenueGenerated.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Duration</span>
                      <span className="font-medium">
                        {att.averageDays > 0 ? `${att.averageDays.toFixed(1)} days` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rental Duration Breakdown */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">⏱️ Rental Duration Analysis (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Hourly/Half-Day</div>
            <div className="text-3xl font-bold text-gray-900">{durationBreakdown?.hourly || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              ${(durationBreakdown?.hourlyRevenue || 0).toFixed(2)} revenue
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalBookings > 0
                ? `${(((durationBreakdown?.hourly || 0) / totalBookings) * 100).toFixed(1)}% of bookings`
                : '0% of bookings'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Daily (1-6 days)</div>
            <div className="text-3xl font-bold text-gray-900">{durationBreakdown?.daily || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              ${(durationBreakdown?.dailyRevenue || 0).toFixed(2)} revenue
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalBookings > 0
                ? `${(((durationBreakdown?.daily || 0) / totalBookings) * 100).toFixed(1)}% of bookings`
                : '0% of bookings'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Weekly (7-29 days)</div>
            <div className="text-3xl font-bold text-gray-900">{durationBreakdown?.weekly || 0}</div>
            <div className="text-sm text-gray-500 mt-2">
              ${(durationBreakdown?.weeklyRevenue || 0).toFixed(2)} revenue
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalBookings > 0
                ? `${(((durationBreakdown?.weekly || 0) / totalBookings) * 100).toFixed(1)}% of bookings`
                : '0% of bookings'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Monthly (30+ days)</div>
            <div className="text-3xl font-bold text-gray-900">
              {durationBreakdown?.monthly || 0}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              ${(durationBreakdown?.monthlyRevenue || 0).toFixed(2)} revenue
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalBookings > 0
                ? `${(((durationBreakdown?.monthly || 0) / totalBookings) * 100).toFixed(1)}% of bookings`
                : '0% of bookings'}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Insights & Opportunities</h4>
          <div className="space-y-1 text-sm text-blue-800">
            {(durationBreakdown?.hourly || 0) === 0 && (
              <div>
                • 🎯 <strong>Opportunity:</strong> No hourly rentals yet! Market to contractors for
                4-8 hour jobs.
              </div>
            )}
            {totalBookings > 0 && (durationBreakdown?.weekly || 0) / totalBookings > 0.5 && (
              <div>
                • ✅ <strong>Success:</strong>{' '}
                {((durationBreakdown.weekly / totalBookings) * 100).toFixed(0)}% of bookings are
                weekly! Great for revenue.
              </div>
            )}
            {totalBookings > 5 && (
              <div>
                • 📊 Average rental:{' '}
                {(totalBookings > 0
                  ? ((durationBreakdown?.daily || 0) * 3 +
                      (durationBreakdown?.weekly || 0) * 10 +
                      (durationBreakdown?.monthly || 0) * 30) /
                    totalBookings
                  : 0
                ).toFixed(1)}{' '}
                days
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Location Performance */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📍 Location Overview</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Will populate as you add locations */}
            <div className="text-sm text-gray-600">
              <strong>Saint John HQ:</strong>{' '}
              {equipmentPerformance?.filter((eq: unknown) => eq.location?.city === 'Saint John')
                .length || 0}{' '}
              equipment units
            </div>
            <div className="text-xs text-gray-500">
              Multi-location infrastructure ready! Add Moncton or Fredericton locations to expand.
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/equipment?action=add"
            className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-colors"
          >
            <h3 className="font-bold text-lg mb-2">➕ Add Equipment</h3>
            <p className="text-sm opacity-90">Add more units to increase capacity</p>
          </Link>

          <Link
            href="/admin/promotions"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors"
          >
            <h3 className="font-bold text-lg mb-2">🏷️ Manage Discount Codes</h3>
            <p className="text-sm opacity-90">Optimize seasonal offers and promotions</p>
          </Link>

          <Link
            href="/admin/customers"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors"
          >
            <h3 className="font-bold text-lg mb-2">👤 Review Customer Accounts</h3>
            <p className="text-sm opacity-90">Check top customers and recent signups</p>
          </Link>
        </div>
      </section>

      {/* SQL Query Reference */}
      <section className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">📚 Need More Insights?</h3>
        <p className="text-sm text-gray-600">
          Check{' '}
          <code className="bg-gray-200 px-2 py-1 rounded">
            ADMIN_DASHBOARD_QUERIES_NEW_FEATURES.md
          </code>{' '}
          for 15+ ready-to-use SQL queries:
        </p>
        <ul className="mt-2 text-sm text-gray-600 space-y-1 ml-4 list-disc">
          <li>Attachment revenue performance</li>
          <li>Customer credit utilization</li>
          <li>Pending certifications</li>
          <li>Open damage reports</li>
          <li>Growth KPIs and trends</li>
        </ul>
      </section>
    </div>
  );
}
