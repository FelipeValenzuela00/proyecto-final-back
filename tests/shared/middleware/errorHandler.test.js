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
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
    const logged = consoleSpy.mock.calls[0][0];
    expect(logged).not.toMatch(/\r/);
    expect(logged).not.toMatch(/\n/);
  });

  test('sanitizes CRLF in err.stack log for 5xx errors', () => {
    const err = {
      status: 500,
      message: 'crash',
      stack: 'Error: crash\r\n  at line 1\r\n  at line 2',
    };
    errorHandler(err, makeReq(), makeRes(), jest.fn());
    const stackLog = consoleSpy.mock.calls[1][0];
    expect(stackLog).not.toMatch(/\r/);
    expect(stackLog).not.toMatch(/\n/);
  });

  test('logs stack for 5xx but not for 4xx', () => {
    errorHandler(
      { status: 400, message: 'bad', stack: 'Error: bad\n  at line 1' },
      makeReq(),
      makeRes(),
      jest.fn(),
    );
    const calls4xx = consoleSpy.mock.calls.length;

    consoleSpy.mockClear();

    errorHandler(
      { status: 500, message: 'crash', stack: 'Error: crash\n  at line 1' },
      makeReq(),
      makeRes(),
      jest.fn(),
    );
    const calls5xx = consoleSpy.mock.calls.length;

    expect(calls4xx).toBe(1);
    expect(calls5xx).toBe(2);
  });
});
