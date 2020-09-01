/**
 * Gets port to run server on
 * Tries env vars (in order) PORT, NODE_PORT
 * Fallback of 3000
 * @return string|Number
 */
export function getPort() {
  return process.env.PORT ?? process.env.NODE_PORT ?? 3000;
}

/**
 * Port to run the server on
 * @return string|Number
 */
export const PORT = getPort();

/**
 * Headers to forward from server to client (for caching)
 */
export const FORWARD_HEADERS = [
  'cache-control',
  'expires',
  'last-modified',
  'access-control-allow-origin',
];

/**
 * Parse environment for allowed hostnames
 * Declared as environment variable `ALLOWED_HOSTNAMES`
 * @return string[]|undefined Undefined if unspecified, or Array of strings
 */
export function getAllowedHostnames() {
  return process.env.ALLOWED_HOSTNAMES?.split(',') ?? undefined;
}

/**
 * Array of hostnames allowed to serve data for
 */
export const ALLOWED_HOSTNAMES = getAllowedHostnames();

export default {
  ALLOWED_HOSTNAMES,
  FORWARD_HEADERS,
  PORT,
};
