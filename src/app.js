const express = require('express');
const cors = require('cors');
const httpLogger = require('./middleware/httpLogger');

const app = express();

// 1. Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// 2. Rutas Base (las irán agregando a medida que hagan los módulos)
// const authRoutes = require('./modules/auth/auth.routes');
// app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// 3. Exportar (sin hacer listen)
module.exports = app;