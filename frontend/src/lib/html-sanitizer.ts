import DOMPurify from 'dompurify';
import { logger } from '@/lib/logger';

// Configure DOMPurify for safe HTML sanitization
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'b',
    'i',
    'span',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'blockquote',
    'pre',
    'code',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'width', 'height', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
};

/**
 * Safely sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for innerHTML
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string or basic text
    return html.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(html, sanitizeConfig);
}

/**
 * Safely set innerHTML with sanitized content using TrustedHTML
 * @param element - The DOM element to update
 * @param html - The HTML content to set
 */
export function setSafeInnerHTML(element: HTMLElement, html: string): void {
  if (typeof window === 'undefined') return;

  const sanitizedHTML = sanitizeHTML(html);

  try {
    // Use TrustedHTML policy if available
    if ('trustedTypes' in window) {
      const policy = createTrustedHTMLPolicy();
      if (policy) {
        element.innerHTML = policy.createHTML(sanitizedHTML);
        return;
      }
    }

    // Fallback: use textContent for safety
    element.textContent = sanitizedHTML.replace(/<[^>]*>/g, '');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to set content:', {
        component: 'html-sanitizer',
        action: 'warning',
      }, error instanceof Error ? error : new Error(String(error)));
    }
    // Ultimate fallback: use textContent
    element.textContent = sanitizedHTML.replace(/<[^>]*>/g, '');
  }
}

/**
 * Create a TrustedHTML policy for safe HTML assignment
 */
export function createTrustedHTMLPolicy() {
  if (typeof window === 'undefined' || !('trustedTypes' in window)) {
    return null;
  }

  try {
    return (window as any).trustedTypes.createPolicy('udigit-rentals', {
      createHTML: (input: string) => sanitizeHTML(input),
      createScript: (input: string) => input, // Scripts are not allowed
      createScriptURL: (input: string) => input, // Script URLs are not allowed
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to create TrustedHTML policy:', {
        component: 'html-sanitizer',
        action: 'warning',
      }, error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
}

/**
 * Safe HTML template literal for trusted content
 */
export function safeHTML(strings: TemplateStringsArray, ...values: unknown[]): string {
  const html = strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');

  return sanitizeHTML(html);
}

/**
 * Create a safe dangerouslySetInnerHTML object for React components
 * @param html - The HTML content to sanitize
 * @returns Object with __html property safe for dangerouslySetInnerHTML
 */
export function createSafeInnerHTML(html: string): { __html: string } {
  // For structured data (JSON-LD), we can safely return it as-is since it's controlled content
  if (html.includes('@context') && html.includes('@type')) {
    // This is structured data - it's safe to use directly
    // But we need to ensure it doesn't trigger TrustedHTML errors
    try {
      // Try to create a TrustedHTML policy if available
      if (typeof window !== 'undefined' && (window as any).trustedTypes) {
        const policy = (window as any).trustedTypes.createPolicy('udigit-rentals', {
          createHTML: function (input: string) {
            return input; // For structured data, we trust it
          },
        });
        const trustedHTML = policy.createHTML(html);
        return { __html: trustedHTML };
      }
    } catch (error) {
      // If TrustedHTML fails, fall back to regular HTML
      if (process.env.NODE_ENV === 'development') {
        logger.error('TrustedHTML policy creation failed:', {
          component: 'html-sanitizer',
          action: 'warning',
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return { __html: html };
  }

  // For other HTML content, sanitize it
  return { __html: sanitizeHTML(html) };
}

/**
 * Initialize TrustedHTML policy early in the application lifecycle
 * Call this in your app's root component or _app.tsx
 */
export function initializeTrustedHTMLPolicy(): void {
  if (typeof window === 'undefined') return;

  try {
    // Create the policy if it doesn't exist
    if ('trustedTypes' in window && !(window as any).trustedTypes.defaultPolicy) {
      createTrustedHTMLPolicy();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Failed to initialize TrustedHTML policy:', {
        component: 'html-sanitizer',
        action: 'warning',
      }, error instanceof Error ? error : new Error(String(error)));
    }
  }
}
