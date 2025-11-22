'use client';

import { X } from 'lucide-react';

import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '6xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
};

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  showCloseButton = true,
  className = '',
  ariaLabelledBy,
  ariaDescribedBy,
}: AdminModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Store previous active element for focus restoration
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus trap: focus the modal
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-20 pb-6 sm:pt-24 sm:pb-8 sm:px-8 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>

      <div
        ref={modalRef}
        className={`relative z-[80] w-full ${maxWidthClasses[maxWidth]} transform overflow-hidden rounded-xl bg-white border border-gray-200/50 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.05)] transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col ${className}`}
        style={{ maxHeight: 'calc(100vh - 144px)' }} // Accounts for 80px header + 64px footer
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-white px-6 py-5 flex-shrink-0">
            {title && (
              <h2 id={ariaLabelledBy} className="text-2xl font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-offset-2 active:scale-95"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content - flex-1 with overflow and padding to ensure buttons are scrollable */}
        <div className="flex-1 overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render to document.body using portal
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
