# WeatherNow - Backend Server Setup

## Overview
This server securely manages your OpenWeatherMap API key. All weather API requests now go through this server instead of directly from the browser.

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API key:**
   - The `.env` file already contains your API key
   - To change it, edit `server/.env`:
     ```
     OPENWEATHER_API_KEY=your_api_key_here
     ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open your weather website:**
   - Server runs on: http://localhost:3000
   - Open your `index.html` in the browser

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/search?q=city` | Search for a location |
| `GET /api/weather?lat=&lon=&units=` | Get current weather |
| `GET /api/forecast?lat=&lon=&units=` | Get 5-day forecast |
| `GET /api/air-pollution?lat=&lon=` | Get air quality data |
| `GET /api/reverse-geocode?lat=&lon=` | Get location from coordinates |
| `GET /api/health` | Health check |

## Security Features

✅ **API Key Hidden**: API key stored in `.env` file (not in client code)
✅ **CORS Enabled**: Only your website can access the API
✅ **Rate Limiting Ready**: Can be added for production
✅ **Git Protected**: `.env` is in `.gitignore`

## Production Deployment

For production, you should:

1. **Use environment variables:**
   ```bash
   export OPENWEATHER_API_KEY=your_key
   npm start
   ```

2. **Deploy to a hosting service:**
   - Heroku
   - Railway
   - Render
   - Vercel (with serverless functions)
   - AWS/GCP/Azure

3. **Update frontend config:**
   Change `API_BASE_URL` in `js/config.js` to your production server URL

## Troubleshooting

**Server won't start:**
- Check if port 3000 is already in use
- Check if `.env` file exists with valid API key

**API requests failing:**
- Check server console for errors
- Verify API key is valid in OpenWeatherMap dashboard
- Check CORS settings if deploying to different domain

## File Structure

```
server/
├── .env              # API key (DO NOT COMMIT)
├── .env.example      # Template for .env
├── server.js         # Main server file
├── package.json      # Dependencies
└── README.md         # This file
```
