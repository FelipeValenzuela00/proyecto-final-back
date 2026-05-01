jest.mock('../../../src/shared/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const logger = require('../../../src/shared/utils/logger');
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
  beforeEach(() => {
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
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
    expect(logger.info).toHaveBeenCalledTimes(1);
    const [message, meta] = logger.info.mock.calls[0];
    expect(message).toMatch(/POST/);
    expect(message).toMatch(/\/api\/users/);
    expect(message).toMatch(/201/);
    expect(message).toMatch(/\d+ms/);
    expect(meta).toMatchObject({
      method: 'POST',
      path: '/api/users',
      status: 201,
    });
    expect(typeof meta.durationMs).toBe('number');
  });

  test('5xx: uses logger.error', () => {
    const res = makeRes(503);
    requestLogger(makeReq('/api/fail'), res, jest.fn());
    res.trigger();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  test('4xx: uses logger.warn', () => {
    const res = makeRes(404);
    requestLogger(makeReq('/api/missing'), res, jest.fn());
    res.trigger();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  test('sanitizes CRLF in method and path before logging', () => {
    const req = makeReq('/foo\r\nbar', 'GET\r\nINJECTED');
    const res = makeRes(200);
    requestLogger(req, res, jest.fn());
    res.trigger();
    const [message, meta] = logger.info.mock.calls[0];
    expect(message).not.toMatch(/[\r\n]/);
    expect(meta.method).not.toMatch(/[\r\n]/);
    expect(meta.path).not.toMatch(/[\r\n]/);
  });
});
