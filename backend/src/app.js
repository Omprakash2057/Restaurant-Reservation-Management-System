const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.replace(/\/$/, '')
  : '*';

app.use(
  cors({
    origin: clientOrigin,
  })
);
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Restaurant Reservation API is active. Use /api/health for details.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
