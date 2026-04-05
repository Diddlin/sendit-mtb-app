require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const trailRoutes = require('./routes/trails');
const { router: authRoutes } = require('./routes/auth');
const garminRoutes = require('./routes/garmin');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:19006', // Expo web
    /\.vercel\.app$/,         // all Vercel preview + production URLs
    /\.railway\.app$/,        // Railway internal
  ],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/trails', trailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/garmin', garminRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong. Send it anyway! 🤙' });
});

app.listen(PORT, () => {
  console.log(`🚵 Mtn Bike App server running on port ${PORT}`);
});
