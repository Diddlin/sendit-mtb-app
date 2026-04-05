const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory user store (replace with MongoDB in production)
const users = new Map();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  if (users.has(email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: Date.now().toString(),
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    favorites: [],
    preferences: {
      defaultLocation: '',
      defaultLength: 'medium',
      defaultSendLevel: 'mid',
    },
    garminConnected: false,
    createdAt: new Date().toISOString(),
  };

  users.set(user.email, user);
  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, favorites: user.favorites, preferences: user.preferences }
  });
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = users.get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, favorites: user.favorites, preferences: user.preferences, garminConnected: user.garminConnected }
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // JWT is stateless — client simply discards the token
  res.json({ message: 'Logged out. Stay stoked! 🤙' });
});

module.exports = { router, users };
