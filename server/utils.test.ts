import { URL } from 'url';
import { ResizeOptions } from 'sharp';
import { Response as FetchResponse, RequestInit } from 'node-fetch';
import {
  checkAllowedHostname,
  checkMime,
  getDimension,
  getFetchOptions,
  getImgUrl,
  getRequestUrl,
  getResizeOptions,
  passForwardHeaders,
} from './utils';
import * as CONSTANTS from './constants';

jest.mock('./constants', () => {
  const original = jest.requireActual('./constants');

  return {
    FORWARD_HEADERS: original.FORWARD_HEADERS,
    get ALLOWED_HOSTNAMES() { return undefined; },
  };
});

describe('getRequestUrl', () => {
  test('will return a URL from a Request', () => {
    const req: any = {
      hostname: 'example.com',
      originalUrl: '/blog',
      protocol: 'https',
    };
    const url = new URL('https://example.com/blog');
    expect(getRequestUrl(req)).toEqual(url);
  });
});

describe('getImgUrl', () => {
  test('will require a ?url parameter', () => {
    const url = new URL('https://example.com/');
    expect(getImgUrl(url)).toBe(null);
  });
  test('will not error (and will instead prefer first) when multiple a ?url parameter', () => {
    const url = new URL('https://example.com/');
    url.searchParams.append('url', 'https://example.org/');
    url.searchParams.append('url', 'https://example.net/');
    expect(getImgUrl(url)).toEqual(new URL('https://example.org/'));
  });
  test('will require a ?url parameter to have contents', () => {
    const url = new URL('https://example.com/?url');
    expect(getImgUrl(url)).toBe(null);
  });
  test('will require a ?url parameter to be a valid url', () => {
    const url = new URL('https://example.com/?url=example.org');
    expect(getImgUrl(url)).toBe(null);
  });
  test('will return a ?url parameter with a valid url', () => {
    const url = new URL('https://example.com/?url=https://example.org/');
    expect(getImgUrl(url)).toEqual(new URL('https://example.org/'));
  });
});

describe('checkAllowedHostname', () => {
  const spy = jest.spyOn(CONSTANTS.default, 'ALLOWED_HOSTNAMES', 'get');
  test('will pass if no allowlist', () => {
    spy.mockReturnValue(undefined);
    expect(checkAllowedHostname('example.com')).toBe(true);
  });
  test('will fail if not on allowlist', () => {
    spy.mockReturnValue(['example.org']);
    expect(checkAllowedHostname('example.com')).toBe(false);
  });
  test('will pass if on allowlist', () => {
    spy.mockReturnValue(['example.com']);
    expect(checkAllowedHostname('example.com')).toBe(true);
  });
  test('will pass if on allowlist with multiple hostnames', () => {
    spy.mockReturnValue(['example.org', 'example.com']);
    expect(checkAllowedHostname('example.com')).toBe(true);
  });
});

describe('getDimension', () => {
  // Note: takes string and parses for int
  test('will fail if null', () => {
    expect(getDimension(null)).toBe(undefined);
  });
  test('will fail if text', () => {
    expect(getDimension('foo')).toBe(undefined);
  });
  test('will fail if <0', () => {
    expect(getDimension('-1')).toBe(undefined);
  });
  test('will fail if 0', () => {
    expect(getDimension('0')).toBe(undefined);
  });
  test('will return if number >0', () => {
    expect(getDimension('1')).toBe(1);
  });
});

describe('getResizeOptions', () => {
  // Note: takes string and parses for int
  test('will return no width or height if not specified', () => {
    const options: ResizeOptions = {
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will not error (and will instead prefer first) when multiple of the same parameter', () => {
    const options: ResizeOptions = {
      width: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxwidth=100&maxwidth=90');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will return width from ?maxwidth', () => {
    const options: ResizeOptions = {
      width: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxwidth=100');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will return width from ?width', () => {
    const options: ResizeOptions = {
      width: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?width=100');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will prefer ?maxwidth over ?width', () => {
    const options: ResizeOptions = {
      width: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxwidth=100&width=90');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will return height from ?maxheight', () => {
    const options: ResizeOptions = {
      height: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxheight=100');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will return height from ?height', () => {
    const options: ResizeOptions = {
      height: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?height=100');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('will prefer ?maxheight over ?height', () => {
    const options: ResizeOptions = {
      height: 100,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxheight=100&height=90');
    expect(getResizeOptions(url)).toEqual(options);
  });
  test('can return both a width and height', () => {
    const options: ResizeOptions = {
      height: 100,
      width: 90,
      withoutEnlargement: true,
    };
    const url = new URL('https://example.com/?maxheight=100&maxwidth=90');
    expect(getResizeOptions(url)).toEqual(options);
  });
});

describe('checkMime', () => {
  test('require content-type header', () => {
    const res = new FetchResponse();
    expect(checkMime(res)).toBe(false);
  });
  test('require well-formed content-type header', () => {
    const res = new FetchResponse();
    res.headers.set('content-type', '');
    expect(checkMime(res)).toBe(false);
    res.headers.set('content-type', 'image');
    expect(checkMime(res)).toBe(false);
  });
  test('require "image" content-type', () => {
    const res = new FetchResponse();
    res.headers.set('content-type', 'application/json');
    expect(checkMime(res)).toBe(false);
  });
  test('require sharp-supported content-type', () => {
    const res = new FetchResponse();
    res.headers.set('content-type', 'image/foobar');
    expect(checkMime(res)).toBe(false);
  });
  test('require buffer-supported content-type', () => {
    const res = new FetchResponse();
    res.headers.set('content-type', 'image/vips');
    expect(checkMime(res)).toBe(false);
  });
  test('pass valid content-type', () => {
    const res = new FetchResponse();
    res.headers.set('content-type', 'image/jpeg');
    expect(checkMime(res)).toBe(true);
  });
});

describe('getFetchOptions', () => {
  test('will return no referer if not on original request', () => {
    const req: any = {
      headers: {},
    };
    const options: RequestInit = {};
    expect(getFetchOptions(req)).toEqual(options);
  });
  test('will return referer if on original request', () => {
    const req: any = {
      headers: {
        referer: 'foobar',
      },
    };
    const options: RequestInit = {
      headers: {
        referer: 'foobar',
      },
    };
    expect(getFetchOptions(req)).toEqual(options);
  });
});

describe('passForwardHeaders', () => {
  const ALLOWED_HEADER = CONSTANTS.FORWARD_HEADERS[0];

  test('will not copy headers not in forwardHeaders', () => {
    const fetchRes = new FetchResponse();
    fetchRes.headers.set('x-foobar', 'baz');
    const expressRes: any = {
      set: jest.fn(),
    };
    passForwardHeaders(fetchRes, expressRes);
    expect(expressRes.set.mock.calls.length).toBe(0);
  });
  test('will not copy headers not in forwardHeaders', () => {
    const fetchRes = new FetchResponse();
    fetchRes.headers.set(ALLOWED_HEADER, 'foo');
    const expressRes: any = {
      set: jest.fn(),
    };
    passForwardHeaders(fetchRes, expressRes);
    expect(expressRes.set.mock.calls.length).toBe(1);
    expect(expressRes.set.mock.calls[0]).toEqual([ALLOWED_HEADER, 'foo']);
  });
  test('will be case insensitive', () => {
    const fetchRes = new FetchResponse();
    fetchRes.headers.set(ALLOWED_HEADER.toUpperCase(), 'foo');
    const expressRes: any = {
      set: jest.fn(),
    };
    passForwardHeaders(fetchRes, expressRes);
    expect(expressRes.set.mock.calls.length).toBe(1);
    expect(expressRes.set.mock.calls[0]).toEqual([ALLOWED_HEADER, 'foo']);
  });
});
