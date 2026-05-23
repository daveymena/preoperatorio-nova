/**
 * ES Module wrapper for db.js
 * Allows importing db functions in Next.js API routes
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dbModule = require('./db.js');

export const { db, isPostgres, all, get, run } = dbModule;
