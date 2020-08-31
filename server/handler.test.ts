import { mocked } from 'ts-jest/utils';
import fetch from 'node-fetch';
import sharp from 'sharp';
import handle from './handler';
import {
  checkAllowedHostname,
  checkMime,
  getFetchOptions,
  passForwardHeaders,
  getResizeOptions,
} from './utils';

jest.mock('node-fetch');
jest.mock('sharp');

jest.mock('./utils', () => {
  const original = jest.requireActual('./utils');

  return {
    checkAllowedHostname: jest.fn().mockReturnValue(true),
    checkMime: jest.fn().mockReturnValue(true),
    getFetchOptions: jest.fn(),
    getImgUrl: original.getImgUrl,
    getRequestUrl: original.getRequestUrl,
    getResizeOptions: jest.fn(),
    passForwardHeaders: jest.fn(),
  };
});

describe('handle', () => {
  const req: any = {};
  const res: any = {
    send: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    req.hostname = 'example.com';
    req.originalUrl = '/?url=https://example.com/';
    req.protocol = 'https';

    res.send.mockClear();
    res.status.mockClear();
    res.type.mockClear();
  });

  it('will error on no ?url', async () => {
    req.originalUrl = '/';

    await handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('Invalid or no image URL specified');
  });

  it('will error if image hostname not allowed', async () => {
    const MockedCheckAllowed = mocked(checkAllowedHostname);
    MockedCheckAllowed.mockReturnValueOnce(false);

    await handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('Not an allowed hostname');
  });

  it('will pass fetch options', async (done) => {
    const fetchOptions: any = {
      somethingToMakeThisUnique: true,
    };
    const MockedFetchOptions = mocked(getFetchOptions);
    MockedFetchOptions.mockReturnValue(fetchOptions);

    const MockedFetch = mocked(fetch);
    async function impl(): Promise<any> {
      try {
        expect(MockedFetch).toHaveBeenCalledTimes(1);
        expect(MockedFetch.mock.calls[0][1] === fetchOptions);
        done();
      } catch (error) {
        done(error);
      }
    }
    MockedFetch.mockImplementation(impl);

    await handle(req, res);
  });

  it('will error if can not fetch', async () => {
    const MockedFetch = mocked(fetch);
    async function impl(): Promise<any> {
      throw new Error();
    }
    MockedFetch.mockImplementation(impl);

    await handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('Could not fetch');
  });

  it('will error if fetch response error code', async () => {
    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(<any>{
      ok: false,
    });

    await handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('Could not fetch: response error');
  });

  it('will error if mime check fails', async () => {
    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(<any>{
      ok: true,
    });

    const MockedMime = mocked(checkMime);
    MockedMime.mockReturnValueOnce(false);

    await handle(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('Unsupported MIME type');
  });

  it('will pass forward headers', async (done) => {
    const fetchRes = <any>{
      ok: true,
      test: 'headers',
    };

    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(fetchRes);

    const MockedPass = mocked(passForwardHeaders);
    function impl(): any {
      try {
        expect(MockedPass).toHaveBeenCalled();
        expect(MockedPass).toHaveBeenCalledWith(fetchRes, res);
        done();
      } catch (error) {
        done(error);
      }
    }
    MockedPass.mockImplementation(impl);

    await handle(req, res);
  });

  it('will pass-through if no width and height', async () => {
    const resizeOptions: any = {
      width: undefined,
      height: undefined,
    };
    const MockedResizeOptions = mocked(getResizeOptions);
    MockedResizeOptions.mockReturnValue(resizeOptions);

    const uniqueVal = 'buffer-passthrough';
    const fetchRes = <any>{
      buffer: jest.fn().mockReturnValue(uniqueVal),
      headers: {
        get(foo: string) {
          return foo;
        },
      },
      ok: true,
    };
    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(fetchRes);

    await handle(req, res);

    expect(fetchRes.buffer).toHaveBeenCalled();

    expect(res.type).toHaveBeenCalledTimes(1);
    expect(res.type).toHaveBeenCalledWith('content-type');
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(uniqueVal);
  });

  it('will pass-through if no width and height (case for type checking & branch checking)', async () => {
    const resizeOptions: any = {
      width: undefined,
      height: undefined,
    };
    const MockedResizeOptions = mocked(getResizeOptions);
    MockedResizeOptions.mockReturnValue(resizeOptions);

    const uniqueVal = 'buffer-passthrough';
    const fetchRes = <any>{
      buffer: jest.fn().mockReturnValue(uniqueVal),
      headers: {
        get(foo: string) {
          // No-op for type checking
          function doNothing(bar: string) {
            return bar;
          }
          doNothing(foo);

          return undefined;
        },
      },
      ok: true,
    };
    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(fetchRes);

    await handle(req, res);

    expect(fetchRes.buffer).toHaveBeenCalled();

    expect(res.type).toHaveBeenCalledTimes(1);
    expect(res.type).toHaveBeenCalledWith('');
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(uniqueVal);
  });

  it('will process image if width option found', async () => {
    const resizeOptions: any = {
      width: true,
      height: undefined,
    };
    const MockedResizeOptions = mocked(getResizeOptions);
    MockedResizeOptions.mockReturnValue(resizeOptions);

    const uniqueVal = 'buffer-processed';
    const fetchRes = <any>{
      buffer: jest.fn().mockReturnValue(uniqueVal),
      ok: true,
    };
    const MockedFetch = mocked(fetch);
    MockedFetch.mockResolvedValue(fetchRes);

    const sharpOutput = <any>{
      data: 'someuniquevalue',
      info: {
        format: 'fmt',
      },
    };
    const sharpImpl = <any>{
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(sharpOutput),
    };
    const MockedSharp = mocked(sharp);
    MockedSharp.mockReturnValue(sharpImpl);

    await handle(req, res);

    expect(fetchRes.buffer).toHaveBeenCalled();

    expect(MockedSharp).toHaveBeenCalledWith(uniqueVal);
    expect(sharpImpl.resize).toHaveBeenCalledWith(resizeOptions);
    expect(sharpImpl.toBuffer).toHaveBeenCalled();

    expect(res.type).toHaveBeenCalledTimes(1);
    expect(res.type).toHaveBeenCalledWith('image/fmt');
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(sharpOutput.data);
  });
});
