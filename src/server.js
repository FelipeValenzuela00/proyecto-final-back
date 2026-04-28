require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Aquí iría la conexión a la base de datos más adelante
// db.connect().then(() => {

app.listen(PORT, () => {
    logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

// });