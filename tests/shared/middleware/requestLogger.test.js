const requestLogger = require('../../../src/shared/middleware/requestLogger');

const makeReq = (path = '/test', method = 'GET') => ({ path, method });

const makeRes = (statusCode = 200) => {
  let finishCallback = null;
  return {
    statusCode,
    once: jest.fn((event, cb) => {
      if (event === 'finish') finishCallback = cb;
    }),
    trigger: () => finishCallback && finishCallback(),
  };
};

describe('requestLogger', () => {
  let logSpy, warnSpy, errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('/health skips logging — no finish listener registered', () => {
    const req = makeReq('/health');
    const res = makeRes();
    const next = jest.fn();
    requestLogger(req, res, next);
    expect(res.once).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  test('logs method, path, status and duration on finish', () => {
    const req = makeReq('/api/users', 'POST');
    const res = makeRes(201);
    requestLogger(req, res, jest.fn());
    res.trigger();
    expect(logSpy).toHaveBeenCalledTimes(1);
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toMatch(/POST/);
    expect(logged).toMatch(/\/api\/users/);
    expect(logged).toMatch(/201/);
    expect(logged).toMatch(/\d+ms/);
  });

  test('5xx: uses console.error', () => {
    const res = makeRes(503);
    requestLogger(makeReq('/api/fail'), res, jest.fn());
    res.trigger();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('4xx: uses console.warn', () => {
    const res = makeRes(404);
    requestLogger(makeReq('/api/missing'), res, jest.fn());
    res.trigger();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  test('sanitizes CRLF in method and path before logging', () => {
    const req = makeReq('/foo\r\nbar', 'GET\r\nINJECTED');
    const res = makeRes(200);
    requestLogger(req, res, jest.fn());
    res.trigger();
    const logged = logSpy.mock.calls[0][0];
    expect(logged).not.toMatch(/\r/);
    expect(logged).not.toMatch(/\n/);
  });
});
