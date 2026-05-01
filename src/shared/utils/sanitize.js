const sanitizeForLog = (value) => String(value).replace(/[\r\n]/g, '');

module.exports = { sanitizeForLog };
