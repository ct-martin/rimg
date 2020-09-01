import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fetch from 'node-fetch';
import sharp from 'sharp';
import {
  checkAllowedHostname,
  checkMime,
  getFetchOptions,
  getImgUrl,
  getRequestUrl,
  getResizeOptions,
  passForwardHeaders,
} from './utils';

export default async function handle(request: ExpressRequest, res: ExpressResponse) {
  // Get request URL
  const url = getRequestUrl(request);

  // Get URL of image from ?url
  const imgUrl = getImgUrl(url);

  // Error if invalid url
  if (imgUrl === null) {
    res.status(400).send('Invalid or no image URL specified');
    return;
  }

  // Error if not on valid list
  if (!checkAllowedHostname(imgUrl.hostname)) {
    res.status(400).send('Not an allowed hostname');
    return;
  }

  // Get resizing options
  const options = getResizeOptions(url);

  // Fetch image, passing referer to prevent hotlink bypass
  const fetchOptions = getFetchOptions(request);
  try {
    const imgFetch = await fetch(imgUrl, fetchOptions);

    // Fail if error response to fetch
    if (!imgFetch.ok) {
      res.status(500).send('Could not fetch: response error');
      return;
    }

    // Fail if invalid or unsupported MIME type
    if (!checkMime(imgFetch)) {
      res.status(500).send('Unsupported MIME type');
      return;
    }

    // Copy caching & security headers from fetch() response to Express response
    passForwardHeaders(imgFetch, res);

    // Get image data as buffer
    // Note: this would be .arrayBuffer() in a browser, but need Buffer type b/c Node/Sharp
    // (.buffer() is not part of the Fetch API spec but node-fetch adds it for this reason)
    const imgBuffer = await imgFetch.buffer();

    // If not resizing, pass through
    if (!options.width && !options.height) {
      res
        .type(imgFetch.headers.get('content-type') ?? '') // for TypeError; MIME has already been checked so this is ok
        .send(imgBuffer);
      return;
    }

    // Resize image
    const { data, info } = await sharp(imgBuffer)
      .resize(options)
      .toBuffer({ resolveWithObject: true });

    // Send image
    res.type(`image/${info.format}`).send(data);
  } catch (err) {
    res.status(500).send('Could not fetch');
  }
}
