jest.mock('../../../src/shared/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const logger = require('../../../src/shared/utils/logger');
const errorHandler = require('../../../src/shared/middleware/errorHandler');

const makeReq = (overrides = {}) => ({
  method: 'GET',
  path: '/test',
  ...overrides,
});

const makeRes = (overrides = {}) => ({
  headersSent: false,
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.body = data;
    return this;
  },
  ...overrides,
});

describe('errorHandler', () => {
  beforeEach(() => {
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
  });

  test('defaults to status 500 when err.status is absent', () => {
    const res = makeRes();
    errorHandler({ message: 'oops' }, makeReq(), res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body.error.status).toBe(500);
  });

  test('4xx: forwards err.message to the client', () => {
    const res = makeRes();
    errorHandler({ status: 404, message: 'Not Found' }, makeReq(), res, jest.fn());
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Not Found');
  });

  test('5xx: returns "Internal Server Error" regardless of actual message', () => {
    const res = makeRes();
    errorHandler({ status: 503, message: 'Database down' }, makeReq(), res, jest.fn());
    expect(res.body.error.message).toBe('Internal Server Error');
  });

  test('delegates to next and skips response when headers already sent', () => {
    const res = makeRes({ headersSent: true });
    const next = jest.fn();
    const err = new Error('late error');
    errorHandler(err, makeReq(), res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.body).toBeNull();
  });

  test('sanitizes CRLF in method, path and message before logging', () => {
    const req = makeReq({ method: 'GET\r\nINJECTED', path: '/foo\r\nbar' });
    errorHandler({ status: 400, message: 'bad\r\ninput' }, req, makeRes(), jest.fn());
    const [message, meta] = logger.warn.mock.calls[0];
    expect(message).not.toMatch(/[\r\n]/);
    expect(meta.method).not.toMatch(/[\r\n]/);
    expect(meta.path).not.toMatch(/[\r\n]/);
    expect(meta.message).not.toMatch(/[\r\n]/);
  });

  test('sanitizes CRLF in err.stack log for 5xx errors', () => {
    const err = {
      status: 500,
      message: 'crash',
      stack: 'Error: crash\r\n  at line 1\r\n  at line 2',
    };
    errorHandler(err, makeReq(), makeRes(), jest.fn());
    const [, meta] = logger.error.mock.calls[0];
    expect(meta.stack).not.toMatch(/[\r\n]/);
  });

  test('5xx logs with logger.error; 4xx logs with logger.warn', () => {
    errorHandler(
      { status: 400, message: 'bad', stack: 'Error: bad\n  at line 1' },
      makeReq(),
      makeRes(),
      jest.fn(),
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();

    logger.warn.mockClear();
    logger.error.mockClear();

    errorHandler(
      { status: 500, message: 'crash', stack: 'Error: crash\n  at line 1' },
      makeReq(),
      makeRes(),
      jest.fn(),
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
