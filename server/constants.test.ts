import {
  FORWARD_HEADERS,
  getAllowedHostnames,
  getPort,
} from './constants';

describe('FORWARD_HEADERS', () => {
  test('is an array', () => {
    expect(Array.isArray(FORWARD_HEADERS)).toBe(true);
  });
});

describe('getPort', () => {
  // https://stackoverflow.com/questions/48033841/test-process-env-with-jest
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('will get from PORT', () => {
    process.env.PORT = '1';
    expect(getPort()).toBe('1');
  });
  test('will get from NODE_PORT', () => {
    process.env.NODE_PORT = '2';
    expect(getPort()).toBe('2');
  });
  test('will default to 3000', () => {
    expect(getPort()).toBe(3000);
  });
});

describe('getAllowedHostnames', () => {
  // https://stackoverflow.com/questions/48033841/test-process-env-with-jest
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('will pass if no allowlist', () => {
    process.env.ALLOWED_HOSTNAMES = undefined;
    expect(getAllowedHostnames()).toBe(undefined);
  });
  test('will fail if not on allowlist', () => {
    process.env.ALLOWED_HOSTNAMES = 'example.org';
    expect(getAllowedHostnames()).toEqual(['example.org']);
  });
  test('will pass if on allowlist', () => {
    process.env.ALLOWED_HOSTNAMES = 'example.com';
    expect(getAllowedHostnames()).toEqual(['example.com']);
  });
  test('will pass if on allowlist with multiple hostnames', () => {
    process.env.ALLOWED_HOSTNAMES = 'example.org,example.com';
    expect(getAllowedHostnames()).toEqual(['example.org', 'example.com']);
  });
});
