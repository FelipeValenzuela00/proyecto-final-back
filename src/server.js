require('dotenv').config();
const app = require('./app'); // Importas el app.js de arriba
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// Aquí iría la conexión a la base de datos más adelante
// db.connect().then(() => {

async function startServer() {
    try {
        // INTENTO CONECTAR DB
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos PostgreSQL exitosa (Prisma)');

        //LEVANTA SV
        app.listen(PORT, () => {
            console.log(`🚀 Servidor encendido y escuchando en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error fatal al conectar a la base de datos:', error);
        process.exit(1); // Apagamos la app si no hay BD
    }
}

startServer();

// });