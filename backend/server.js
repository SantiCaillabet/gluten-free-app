require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const restaurantsRouter = require('./routes/restaurants');
const recipesRouter = require('./routes/recipes');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'https://gluten-free-app-nine.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/ai', aiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta ${req.path} no encontrada` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🌾 GlutenFree App Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});
