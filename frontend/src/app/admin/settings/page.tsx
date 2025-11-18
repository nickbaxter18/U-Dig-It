// Server component wrapper to prevent prerendering
// This allows us to use export const dynamic = 'force-dynamic'
// which only works in server components, not client components
export const dynamic = 'force-dynamic';

import { SettingsPageClient } from '@/components/admin/SettingsPageClient';

export default function SettingsPage() {
  return <SettingsPageClient />;
}
