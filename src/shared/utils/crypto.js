
const crypto = require('crypto');


const ALGORITHM = 'aes-256-gcm';

const secretKey = process.env.ENCRYPTION_KEY

/**
 * Encripta un texto usando AES-256-GCM
 * @param {string} text - El texto plano (ej: refresh_token)
 * @returns {string} - Formato: "ivHex:authTagHex:encryptedHex"
 */

function encrypt(text) {
    if (!secretKey || secretKey.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string');
    }
    const iv = crypto.randomBytes(12); // AES-GCM estandar

    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;

}
/**
 * Desencripta un texto previamente encriptado con AES-256-GCM
 * @param {string} hash - El string guardado en BD (Formato: "iv:authTag:encrypted")
 * @returns {string} - El texto plano original
 */
function decrypt(hash) {
    if (!secretKey || secretKey.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string');
    }

    const parts = hash.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid hash format. Expected "iv:authTag:encrypted"');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];


    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports
    = {
    encrypt,
    decrypt
};