require('dotenv').config();
const app = require('./app'); // Importas el app.js de arriba

const PORT = process.env.PORT || 3000;

// Aquí iría la conexión a la base de datos más adelante
// db.connect().then(() => {

app.listen(PORT, () => {
    console.log(`🚀 Servidor encendido y escuchando en el puerto ${PORT}`);
});

// });