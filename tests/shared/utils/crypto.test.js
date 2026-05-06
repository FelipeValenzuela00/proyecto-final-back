// tests/crypto.test.js
const { encrypt, decrypt } = require('../../../src/shared/utils/crypto');

describe('Modulo de Encriptación (AES-256-GCM)', () => {
    // Configuramos una variable de entorno falsa solo para los tests
    beforeAll(() => {
        process.env.ENCRYPTION_KEY = 'f394754aa4cc9253348c0bbfb8b088831a2a1f00d18f0dbc683f062cbeb8103d';
    });

    test('Debe encriptar y desencriptar un texto correctamente', () => {
        const textoOriginal = "refresh_token_secreto_123";

        const encriptado = encrypt(textoOriginal);
        const desencriptado = decrypt(encriptado);

        // Validamos que sean iguales
        expect(desencriptado).toBe(textoOriginal);
    });

    test('El texto encriptado debe tener el formato correcto (iv:authTag:hash)', () => {
        const textoOriginal = "texto_prueba";
        const encriptado = encrypt(textoOriginal);

        // Verificamos que tenga 3 partes separadas por ":"
        const partes = encriptado.split(':');
        expect(partes.length).toBe(3);
    });

    test('Debe lanzar un error si la key no tiene 64 caracteres', () => {
        process.env.ENCRYPTION_KEY = 'llave_corta';

        // Usamos una función anónima para atrapar el error lanzado
        expect(() => encrypt("texto")).toThrow(/must be a 64-character/);
    });
});