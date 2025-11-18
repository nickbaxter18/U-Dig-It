/**
 * MSW Server for Node.js Testing Environment
 *
 * Used in unit tests and integration tests running in Node.js (Vitest).
 *
 * @see https://mswjs.io/docs/integrations/node
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create server instance with default handlers
export const server = setupServer(...handlers);

