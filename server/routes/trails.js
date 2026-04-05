const express = require('express');
const router = express.Router();
const { searchTrails } = require('../services/trailService');
const { geocode } = require('../services/geocodeService');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/trails/search
 * Query params: location, length, send_level, radius (miles, default 25)
 */
router.get('/search', optionalAuth, async (req, res) => {
  const { location, length = 'medium', send_level = 'mid', radius = 25 } = req.query;

  if (!location) {
    return res.status(400).json({ error: 'location is required (zip code or city name)' });
  }

  const validLengths = ['short', 'medium', 'long'];
  const validSendLevels = ['low', 'mid', 'big'];

  if (!validLengths.includes(length)) {
    return res.status(400).json({ error: `length must be one of: ${validLengths.join(', ')}` });
  }
  if (!validSendLevels.includes(send_level)) {
    return res.status(400).json({ error: `send_level must be one of: ${validSendLevels.join(', ')}` });
  }

  try {
    const geoResult = await geocode(location);
    const trails = await searchTrails({
      lat: geoResult.lat,
      lng: geoResult.lng,
      radiusMiles: parseInt(radius) || 25,
      sendLevel: send_level,
      lengthType: length,
      locationLabel: geoResult.label,
    });

    // Build Google Maps URL for each trail
    const trailsWithLinks = trails.map(trail => ({
      ...trail,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${trail.lat},${trail.lng}`,
    }));

    res.json({
      location: geoResult,
      filters: { length, send_level, radius: parseInt(radius) },
      count: trailsWithLinks.length,
      trails: trailsWithLinks,
    });
  } catch (err) {
    console.error('Trail search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/trails/:id
 * Get a single trail's details
 */
router.get('/:id', async (req, res) => {
  // In production this would fetch from TrailForks/AllTrails by ID
  res.status(501).json({ message: 'Individual trail fetch coming soon' });
});

module.exports = router;
