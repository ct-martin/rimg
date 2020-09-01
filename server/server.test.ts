import { mocked } from 'ts-jest/utils';
import express from 'express';
import * as app from './app';
import * as CONSTANTS from './constants';
import server from './server';

jest.mock('express');
const expressImpl = 'express-somethingunique';
const MockedExpress = mocked(express);
MockedExpress.mockReturnValue(<any>expressImpl);

jest.mock('./constants', () => ({
  get PORT() { return 'abcde'; },
}));
mocked(CONSTANTS); // no-op for import check

jest.mock('./app', () => ({
  handler: jest.fn(),
  libraries: jest.fn(),
  middleware: jest.fn(),
  run: jest.fn(),
}));

describe('Server', () => {
  it('should create an express server', () => {
    server();

    expect(MockedExpress).toHaveBeenCalled();
  });

  it('should call setup functions', () => {
    const MockedApp = mocked(app);

    server();

    expect(MockedApp.handler).toHaveBeenCalledWith(expressImpl);
    expect(MockedApp.libraries).toHaveBeenCalled();
    expect(MockedApp.middleware).toHaveBeenCalledWith(expressImpl);
  });

  it('should start server', () => {
    const MockedApp = mocked(app);

    server();

    expect(MockedApp.run).toHaveBeenCalledWith(expressImpl, 'abcde');
  });
});
