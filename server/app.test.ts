import { mocked } from 'ts-jest/utils';
import helmet from 'helmet';
import sharp from 'sharp';
import handle from './handler';
import * as app from './app';

jest.mock('helmet');
jest.mock('sharp');

const expressImpl = {
  get: jest.fn(),
  listen: jest.fn(),
  use: jest.fn(),
};

beforeEach(() => {
  expressImpl.get.mockClear();
  expressImpl.listen.mockClear();
  expressImpl.use.mockClear();
});

describe('libraries', () => {
  it('should disable Sharp cache', () => {
    const spy = jest.spyOn(sharp, 'cache').mockImplementation();

    app.libraries();

    expect(spy).toHaveBeenCalledWith(false);
  });
});

describe('middleware', () => {
  const helmetVal = 'iamhelmet';
  const MockedHelmet = mocked(helmet);
  MockedHelmet.mockReturnValue(<any>helmetVal);

  it('should use helmet', () => {
    app.middleware(<any>expressImpl);

    expect(MockedHelmet).toHaveBeenCalled();
    expect(expressImpl.use).toHaveBeenCalledWith(helmetVal);
  });
});

describe('handler', () => {
  it('should bind image resizing endpoint', () => {
    app.handler(<any>expressImpl);

    expect(expressImpl.get).toHaveBeenCalledWith('/', handle);
  });
});

describe('logStarted', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should output log when run', () => {
    app.logStarted();

    expect(spy).toHaveBeenCalledWith('...started.');
  });
});

describe('run', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should bind image resizing endpoint to port', () => {
    app.run(<any>expressImpl, 1234);

    expect(expressImpl.listen).toBeCalledWith(1234, app.logStarted);
  });

  it('should log port', () => {
    app.run(<any>expressImpl, 5678);

    expect(spy).toHaveBeenCalledWith('Starting server bound to port 5678 (waiting)...');
  });
});
