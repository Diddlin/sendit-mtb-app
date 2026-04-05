const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { users } = require('./auth');

/**
 * GET /api/user/me
 */
router.get('/me', requireAuth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

/**
 * PATCH /api/user/preferences
 */
router.patch('/preferences', requireAuth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { defaultLocation, defaultLength, defaultSendLevel } = req.body;
  if (defaultLocation !== undefined) user.preferences.defaultLocation = defaultLocation;
  if (defaultLength !== undefined)   user.preferences.defaultLength = defaultLength;
  if (defaultSendLevel !== undefined) user.preferences.defaultSendLevel = defaultSendLevel;

  res.json({ preferences: user.preferences });
});

/**
 * POST /api/user/favorites
 */
router.post('/favorites', requireAuth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { trailId, trailData } = req.body;
  if (!trailId) return res.status(400).json({ error: 'trailId is required' });

  const exists = user.favorites.find(f => f.id === trailId);
  if (!exists) {
    user.favorites.push({ id: trailId, savedAt: new Date().toISOString(), ...trailData });
  }

  res.json({ favorites: user.favorites });
});

/**
 * DELETE /api/user/favorites/:trailId
 */
router.delete('/favorites/:trailId', requireAuth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.favorites = user.favorites.filter(f => f.id !== req.params.trailId);
  res.json({ favorites: user.favorites });
});

module.exports = router;
