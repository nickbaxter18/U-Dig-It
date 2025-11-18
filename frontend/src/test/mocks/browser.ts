/**
 * MSW Browser for Development/Storybook
 *
 * Used in browser environments (Storybook, dev server).
 * Intercepts network requests in the browser.
 *
 * @see https://mswjs.io/docs/integrations/browser
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create browser worker instance with default handlers
export const worker = setupWorker(...handlers);

