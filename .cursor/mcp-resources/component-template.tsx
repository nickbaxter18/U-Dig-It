// Component Template
// Component: {ComponentName}
// Type: {Client|Server}
// Description: {description}

'use client'; // Remove if server component

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface {ComponentName}Props {
  // Add your props here
}

export default function {ComponentName}({ /* props */ }: {ComponentName}Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Add your component logic here

  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add your action logic here

    } catch (err) {
      logger.error('Component action error', { error: err });
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="/* Add your Tailwind classes */">
      {/* Add your JSX here */}
      {error && (
        <div role="alert" className="text-red-600">
          {error}
        </div>
      )}
      {loading && (
        <div aria-live="polite" aria-busy={loading}>
          Loading...
        </div>
      )}
    </div>
  );
}

