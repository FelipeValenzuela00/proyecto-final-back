const express = require('express');
const cors = require('cors');

const app = express();

// 1. Middlewares Globales
// TODO: restringir orígenes antes de ir a prod. Ver https://expressjs.com/en/resources/middleware/cors.html
app.use(cors());
app.use(express.json());

// 2. Rutas Base (las irán agregando a medida que hagan los módulos)
// const authRoutes = require('./modules/auth/auth.routes');
// app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'App configurada' });
});

// 3. Exportar (sin hacer listen)
module.exports = app;
