require('dotenv').config();
const app = require('./app'); // Importas el app.js de arriba
const prisma = require('./shared/database/prisma');

const PORT = process.env.PORT || 3000;

// FUNCION PARA MANEJAR EL CIERRE
function setupGracefulShutdown(server) {
    const gracefulShutdown = async (signal) => {
        console.log(`\n📴 Recibida señal ${signal}, iniciando shutdown graceful...`);

        // CIERRE SV HTTPS
        server.close(async () => {
            console.log('🛑 Servidor HTTP cerrado');

            try {
                // DESCNECTAR PRISMA
                await prisma.$disconnect();
                console.log('✅ Conexión a Prisma cerrada correctamente');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error al desconectar Prisma:', error);
                process.exit(1);
            }
        });

        // FORZAR SALIDA SI EL SHUTDOWN TARDA DEMASIADO
        setTimeout(() => {
            console.error('⚠️ Timeout en shutdown, forzando salida...');
            process.exit(1);
        }, 10000);
    };

    // Registrar handlers para SIGINT y SIGTERM
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Manejo adicional para beforeExit
    process.on('beforeExit', () => {
        console.log('💤 Proceso está a punto de terminar...');
    });
}

async function startServer() {
    try {
        // INTENTO CONECTAR DB
        await prisma.$connect();
        console.log('✅ Conexión a la base de datos PostgreSQL exitosa (Prisma)');

        // LEVANTA SV y guarda la referencia
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor encendido y escuchando en el puerto ${PORT}`);
        });

        // APLICA SHUTDOWN DE DB Y SV HTTPS
        setupGracefulShutdown(server);
    } catch (error) {
        console.error('❌ Error fatal al conectar a la base de datos:', error);
        process.exit(1); // APAGA EL PROCESO SI NO SE PUEDE CONECTAR A LA DB
    }
}

startServer();
