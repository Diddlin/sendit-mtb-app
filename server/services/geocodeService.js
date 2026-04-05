/**
 * Geocode Service
 * Converts zip code or city name → { lat, lng, label }
 * Uses Google Maps Geocoding API; falls back to a small built-in lookup.
 */

const axios = require('axios');

// Fallback lookup for common US MTB hubs (no API key required)
const FALLBACK_LOCATIONS = {
  '84532': { lat: 38.5733, lng: -109.5534, label: 'Moab, UT' },
  'moab':  { lat: 38.5733, lng: -109.5534, label: 'Moab, UT' },
  '80424': { lat: 39.4817, lng: -106.0384, label: 'Breckenridge, CO' },
  'breckenridge': { lat: 39.4817, lng: -106.0384, label: 'Breckenridge, CO' },
  '81611': { lat: 39.1911, lng: -106.8175, label: 'Aspen, CO' },
  'aspen': { lat: 39.1911, lng: -106.8175, label: 'Aspen, CO' },
  'bentonville': { lat: 36.3729, lng: -94.2088, label: 'Bentonville, AR' },
  '72712': { lat: 36.3729, lng: -94.2088, label: 'Bentonville, AR' },
  'whistler': { lat: 50.1163, lng: -122.9574, label: 'Whistler, BC' },
};

async function geocode(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Location query is required');
  }

  const normalized = query.trim().toLowerCase();

  // Check fallback first (fastest)
  if (FALLBACK_LOCATIONS[normalized]) {
    return FALLBACK_LOCATIONS[normalized];
  }

  // Try Google Maps Geocoding API
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'your_google_maps_api_key') {
    try {
      const resp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address: query, key: apiKey },
        timeout: 5000,
      });
      const result = resp.data?.results?.[0];
      if (result) {
        const loc = result.geometry.location;
        return {
          lat: loc.lat,
          lng: loc.lng,
          label: result.formatted_address,
        };
      }
    } catch (err) {
      console.warn('Google Geocode error:', err.message);
    }
  }

  // Try OpenStreetMap Nominatim as free fallback
  try {
    const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 1, countrycodes: 'us,ca' },
      headers: { 'User-Agent': 'MtnBikeApp/1.0' },
      timeout: 5000,
    });
    const result = resp.data?.[0];
    if (result) {
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        label: result.display_name,
      };
    }
  } catch (err) {
    console.warn('Nominatim error:', err.message);
  }

  throw new Error(`Could not geocode location: "${query}". Try a city name or zip code.`);
}

module.exports = { geocode };
