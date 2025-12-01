import { Metadata } from 'next';

import { requireAdminServer } from '@/lib/supabase/requireAdminServer';
import { type DateRange } from '@/lib/admin/analytics-server';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  description: 'Comprehensive analytics and insights for your rental business performance.',
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { dateRange?: string };
}) {
  // Verify admin access (throws redirect/notFound if not admin)
  await requireAdminServer();

  const dateRange = (searchParams?.dateRange as DateRange) || 'month';

  // Client will fetch data on mount via API route - no server-side fetching
  return (
    <AnalyticsDashboardClient
      initialData={null}
      initialError={null}
      initialDateRange={dateRange}
    />
  );
}
