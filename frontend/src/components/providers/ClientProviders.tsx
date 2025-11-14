'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';
import { ReactNode } from 'react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
    </ErrorBoundary>
  );
}
