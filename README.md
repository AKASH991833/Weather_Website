# WeatherNow - Production Ready Weather App

A modern, production-ready weather application built with Node.js, Express, and vanilla JavaScript.

## 🌟 Features

- **Real-time Weather Data** - Current weather, forecasts, and air quality
- **Modern UI** - Beautiful gradient design with smooth animations
- **Location Support** - Search by city or use GPS location
- **Air Quality Index** - PM2.5, PM10, O₃, NO₂ measurements
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Secure Backend** - API key hidden on server, rate limiting, caching
- **Production Ready** - Deployed on Render with custom domain support

## 📁 Project Structure

```
Weather_Website/
├── public/                    # Frontend static files
│   ├── index.html            # Main HTML page
│   ├── styles.css            # Modern CSS styles
│   └── script.js             # Frontend JavaScript
├── server/
│   └── proxy-server.js       # Express backend server
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenWeatherMap API key:

```env
OPENWEATHER_API_KEY=your_api_key_here
PORT=3001
```

Get your API key: https://home.openweathermap.org/users/sign_up

### 3. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Open http://localhost:3001 in your browser.

## 🌐 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Weather App (Frontend) |
| `GET /api/health` | Server health check |
| `GET /api/weather?lat=&lon=` | Current weather |
| `GET /api/geo?q=` | Geocoding |
| `GET /api/reverse-geo?lat=&lon=` | Reverse geocoding |
| `GET /api/air-pollution?lat=&lon=` | Air quality |
| `GET /api/alerts?lat=&lon=` | Weather alerts |

## 📦 Deploy to Render

### Option 1: Automatic Deploy (Recommended)

1. Push code to GitHub
2. Go to https://render.com
3. Create new **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add environment variable:
   - **Key:** `OPENWEATHER_API_KEY`
   - **Value:** your_api_key
7. Click **Create Web Service**

### Option 2: Manual Deploy

1. In Render Dashboard, create Web Service
2. Set environment variables
3. Deploy from Git or manually

## 🔒 Security Features

- ✅ API key stored in environment variables (never exposed)
- ✅ CORS protection with allowed origins
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Security headers (X-Frame-Options, X-XSS-Protection)
- ✅ Input validation
- ✅ Error handling

## 🎨 Frontend Features

- **Search by City** - Type any city name worldwide
- **Use My Location** - GPS-based weather
- **Air Quality Display** - Color-coded AQI with health info
- **Weather Details** - Wind, visibility, pressure, feels like
- **Responsive Design** - Mobile-first approach
- **Loading States** - Smooth UX with spinners
- **Error Handling** - User-friendly error messages

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |

### CORS Configuration

Edit `server/proxy-server.js` to add your domains:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://yourdomain.com',
    'https://weather-website-yf9y.onrender.com'
  ]
}));
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🐛 Troubleshooting

### "API Key not set" error
- Check `.env` file exists
- Verify `OPENWEATHER_API_KEY` is set
- For Render: Add in dashboard (Service > Environment)

### CORS errors
- Add your frontend URL to CORS `origin` array
- Ensure protocol (http/https) matches

### 404 on root URL
- Make sure `public/` folder exists
- Check `index.html` is in `public/`

## 📄 License

MIT

## 🙏 Credits

- Weather data: [OpenWeatherMap](https://openweathermap.org)
- Icons: OpenWeatherMap Weather Icons
- Fonts: Google Fonts (Poppins)

---

**Built with ❤️ by AKASH**
