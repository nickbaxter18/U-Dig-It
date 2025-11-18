'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/useToast';
import Toast, { ToastProps } from '@/components/Toast';

interface AdminToastContextType {
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const AdminToastContext = createContext<AdminToastContextType | undefined>(undefined);

export function useAdminToast() {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error('useAdminToast must be used within AdminToastProvider');
  }
  return context;
}

interface AdminToastProviderProps {
  children: ReactNode;
}

export function AdminToastProvider({ children }: AdminToastProviderProps) {
  const { toasts, success, error, warning, info, removeToast } = useToast();

  return (
    <AdminToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto" style={{ marginTop: `${index * 8}px` }}>
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

