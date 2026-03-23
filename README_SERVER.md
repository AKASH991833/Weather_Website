# WeatherNow Backend Server

Secure backend proxy server for the WeatherNow weather application.

## Features

- 🔒 **Secure API Key Management** - API key stored in environment variables, never exposed to client
- 🚀 **Rate Limiting** - Prevents abuse (100 requests per 15 minutes per IP)
- 💾 **Intelligent Caching** - 10-minute cache for faster responses and reduced API calls
- 🌍 **CORS Support** - Configured for localhost, local network, and production domains
- 🛡️ **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- 📊 **Multiple Endpoints** - Weather, forecast, air quality, geocoding, alerts

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenWeatherMap API key:

```env
OPENWEATHER_API_KEY=your_actual_api_key_here
PORT=3001
```

**Get your API key:** https://home.openweathermap.org/users/sign_up

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/weather?lat=&lon=` | Current weather |
| GET | `/api/onecall?lat=&lon=` | Forecast & historical data |
| GET | `/api/geo?q=` | Geocoding (city name to coordinates) |
| GET | `/api/reverse-geo?lat=&lon=` | Reverse geocoding |
| GET | `/api/air-pollution?lat=&lon=` | Air quality index |
| GET | `/api/alerts?lat=&lon=` | Weather alerts |
| GET | `/api/cache/stats` | Cache statistics |
| POST | `/api/cache/clear` | Clear cache |

## Example Requests

### Current Weather
```bash
curl "http://localhost:3001/api/weather?lat=51.5074&lon=-0.1278&units=metric"
```

### Geocoding
```bash
curl "http://localhost:3001/api/geo?q=London"
```

### Air Quality
```bash
curl "http://localhost:3001/api/air-pollution?lat=51.5074&lon=-0.1278"
```

## Deploy to Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Add environment variable in Render dashboard:
   - **Key:** `OPENWEATHER_API_KEY`
   - **Value:** your_openweathermap_api_key
5. Deploy!

**Build Command:** `npm install`
**Start Command:** `npm start`

## Troubleshooting

### "OPENWEATHER_API_KEY not found"
- Make sure `.env` file exists in the project root
- Check that `OPENWEATHER_API_KEY` is set correctly in `.env`
- For Render: Add the environment variable in the dashboard (Service > Environment)

### CORS Errors
- Ensure your frontend URL is added to the CORS `origin` array in `server/proxy-server.js`
- For local development: `http://localhost:3000` or `http://127.0.0.1:5500`
- For production: Add your GitHub Pages or custom domain URL

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Adjust in `server/proxy-server.js` if needed

## Project Structure

```
Weather_Website/
├── server/
│   ├── proxy-server.js    # Main backend server
│   └── server.js          # Alternative server (legacy)
├── .env.example           # Environment variables template
├── .env                   # Environment variables (gitignored)
├── package.json
└── README_SERVER.md       # This file
```

## License

MIT
