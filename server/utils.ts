import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import sharp, { ResizeOptions, AvailableFormatInfo } from 'sharp';
import { URL } from 'url';
import { Response as FetchResponse, RequestInit } from 'node-fetch';

// Headers to forward from server to client (for caching)
export const forwardHeaders = [
  'cache-control',
  'expires',
  'last-modified',
  'access-control-allow-origin',
];

/**
 * Converts an Express Request into its URL parts
 * @param request Express Request
 */
export function getRequestUrl(request: ExpressRequest): URL {
  return new URL(request.originalUrl, `${request.protocol}://${request.hostname}`);
}

/**
 * Looks for a ?url parameter and returns a URL, or null if ?url is missing or not a valid url
 * @param url URL to parse
 * @returns URL, or null if error
 */
export function getImgUrl(url: URL): URL | null {
  try {
    const urlParam = url.searchParams.get('url') ?? '';
    return new URL(urlParam);
  } catch (e) {
    return null;
  }
}

/**
 * Takes searchparams and parses for valid size dimension
 * @param param searchParam
 * @returns Number, or undefined if error
 */
export function getDimension(param: string|null): number|undefined {
  // if param is undefined, fail
  if (typeof param !== 'string') {
    return undefined;
  }

  const num = Number.parseInt(param, 10);

  // Fail if not number
  if (Number.isNaN(num)) {
    return undefined;
  }

  // Fail if not >0
  if (num <= 0) {
    return undefined;
  }

  return num;
}

/**
 * Gets resizing options from URL
 * @param url URL to search
 */
export function getResizeOptions(url: URL): ResizeOptions {
  // Base resize settings
  const options: ResizeOptions = {
    withoutEnlargement: true, // do not resize to larger than original
  };

  // Copy parameters from query string to options.
  const widthParam = getDimension(url.searchParams.get('maxwidth') ?? url.searchParams.get('width'));
  if (widthParam) {
    options.width = widthParam;
  }
  const heightParam = getDimension(url.searchParams.get('maxheight') ?? url.searchParams.get('height'));
  if (heightParam) {
    options.height = heightParam;
  }

  return options;
}

/**
 * Checks fetch() for valid MIME type
 * @param imgFetch Response from fetch()
 * @returns boolean
 */
export function checkMime(imgFetch: FetchResponse): boolean {
  // Get MIME type
  const mimeRaw = imgFetch.headers.get('content-type');
  if (mimeRaw === null) {
    return false;
  }
  const mime = mimeRaw.split(';')[0];

  // Reject if not image
  if (mime.split('/').length !== 2) {
    return false;
  }
  const [maintype, subtype] = mime.split('/');
  if (maintype !== 'image') {
    return false;
  }

  // Reject if format is not supported by sharp or by sharp via buffer
  let supported = false;
  Object.values(sharp.format).forEach((i: AvailableFormatInfo) => {
    if (i.id === subtype && i.input.buffer) {
      supported = true;
    }
  });
  if (!supported) {
    return false;
  }

  return true;
}

/**
 * Passes referer header to respect anti-hotlinking
 * @param request Express Request
 * @returns fetch() options
 */
export function getFetchOptions(request: ExpressRequest): RequestInit {
  const fetchOptions: RequestInit = {};
  if (request.headers.referer) {
    fetchOptions.headers = {
      referer: request.headers.referer,
    };
  }
  return fetchOptions;
}

/**
 * Copies headers in `fetchHeaders` from fetch() response to Express response
 * Used to copy forward caching & security headers
 * @param imgFetch Fetch response
 * @param res Express response
 */
export function passForwardHeaders(imgFetch: FetchResponse, res: ExpressResponse) {
  imgFetch.headers.forEach((value, name) => {
    if (forwardHeaders.includes(name)) {
      res.set(name, value);
    }
  });
}
