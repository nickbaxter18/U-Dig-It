'use client';

import React, { useEffect, useRef } from 'react';
import { setSafeInnerHTML } from '@/lib/html-sanitizer';

interface SafeHTMLProps {
  html: string;
  className?: string;
  tag?: string;
}

/**
 * Safe HTML component that sanitizes content to prevent XSS attacks
 * and handles TrustedHTML requirements
 */
export default function SafeHTML({ html, className = '', tag: Tag = 'div' }: SafeHTMLProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && html) {
      setSafeInnerHTML(ref.current, html);
    }
  }, [html]);

  return React.createElement(Tag, { ref, className });
}
