/**
 * ES Module wrapper for process-user-improved.js
 * Allows importing in Next.js API routes
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { processUserImproved } = require('./process-user-improved.js');

export { processUserImproved };
