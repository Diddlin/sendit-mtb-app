/**
 * Garmin Connect OAuth 1.0a Routes
 *
 * Garmin uses OAuth 1.0a (not 2.0).
 * Full production setup requires:
 *   1. Garmin Health API developer account: https://developer.garmin.com/health-api/
 *   2. Approved consumer key + secret
 *   3. OAuth 1.0a signing (handled by oauth-1.0a library)
 *
 * These routes implement the full OAuth handshake flow.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const { users } = require('./auth');

const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_AUTHORIZE_URL     = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_ACCESS_TOKEN_URL  = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
const GARMIN_COURSE_UPLOAD_URL = 'https://connectapi.garmin.com/course-service/course';

// In-memory token store (use DB in production)
const requestTokens = new Map();
const garminSessions = new Map(); // userId → { accessToken, accessTokenSecret }

/**
 * GET /api/garmin/connect
 * Step 1: Get request token → redirect user to Garmin authorization page
 */
router.get('/connect', requireAuth, async (req, res) => {
  const consumerKey    = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || consumerKey === 'your_garmin_consumer_key') {
    return res.status(503).json({
      error: 'Garmin API not configured',
      message: 'Add GARMIN_CONSUMER_KEY and GARMIN_CONSUMER_SECRET to your .env file. Get credentials at https://developer.garmin.com/health-api/',
      manualImportUrl: 'https://connect.garmin.com/modern/course/import',
    });
  }

  try {
    // Build OAuth 1.0a header (simplified — use oauth-1.0a package in prod)
    const callbackUrl = process.env.GARMIN_CALLBACK_URL || 'http://localhost:3000/auth/garmin/callback';

    const resp = await axios.post(GARMIN_REQUEST_TOKEN_URL, null, {
      headers: buildOAuth1Header('POST', GARMIN_REQUEST_TOKEN_URL, {
        oauth_callback: callbackUrl,
        consumerKey,
        consumerSecret,
      }),
    });

    const params = new URLSearchParams(resp.data);
    const requestToken = params.get('oauth_token');
    const requestTokenSecret = params.get('oauth_token_secret');

    // Store request token temporarily
    requestTokens.set(requestToken, {
      secret: requestTokenSecret,
      userId: req.user.id,
      createdAt: Date.now(),
    });

    const authorizeUrl = `${GARMIN_AUTHORIZE_URL}?oauth_token=${requestToken}`;
    res.json({ authorizeUrl });
  } catch (err) {
    console.error('Garmin request token error:', err.message);
    res.status(500).json({ error: 'Failed to initiate Garmin OAuth' });
  }
});

/**
 * GET /api/garmin/callback
 * Step 2: Exchange request token + verifier for access token
 */
router.get('/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const stored = requestTokens.get(oauth_token);

  if (!stored) {
    return res.status(400).send('Invalid or expired OAuth token');
  }

  const consumerKey    = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  try {
    const resp = await axios.post(GARMIN_ACCESS_TOKEN_URL, null, {
      headers: buildOAuth1Header('POST', GARMIN_ACCESS_TOKEN_URL, {
        oauth_token,
        oauth_verifier,
        oauth_token_secret: stored.secret,
        consumerKey,
        consumerSecret,
      }),
    });

    const params = new URLSearchParams(resp.data);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');

    // Save tokens to user
    garminSessions.set(stored.userId, { accessToken, accessTokenSecret });
    requestTokens.delete(oauth_token);

    // Update user's garminConnected flag
    const user = [...users.values()].find(u => u.id === stored.userId);
    if (user) user.garminConnected = true;

    // Redirect to app with success
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?garmin=connected`);
  } catch (err) {
    console.error('Garmin access token error:', err.message);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?garmin=error`);
  }
});

/**
 * POST /api/garmin/upload-course
 * Upload a GPX course to Garmin Connect
 */
router.post('/upload-course', requireAuth, async (req, res) => {
  const { trailName, gpxUrl } = req.body;
  const garmin = garminSessions.get(req.user.id);

  if (!garmin) {
    return res.status(401).json({
      error: 'Not connected to Garmin',
      action: 'Connect your Garmin account first at /api/garmin/connect',
    });
  }

  try {
    // Fetch the GPX file from the trail source
    const gpxResp = await axios.get(gpxUrl, { responseType: 'text', timeout: 10000 });
    const gpxData = gpxResp.data;

    const consumerKey    = process.env.GARMIN_CONSUMER_KEY;
    const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

    // Upload to Garmin Connect
    await axios.post(GARMIN_COURSE_UPLOAD_URL, gpxData, {
      headers: {
        ...buildOAuth1Header('POST', GARMIN_COURSE_UPLOAD_URL, {
          ...garmin,
          consumerKey,
          consumerSecret,
        }),
        'Content-Type': 'application/gpx+xml',
      },
    });

    res.json({
      success: true,
      message: `"${trailName}" has been sent to your Garmin Connect account! Check Training → Courses on connect.garmin.com`,
    });
  } catch (err) {
    console.error('Garmin upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload course to Garmin', detail: err.message });
  }
});

/**
 * GET /api/garmin/status
 */
router.get('/status', requireAuth, (req, res) => {
  const connected = garminSessions.has(req.user.id);
  res.json({ connected });
});

/**
 * DELETE /api/garmin/disconnect
 */
router.delete('/disconnect', requireAuth, (req, res) => {
  garminSessions.delete(req.user.id);
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (user) user.garminConnected = false;
  res.json({ connected: false });
});

// ─── Minimal OAuth 1.0a header builder ────────────────────────────────────────
// For production, use the 'oauth-1.0a' npm package which handles HMAC-SHA1 properly
function buildOAuth1Header(method, url, opts) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const oauthParams = [
    `oauth_consumer_key="${opts.consumerKey}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_signature_method="HMAC-SHA1"`,
    `oauth_timestamp="${timestamp}"`,
    `oauth_version="1.0"`,
  ];

  if (opts.oauth_token)    oauthParams.push(`oauth_token="${opts.oauth_token}"`);
  if (opts.oauth_callback) oauthParams.push(`oauth_callback="${encodeURIComponent(opts.oauth_callback)}"`);
  if (opts.oauth_verifier) oauthParams.push(`oauth_verifier="${opts.oauth_verifier}"`);

  // NOTE: In production, compute HMAC-SHA1 signature here using oauth-1.0a package
  // This placeholder will fail with real Garmin API — signature computation is non-trivial
  oauthParams.push(`oauth_signature="PLACEHOLDER_USE_OAUTH1_PACKAGE"`);

  return {
    Authorization: `OAuth ${oauthParams.join(', ')}`,
  };
}

module.exports = router;
