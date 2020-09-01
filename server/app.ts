import { Application } from 'express';
import helmet from 'helmet';
import sharp from 'sharp';
import handle from './handler';

/**
 * Set up libraries
 */
export function libraries() {
  // Disable sharp cache (see README)
  sharp.cache(false);
}

/**
 * Bind middlewares
 * @param app Express
 */
export function middleware(app: Application) {
  app.use(helmet());
}

/**
 * Bind handlers
 * @param app Express
 */
export function handler(app: Application) {
  // Image resizing endpoint
  app.get('/', handle);
}

/**
 * Notify server finished starting
 */
export function logStarted() {
  console.log('...started.');
}

/**
 * Start server
 * @param app Express
 * @param port Port to listen on
 */
export function run(app: Application, port: string|Number) {
  console.log(`Starting server bound to port ${port} (waiting)...`);
  app.listen(port, logStarted);
}
