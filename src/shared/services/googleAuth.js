const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifica la firma de un ID Token de Google y extrae la información del usuario
 * @param {string} token - El ID token enviado desde el frontend
 * @returns {object} - Los datos del usuario (claims)
 */

async function verifyGoogleToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        //posible verificacion a la empresa finnegans
        // if (!payload.email.endsWith('@finnegans.com')) {
        //     throw new Error('Unauthorized: Email domain not allowed');
        // }

        return {
            googleId: payload['sub'],
            email: payload['email'],
            name: payload['name'],
            picture: payload['picture'],
            emailVerified: payload['email_verified']
        }
    } catch (error) {
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');

    }

}

module.exports = {
    verifyGoogleToken
}