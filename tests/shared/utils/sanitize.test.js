const { sanitizeForLog } = require('../../../src/shared/utils/sanitize');

describe('sanitizeForLog', () => {
  test('returns string unchanged when no CRLF present', () => {
    expect(sanitizeForLog('hello world')).toBe('hello world');
  });

  test('removes \\r\\n sequence', () => {
    expect(sanitizeForLog('line1\r\nline2')).toBe('line1line2');
  });

  test('removes lone \\r', () => {
    expect(sanitizeForLog('line1\rline2')).toBe('line1line2');
  });

  test('removes lone \\n', () => {
    expect(sanitizeForLog('line1\nline2')).toBe('line1line2');
  });

  test('coerces undefined to string', () => {
    expect(sanitizeForLog(undefined)).toBe('undefined');
  });

  test('coerces null to string', () => {
    expect(sanitizeForLog(null)).toBe('null');
  });

  test('coerces number to string', () => {
    expect(sanitizeForLog(42)).toBe('42');
  });

  test('coerces object to string', () => {
    expect(sanitizeForLog({})).toBe('[object Object]');
  });

  test('handles empty string', () => {
    expect(sanitizeForLog('')).toBe('');
  });
});
