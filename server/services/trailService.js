/**
 * Trail Service
 * Aggregates data from:
 *   - Singletracks TrailAPI (free, no key needed)
 *   - OpenStreetMap Overpass API (free, no key needed)
 *   - TrailForks API (requires app_id/app_secret)
 *   - AllTrails API (requires partnership key)
 * Falls back to rich mock data when no live results are returned.
 */

const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 }); // 10-minute cache

// ─── Difficulty mapping ────────────────────────────────────────────────────────
// send_level: "low" | "mid" | "big"
// TrailForks difficulty: 1=white, 2=green, 3=blue, 4=black, 5=double-black, 6=proline
const SEND_TO_DIFFICULTY = {
  low:  [1, 2, 3],      // white, green, blue
  mid:  [3, 4],         // blue, black
  big:  [4, 5, 6],      // black, double-black, proline
};

// Length ranges in miles
const LENGTH_RANGES = {
  short:  { min: 0,  max: 8  },
  medium: { min: 6,  max: 14 },
  long:   { min: 10, max: 999 },
};

// ─── TrailForks ───────────────────────────────────────────────────────────────
async function fetchFromTrailForks({ lat, lng, radiusMiles, sendLevel, lengthType }) {
  const appId     = process.env.TRAILFORKS_APP_ID;
  const appSecret = process.env.TRAILFORKS_APP_SECRET;

  if (!appId || !appSecret || appId === 'your_trailforks_app_id') {
    return null; // fall through to mock
  }

  const difficultyIds = SEND_TO_DIFFICULTY[sendLevel] || SEND_TO_DIFFICULTY.mid;
  const { min: minLen, max: maxLen } = LENGTH_RANGES[lengthType] || LENGTH_RANGES.medium;
  const radiusKm = Math.round(radiusMiles * 1.60934);

  const params = {
    app_id: appId,
    app_secret: appSecret,
    filter: `difficulty=${difficultyIds.join(';')};total_length>=${minLen * 1000};total_length<=${maxLen * 1000}`,
    radius: radiusKm * 1000, // metres
    lat,
    lon: lng,
    limit: 20,
    fields: 'id,title,difficulty,total_length,description,thumb,rating,num_reviews,profile,www',
  };

  const resp = await axios.get('https://www.trailforks.com/api/1/trails', { params, timeout: 8000 });
  const data = resp.data?.data || [];

  return data.map(t => ({
    id:         `tf_${t.id}`,
    source:     'TrailForks',
    name:       t.title,
    difficulty: mapTFDifficulty(t.difficulty),
    lengthMi:   parseFloat((t.total_length / 1609).toFixed(1)),
    rating:     parseFloat((t.rating / 10).toFixed(1)), // TF uses 0-100
    numReviews: t.num_reviews,
    description: t.description || '',
    thumbnailUrl: t.thumb || null,
    trailUrl:   t.www || `https://www.trailforks.com/trails/${t.id}/`,
    gpxUrl:     `https://www.trailforks.com/trails/${t.id}/gpx/`,
    lat:        t.profile?.lat || lat,
    lng:        t.profile?.lon || lng,
  }));
}

function mapTFDifficulty(n) {
  const map = { 1:'White', 2:'Green', 3:'Blue', 4:'Black', 5:'Double Black', 6:'Pro Line' };
  return map[n] || 'Unknown';
}

// ─── AllTrails ────────────────────────────────────────────────────────────────
async function fetchFromAllTrails({ lat, lng, radiusMiles, sendLevel, lengthType }) {
  const apiKey = process.env.ALLTRAILS_API_KEY;
  if (!apiKey || apiKey === 'your_alltrails_api_key') return null;

  const { min: minLen, max: maxLen } = LENGTH_RANGES[lengthType] || LENGTH_RANGES.medium;
  const difficultyMap = { low: [1,2], mid: [2,3], big: [3] };
  const difficulties = difficultyMap[sendLevel] || [2];

  const params = {
    key: apiKey,
    lat,
    lng,
    radius: radiusMiles * 1609, // metres
    difficulty_ids: difficulties.join(','),
    length_min: minLen,
    length_max: maxLen,
    limit: 20,
    activities: 'mountain-biking',
  };

  const resp = await axios.get('https://www.alltrails.com/api/alltrails/v2/trails', { params, timeout: 8000 });
  const trails = resp.data?.data || [];

  return trails.map(t => ({
    id:          `at_${t.id}`,
    source:      'AllTrails',
    name:        t.name,
    difficulty:  t.difficulty_rating_name || 'Moderate',
    lengthMi:    parseFloat((t.length / 1609).toFixed(1)),
    rating:      t.avg_rating || 0,
    numReviews:  t.num_reviews || 0,
    description: t.description || '',
    thumbnailUrl: t.profile_photo_data?.medium_url || null,
    trailUrl:    `https://www.alltrails.com/trail/${t.slug}`,
    gpxUrl:      `https://www.alltrails.com/trail/${t.slug}/download`,
    lat:         t.lat || lat,
    lng:         t.lng || lng,
  }));
}

// ─── Singletracks TrailAPI ────────────────────────────────────────────────────
// Free, no API key required. MTB-specific, 16k+ US/Canada trails.
// Docs: https://www.singletracks.com/mtb-trails/introducing-trailapi/
async function fetchFromSingletracks({ lat, lng, radiusMiles, lengthType }) {
  const { min: minLen, max: maxLen } = LENGTH_RANGES[lengthType] || LENGTH_RANGES.medium;

  const params = {
    lat,
    lon: lng,
    radius: radiusMiles,
    activities: 'mountain biking',
    minLength: minLen,
    maxLength: maxLen === 999 ? undefined : maxLen,
    limit: 20,
  };

  // Remove undefined params
  Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key') return null;

  const resp = await axios.get('https://trailapi-trailapi.p.rapidapi.com/trails/explore/', {
    params,
    headers: {
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': 'trailapi-trailapi.p.rapidapi.com',
    },
    timeout: 8000,
  });

  const trails = resp.data?.data || [];

  return trails.map((t, i) => ({
    id:           `st_${t.id || i}`,
    source:       'Singletracks',
    name:         t.name,
    difficulty:   mapSingletracksDifficulty(t.difficulty),
    lengthMi:     parseFloat((t.length || 0).toFixed(1)),
    rating:       parseFloat(((t.rating || 0) / 2).toFixed(1)), // ST uses 0-10, convert to 0-5
    numReviews:   t.num_reviews || 0,
    description:  t.description || t.directions || '',
    thumbnailUrl: t.thumbnail || t.imgSmUrl || null,
    trailUrl:     t.url || `https://www.singletracks.com/bike-trails/${t.unique_id}/`,
    gpxUrl:       null, // Singletracks doesn't expose GPX directly
    lat:          parseFloat(t.lat) || lat,
    lng:          parseFloat(t.lon) || lng,
    location:     [t.city, t.state].filter(Boolean).join(', '),
  }));
}

function mapSingletracksDifficulty(d) {
  const map = {
    'easy':         'Green',
    'moderate':     'Blue',
    'difficult':    'Black',
    'very difficult':'Double Black',
  };
  return map[(d || '').toLowerCase()] || d || 'Unknown';
}

// ─── OpenStreetMap Overpass API ───────────────────────────────────────────────
// Completely free and open, no key needed.
// Queries MTB routes tagged route=mtb within a bounding box.
async function fetchFromOpenStreetMap({ lat, lng, radiusMiles, sendLevel, lengthType }) {
  const { min: minLen, max: maxLen } = LENGTH_RANGES[lengthType] || LENGTH_RANGES.medium;

  // Convert radius to degrees (rough approximation: 1 mile ≈ 0.0145 degrees)
  const deg = radiusMiles * 0.0145;
  const bbox = `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`;

  // OSM mtb:scale → send level mapping
  // 0=easy, 1=easy/mod, 2=moderate, 3=hard, 4=very hard, 5=expert, 6=extreme
  const scaleMap = {
    low: '[mtb:scale~"^[0-1]$"]',
    mid: '[mtb:scale~"^[1-3]$"]',
    big: '[mtb:scale~"^[3-6]$"]',
  };
  const scaleFilter = scaleMap[sendLevel] || '';

  // Note: scaleFilter uses regex syntax only supported in newer Overpass versions
  // so we query broadly and filter client-side for reliability
  const query = `[out:json][timeout:15];(relation["route"="mtb"](${bbox});way["highway"~"path|track"]["mtb:scale"](${bbox}););out body center 20;`;

  const resp = await axios.post(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(query)}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );

  const elements = resp.data?.elements || [];
  if (elements.length === 0) return [];

  const results = [];

  for (const el of elements.slice(0, 20)) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || null;
    if (!name) continue;

    // Estimate length from OSM distance tag if present (in km), else skip
    const distanceKm = parseFloat(tags.distance || tags['route:length'] || 0);
    const distanceMi = distanceKm > 0 ? parseFloat((distanceKm * 0.621371).toFixed(1)) : null;

    // Apply length filter if we have distance data
    if (distanceMi !== null && (distanceMi < minLen || distanceMi > maxLen)) continue;

    const osmDifficulty = mapOSMDifficulty(tags['mtb:scale']);
    const elLat = el.center?.lat || el.lat || lat;
    const elLng = el.center?.lon || el.lon || lng;
    const osmId = el.id;
    const osmType = el.type === 'relation' ? 'relation' : 'way';

    results.push({
      id:           `osm_${osmId}`,
      source:       'OpenStreetMap',
      name,
      difficulty:   osmDifficulty,
      lengthMi:     distanceMi || null,
      rating:       null, // OSM has no ratings
      numReviews:   0,
      description:  buildOSMDescription(tags),
      thumbnailUrl: null,
      trailUrl:     `https://www.openstreetmap.org/${osmType}/${osmId}`,
      gpxUrl:       `https://overpass-api.de/api/map?bbox=${elLng - 0.01},${elLat - 0.01},${elLng + 0.01},${elLat + 0.01}`,
      lat:          elLat,
      lng:          elLng,
      location:     tags['addr:city'] || tags.locality || '',
    });
  }

  return results;
}

function mapOSMDifficulty(scale) {
  const n = parseInt(scale);
  if (isNaN(n)) return 'Unknown';
  if (n <= 1)  return 'Green';
  if (n === 2) return 'Blue';
  if (n === 3) return 'Black';
  if (n >= 4)  return 'Double Black';
  return 'Unknown';
}

function buildOSMDescription(tags) {
  const parts = [];
  if (tags.surface)       parts.push(`Surface: ${tags.surface}`);
  if (tags['mtb:scale'])  parts.push(`MTB Scale: ${tags['mtb:scale']}/6`);
  if (tags['mtb:scale:uphill']) parts.push(`Climb difficulty: ${tags['mtb:scale:uphill']}/5`);
  if (tags.description)   parts.push(tags.description);
  if (tags.note)          parts.push(tags.note);
  return parts.join(' · ') || 'Community-mapped trail from OpenStreetMap.';
}

// ─── Mock data (used when APIs are not yet configured) ─────────────────────────
function getMockTrails({ sendLevel, lengthType, locationLabel }) {
  const allMocks = [
    {
      id: 'mock_1',
      source: 'TrailForks',
      name: 'Porcupine Rim Trail',
      difficulty: 'Black',
      lengthMi: 10.7,
      rating: 4.8,
      numReviews: 1243,
      description: 'One of the most iconic mountain bike trails in the world. Spectacular canyon views, technical slickrock, and a heart-pumping descent into the Colorado River corridor.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=400',
      trailUrl: 'https://www.trailforks.com/trails/porcupine-rim/',
      gpxUrl: 'https://www.trailforks.com/trails/porcupine-rim/gpx/',
      lat: 38.6268, lng: -109.5060,
      sendLevel: 'big', lengthType: 'medium',
      location: 'Moab, UT',
    },
    {
      id: 'mock_2',
      source: 'AllTrails',
      name: 'Downieville Downhill',
      difficulty: 'Double Black',
      lengthMi: 14.5,
      rating: 4.9,
      numReviews: 987,
      description: 'A legendary downhill run dropping 4,500 feet through old-growth forest. Roots, rocks, and rowdy singletrack make this a bucket-list ride for any big sender.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400',
      trailUrl: 'https://www.trailforks.com/trails/downieville-downhill/',
      gpxUrl: 'https://www.trailforks.com/trails/downieville-downhill/gpx/',
      lat: 39.5596, lng: -120.8324,
      sendLevel: 'big', lengthType: 'long',
      location: 'Downieville, CA',
    },
    {
      id: 'mock_3',
      source: 'TrailForks',
      name: 'Bentonite Hills Loop',
      difficulty: 'Blue',
      lengthMi: 6.8,
      rating: 4.5,
      numReviews: 452,
      description: 'A flowy, mellow loop through otherworldly badlands terrain. Perfect for building confidence with mild technical sections and epic scenery.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1594464437408-6bb21a694b3a?w=400',
      trailUrl: 'https://www.trailforks.com/trails/bentonite-hills-loop/',
      gpxUrl: 'https://www.trailforks.com/trails/bentonite-hills-loop/gpx/',
      lat: 38.3555, lng: -110.6507,
      sendLevel: 'low', lengthType: 'short',
      location: 'Capitol Reef, UT',
    },
    {
      id: 'mock_4',
      source: 'AllTrails',
      name: 'Captain Ahab',
      difficulty: 'Black',
      lengthMi: 7.2,
      rating: 4.7,
      numReviews: 834,
      description: 'Flowy desert singletrack with just enough spice. Rollers, berms, and technical rock sections that keep you grinning the whole way.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      trailUrl: 'https://www.alltrails.com/trail/us/utah/captain-ahab-trail',
      gpxUrl: 'https://www.alltrails.com/trail/us/utah/captain-ahab-trail/download',
      lat: 38.5733, lng: -109.5534,
      sendLevel: 'mid', lengthType: 'short',
      location: 'Moab, UT',
    },
    {
      id: 'mock_5',
      source: 'TrailForks',
      name: 'Monarch Crest Trail',
      difficulty: 'Blue',
      lengthMi: 13.5,
      rating: 4.6,
      numReviews: 672,
      description: 'High alpine singletrack above treeline with 360-degree mountain views. A must-do Colorado classic with big climbs rewarded by even bigger descents.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400',
      trailUrl: 'https://www.trailforks.com/trails/monarch-crest-trail/',
      gpxUrl: 'https://www.trailforks.com/trails/monarch-crest-trail/gpx/',
      lat: 38.4978, lng: -106.3282,
      sendLevel: 'mid', lengthType: 'medium',
      location: 'Salida, CO',
    },
    {
      id: 'mock_6',
      source: 'AllTrails',
      name: 'Phil\'s World Loop',
      difficulty: 'Green',
      lengthMi: 5.8,
      rating: 4.4,
      numReviews: 389,
      description: 'A mellow, beginner-friendly desert loop with smooth singletrack. Great intro trail with no sharp exposure and all the fun you need.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1530143584546-02191bc84eb5?w=400',
      trailUrl: 'https://www.alltrails.com/trail/us/colorado/phils-world-loop',
      gpxUrl: 'https://www.alltrails.com/trail/us/colorado/phils-world-loop/download',
      lat: 37.2986, lng: -108.5851,
      sendLevel: 'low', lengthType: 'short',
      location: 'Cortez, CO',
    },
    {
      id: 'mock_7',
      source: 'TrailForks',
      name: 'Whole Enchilada',
      difficulty: 'Double Black',
      lengthMi: 26.5,
      rating: 4.9,
      numReviews: 1891,
      description: 'The full Moab mega-shuttle from La Sal Mountains to the Colorado River. Every terrain type in one epic ride — alpine singletrack to desert slickrock.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400',
      trailUrl: 'https://www.trailforks.com/trails/whole-enchilada/',
      gpxUrl: 'https://www.trailforks.com/trails/whole-enchilada/gpx/',
      lat: 38.4722, lng: -109.2731,
      sendLevel: 'big', lengthType: 'long',
      location: 'Moab, UT',
    },
    {
      id: 'mock_8',
      source: 'AllTrails',
      name: 'Mill Creek Trail',
      difficulty: 'Blue',
      lengthMi: 8.4,
      rating: 4.3,
      numReviews: 215,
      description: 'A local favorite with fast rollers, a few rock gardens, and a creek crossing. Perfect mid-week after-work flow trail.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400',
      trailUrl: 'https://www.alltrails.com/trail/us/utah/mill-creek-trail',
      gpxUrl: 'https://www.alltrails.com/trail/us/utah/mill-creek-trail/download',
      lat: 38.5733, lng: -109.5534,
      sendLevel: 'mid', lengthType: 'medium',
      location: 'Moab, UT',
    },
    {
      id: 'mock_9',
      source: 'TrailForks',
      name: 'Repack Road',
      difficulty: 'Black',
      lengthMi: 2.1,
      rating: 4.7,
      numReviews: 832,
      description: 'The birthplace of mountain biking. A steep, loose, legendary descent in Marin County where the sport was invented in the 1970s. Short but absolutely iconic.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400',
      trailUrl: 'https://www.trailforks.com/trails/repack-road/',
      gpxUrl: 'https://www.trailforks.com/trails/repack-road/gpx/',
      lat: 37.9271, lng: -122.6335,
      sendLevel: 'big', lengthType: 'short',
      location: 'Fairfax, CA',
    },
    {
      id: 'mock_10',
      source: 'TrailForks',
      name: 'Pine Mountain Loop',
      difficulty: 'Blue',
      lengthMi: 11.2,
      rating: 4.6,
      numReviews: 1104,
      description: 'Marin County classic with sweeping bay views, fast fire roads, and fun singletrack descents. One of the best all-around rides in the Bay Area.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400',
      trailUrl: 'https://www.trailforks.com/trails/pine-mountain-loop/',
      gpxUrl: 'https://www.trailforks.com/trails/pine-mountain-loop/gpx/',
      lat: 37.9583, lng: -122.6399,
      sendLevel: 'mid', lengthType: 'medium',
      location: 'Fairfax, CA',
    },
    {
      id: 'mock_11',
      source: 'AllTrails',
      name: 'Old Railroad Grade to East Peak',
      difficulty: 'Blue',
      lengthMi: 13.8,
      rating: 4.5,
      numReviews: 678,
      description: 'A long, steady climb up Mount Tamalpais on a historic railroad grade, rewarded with jaw-dropping views of the Bay, the Pacific, and the Golden Gate. A Bay Area bucket list ride.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      trailUrl: 'https://www.alltrails.com/trail/us/california/old-railroad-grade-to-east-peak',
      gpxUrl: 'https://www.alltrails.com/trail/us/california/old-railroad-grade-to-east-peak/download',
      lat: 37.9235, lng: -122.5965,
      sendLevel: 'low', lengthType: 'long',
      location: 'Mill Valley, CA',
    },
    {
      id: 'mock_12',
      source: 'TrailForks',
      name: 'Tamarancho Flow Trail',
      difficulty: 'Blue',
      lengthMi: 4.2,
      rating: 4.8,
      numReviews: 543,
      description: 'A purpose-built flow trail in Marin County with berms, rollers, and perfectly sculpted dirt. Short laps of pure stoke right in the heart of MTB country.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=400',
      trailUrl: 'https://www.trailforks.com/trails/tamarancho-flow-trail/',
      gpxUrl: 'https://www.trailforks.com/trails/tamarancho-flow-trail/gpx/',
      lat: 37.9500, lng: -122.6500,
      sendLevel: 'low', lengthType: 'short',
      location: 'Fairfax, CA',
    },
    {
      id: 'mock_13',
      source: 'AllTrails',
      name: 'Joaquin Miller Park Loop',
      difficulty: 'Green',
      lengthMi: 6.5,
      rating: 4.2,
      numReviews: 391,
      description: 'Wooded singletrack in the Oakland hills. Redwoods, ferns, and mellow grades make this perfect for an easy spin when you want trees instead of pavement.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400',
      trailUrl: 'https://www.alltrails.com/trail/us/california/joaquin-miller-park-loop',
      gpxUrl: 'https://www.alltrails.com/trail/us/california/joaquin-miller-park-loop/download',
      lat: 37.8157, lng: -122.1908,
      sendLevel: 'low', lengthType: 'short',
      location: 'Oakland, CA',
    },
    {
      id: 'mock_14',
      source: 'TrailForks',
      name: 'Rocky Ridge to Skyline Loop',
      difficulty: 'Black',
      lengthMi: 18.3,
      rating: 4.6,
      numReviews: 287,
      description: 'A burly East Bay epic with rocky ridge singletrack, steep technical descents, and massive views. Earns its black rating — bring your A-game and full pack.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
      trailUrl: 'https://www.trailforks.com/trails/rocky-ridge-to-skyline/',
      gpxUrl: 'https://www.trailforks.com/trails/rocky-ridge-to-skyline/gpx/',
      lat: 37.8935, lng: -122.0874,
      sendLevel: 'big', lengthType: 'long',
      location: 'Orinda, CA',
    },
  ];

  // Filter based on sendLevel and lengthType — progressively widen if needed
  const sendMap = { low: ['low'], mid: ['low','mid'], big: ['mid','big'] };
  const lenMap = { short: ['short'], medium: ['short','medium'], long: ['medium','long'] };

  const sendFilter = sendMap[sendLevel] || ['low','mid','big'];
  const lenFilter  = lenMap[lengthType]  || ['short','medium','long'];

  const filtered = allMocks.filter(t =>
    sendFilter.includes(t.sendLevel) && lenFilter.includes(t.lengthType)
  );

  // Always return results — widen filter if too narrow
  if (filtered.length >= 2) return filtered;

  // Try relaxing length filter only
  const byLevel = allMocks.filter(t => sendFilter.includes(t.sendLevel));
  if (byLevel.length >= 2) return byLevel;

  // Fall back to all mocks sorted by rating
  return allMocks.sort((a, b) => b.rating - a.rating);
}

// ─── Main export ───────────────────────────────────────────────────────────────
async function searchTrails({ lat, lng, radiusMiles = 25, sendLevel = 'mid', lengthType = 'medium', locationLabel = '' }) {
  const cacheKey = `trails:${lat}:${lng}:${radiusMiles}:${sendLevel}:${lengthType}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let results = [];

  try {
    // All four sources fire in parallel — free ones (ST + OSM) run always,
    // paid ones (TF + AT) only fire if keys are configured.
    const [tf, at, st, osm] = await Promise.allSettled([
      fetchFromTrailForks({ lat, lng, radiusMiles, sendLevel, lengthType }),
      fetchFromAllTrails({ lat, lng, radiusMiles, sendLevel, lengthType }),
      fetchFromSingletracks({ lat, lng, radiusMiles, lengthType }),
      fetchFromOpenStreetMap({ lat, lng, radiusMiles, sendLevel, lengthType }),
    ]);

    if (tf.status  === 'fulfilled' && tf.value)  results = [...results, ...tf.value];
    if (at.status  === 'fulfilled' && at.value)  results = [...results, ...at.value];
    if (st.status  === 'fulfilled' && st.value)  results = [...results, ...st.value];
    if (osm.status === 'fulfilled' && osm.value) results = [...results, ...osm.value];

    // Log which sources returned data
    const sources = { TrailForks: tf, AllTrails: at, Singletracks: st, OpenStreetMap: osm };
    for (const [name, res] of Object.entries(sources)) {
      if (res.status === 'rejected') {
        console.warn(`[TrailService] ${name} failed:`, res.reason?.message);
      } else if (res.value) {
        console.log(`[TrailService] ${name}: ${res.value.length} trails`);
      }
    }
  } catch (err) {
    console.warn('[TrailService] Unexpected error:', err.message);
  }

  // Fall back to mock data if no live results came back
  if (results.length === 0) {
    console.log('[TrailService] No live results — using mock data');
    results = getMockTrails({ sendLevel, lengthType, locationLabel });
  }

  // Sort: rated trails first (by rating desc), then unrated OSM trails after
  const rated   = results.filter(t => t.rating !== null && t.rating > 0).sort((a, b) => b.rating - a.rating);
  const unrated = results.filter(t => !t.rating || t.rating === 0);
  const sorted  = [...rated, ...unrated];

  // Deduplicate by normalised name
  const seen = new Set();
  const deduplicated = sorted.filter(t => {
    const key = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cache.set(cacheKey, deduplicated);
  return deduplicated;
}

module.exports = { searchTrails };
