const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Admin Lead Backend API is running!', status: 'OK' });
});
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth')); // For admin login

// Connect to MongoDB (same database as Lead-Magnet)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001; // Different port from main app
app.listen(PORT, () => {
  console.log(`Admin Panel Server running on port ${PORT}`);
});