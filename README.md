# VYUHA — Clarity in Chaos

A unified disaster response platform with 5 modules.

## Quick Start

```bash
npm install
node server/server.js
# Open http://localhost:5000
```

## Modules
- **SOS** — `/modules/sos/index.html` — real-time distress broadcast
- **Zone Map** — `/zone-map.html` — danger/safe zone marking
- **Missing Person** — `/modules/missing-person/index.html` — Firebase-powered search
- **Resources** — `/modules/resources/map.html` — shelter & supply finder
- **Communication** — `/modules/communication/index.html` — P2P encrypted chat

## Deploy to Render
1. Push to GitHub
2. New Web Service → connect repo
3. Build: `npm install` | Start: `node server/server.js`
4. Add env vars: `WEATHER_API_KEY`, `CLIENT_URL`

## Google Sign-In Fix (Missing Person Module)
Go to [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth Client → add your Render URL to Authorized JavaScript Origins.

## Environment Variables
Copy `.env.example` to `.env` and fill in your keys.
