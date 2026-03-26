# WeatherNow - Production Ready Weather Application

A modern, production-ready weather application built with Node.js, Express, and vanilla JavaScript.

## 🚀 Features

### Backend
- **Secure API Proxy**: Hides OpenWeatherMap API key
- **Rate Limiting**: 100 requests per 15 minutes (configurable)
- **Response Caching**: 10-minute cache with max 1000 keys
- **Input Validation**: Comprehensive validation for all endpoints
- **Request Logging**: Morgan middleware for HTTP logging
- **CORS Configuration**: Environment-based allowed origins
- **Error Handling**: Global error handler with standardized responses
- **Health Check**: `/api/health` endpoint for monitoring
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

### Frontend
- **Safe Data Access**: All data accessed with fallbacks
- **Loading States**: With timeout handling
- **Error Handling**: User-friendly error messages
- **Fallback UI**: Emoji icons when images fail
- **Responsive Design**: Mobile-first CSS
- **Accessibility**: ARIA labels and keyboard navigation
- **Air Quality**: Real-time AQI with health tips

## 📁 Project Structure

```
weather-website/
├── server/
│   └── proxy-server.js      # Main server file (only server file)
├── public/
│   ├── index.html           # Frontend HTML
│   ├── script.js            # Frontend JavaScript
│   └── styles.css           # Frontend CSS
├── .env.example             # Environment variables template
├── package.json             # Dependencies
└── README.md                # This file
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your API key:

```bash
# Get your API key from: https://home.openweathermap.org/users/sign_up
OPENWEATHER_API_KEY=your_api_key_here

# Server port (optional, defaults to 3001)
PORT=3001

# Node environment
NODE_ENV=development

# CORS Allowed Origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 3. Run the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Frontend application |
| GET | `/api/health` | Server health check |
| GET | `/api/weather?lat=&lon=` | Current weather |
| GET | `/api/geo?q=` | Geocoding (city search) |
| GET | `/api/reverse-geo?lat=&lon=` | Reverse geocoding |
| GET | `/api/air-pollution?lat=&lon=` | Air quality index |
| GET | `/api/alerts?lat=&lon=` | Weather alerts |
| GET | `/api/onecall?lat=&lon=` | Forecast data |
| GET | `/api/cache/stats` | Cache statistics |
| POST | `/api/cache/clear` | Clear cache |

## 🔒 Security Features

- API key stored only in environment variables
- CORS configured via environment variable
- Rate limiting on all API endpoints
- Input validation on all parameters
- Security headers (XSS, Clickjacking, MIME sniffing)
- Request timeout handling
- No sensitive data exposed in responses

## 📊 Standardized API Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "message": "Optional message"
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

## 🌐 Deployment (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Add environment variables:
   - `OPENWEATHER_API_KEY`
   - `CORS_ALLOWED_ORIGINS` (include your Render URL)
   - `NODE_ENV=production`
5. Deploy!

## 🧪 Testing

Test the health endpoint:

```bash
curl http://localhost:3001/api/health
```

Test weather API:

```bash
curl "http://localhost:3001/api/weather?lat=51.5074&lon=-0.1278"
```

## 📝 Changelog

### v2.0.0 - Production Ready

**Removed:**
- Dead code (server/server.js, js/, css/, root index.html)
- Duplicate files and unused HTML generators
- Hardcoded API keys and CORS origins

**Added:**
- Morgan request logging
- Input validation for all endpoints
- maxKeys limit on cache (prevents memory overflow)
- Standardized API response format
- Global error handler middleware
- Rate limit headers
- Request timeout handling
- Health check endpoint improvements

**Improved:**
- CORS configuration via environment variable
- Error messages (user-friendly)
- Loading states with timeout
- Fallback UI for icons
- Code organization and readability

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.
