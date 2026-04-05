# 🚵 SendIt — MTB Trail Finder

A full-stack mountain bike trail finding app with web (React) and mobile (React Native/Expo) interfaces, powered by a Node.js/Express backend.

---

## Features

- **Trail search** by location (zip or city), ride length, and send level
- **Live data** from TrailForks and AllTrails APIs (with rich mock data when APIs are not yet configured)
- **Trail detail view** with description, difficulty, rating, and source link
- **Google Maps** deep-link for navigation to any trailhead
- **GPX download** for any trail
- **Garmin Connect integration** — OAuth 1.0a flow to push courses directly to your device, plus manual import instructions
- **User accounts** — register/login, save favorite trails, set default preferences
- **Dark, trail-ready UI** — works on desktop and phone

---

## Project Structure

```
Mtn Bike App/
├── server/          # Node.js / Express backend
│   ├── index.js
│   ├── routes/
│   │   ├── trails.js
│   │   ├── auth.js
│   │   ├── user.js
│   │   └── garmin.js
│   ├── services/
│   │   ├── trailService.js   # TrailForks + AllTrails + mock data
│   │   └── geocodeService.js # Google Maps + OSM Nominatim
│   └── middleware/
│       └── auth.js           # JWT auth
│
├── web/             # React web app (CRA)
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── Header.js
│       │   ├── SearchPanel.js
│       │   ├── TrailResults.js
│       │   ├── TrailCard.js
│       │   ├── TrailModal.js
│       │   ├── AuthModal.js
│       │   └── FavoritesPanel.js
│       └── context/
│           └── AuthContext.js
│
└── mobile/          # React Native / Expo app
    └── src/
        ├── screens/
        │   ├── SearchScreen.js
        │   ├── FavoritesScreen.js
        │   └── ProfileScreen.js
        ├── components/
        │   └── TrailDetailModal.js
        └── context/
            └── AuthContext.js
```

---

## Quick Start

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your API keys (see below)
npm run dev
```

### 2. Web App

```bash
cd web
npm install
npm start
# Opens at http://localhost:3000
```

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## API Keys

Edit `server/.env` with the following:

| Key | Where to get it | Notes |
|-----|----------------|-------|
| `TRAILFORKS_APP_ID` / `TRAILFORKS_APP_SECRET` | [trailforks.com/api](https://www.trailforks.com/about/api/) | Free developer tier available |
| `ALLTRAILS_API_KEY` | [AllTrails Developer](https://www.alltrails.com) | Requires partnership/business account |
| `GARMIN_CONSUMER_KEY` / `GARMIN_CONSUMER_SECRET` | [developer.garmin.com/health-api](https://developer.garmin.com/health-api/) | Requires approved developer account |
| `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) | For Geocoding API — free tier covers typical usage |
| `JWT_SECRET` | Generate any long random string | e.g. `openssl rand -hex 32` |
| `MONGODB_URI` | [MongoDB Atlas](https://mongodb.com/atlas) | Free tier for user persistence |

**Running without API keys:** The app works immediately with rich mock trail data — no API keys required. Add keys when ready to go live.

---

## Garmin Connect Setup

### Direct OAuth (in-app)
1. Get developer credentials at [developer.garmin.com/health-api](https://developer.garmin.com/health-api/)
2. Add `GARMIN_CONSUMER_KEY` and `GARMIN_CONSUMER_SECRET` to `.env`
3. Install the `oauth-1.0a` npm package and wire it into `server/routes/garmin.js`
4. Users connect via the Profile screen → "Connect Garmin" button

### Manual Import (always available)
1. Download GPX from any trail's detail page
2. Go to [connect.garmin.com](https://connect.garmin.com) → Training → Courses
3. Click **Import** → select GPX file
4. Sync your device 🤙

---

## Production Deployment

- **Backend:** Deploy to Railway, Render, or Fly.io — set env vars in platform dashboard
- **Web:** `npm run build` in `/web` → deploy to Vercel, Netlify, or S3+CloudFront
- **Mobile:** `eas build` for App Store / Google Play submission
- **Database:** Replace in-memory user store with MongoDB (add `mongoose` models)

---

Stoke level: **ALWAYS HIGH** 🤙
