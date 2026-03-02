# 🌤️ WeatherNow - Ultimate Weather Application

**Version**: 3.0 - Production Ready  
**Demo**: [Live Demo Link]  

A modern, feature-rich weather application with real-time updates, beautiful UI, and advanced features.

---

## ✨ Features

- 🌍 **Real-time Weather** - Current temperature, humidity, wind, and more
- 📅 **7-Day Forecast** - Weekly weather predictions
- ⏰ **Hourly Forecast** - 24-hour detailed forecast
- 🌬️ **Air Quality Index** - PM2.5, PM10, O₃, NO₂ levels
- 🔔 **Push Notifications** - Browser-based weather alerts
- 🌍 **Multi-language** - 6 languages supported
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 📤 **Export** - PDF, Image, Social sharing
- 🎨 **6 Themes** - Beautiful glassmorphism design
- 📱 **PWA** - Installable with offline support

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/weathernow.git
cd weathernow
```

### 2. Setup API Key
```bash
# Copy example config
cp js/config.example.js js/config.local.js

# Edit config.local.js and add your API key
# Get free API key: https://openweathermap.org/api
```

### 3. Open in Browser
```bash
# Use any static file server
npx serve

# Or open index.html directly
```

---

## 🔐 API Key Setup

**IMPORTANT**: Never commit API keys to GitHub!

1. Get free API key: https://openweathermap.org/api
2. Copy `js/config.example.js` to `js/config.local.js`
3. Add your API key in `config.local.js`
4. File is gitignored - safe!

---

## 📁 Project Structure

```
weathernow/
├── index.html              # Main HTML
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── package.json            # Dependencies
│
├── js/
│   ├── main.js            # Main app
│   ├── config.js          # Config (safe)
│   ├── config.example.js  # Example (safe)
│   ├── config.local.js    # Local (gitignored)
│   └── ...
│
├── css/
│   ├── styles.css
│   ├── components.css
│   └── ...
│
└── server/
    └── proxy-server.js    # Backend proxy (optional)
```

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start backend (optional)
npm start

# Run frontend
npx serve
```

---

## 📦 Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
netlify deploy
```

### GitHub Pages
Enable in repository settings.

---

## 🔒 Security

### Protected Files (Gitignored)
- `js/config.local.js` - API key (PRIVATE)
- `.env` - Environment variables (PRIVATE)
- `node_modules/` - Dependencies

### Safe to Commit
- Source code (HTML, CSS, JS)
- Example configs
- Documentation

---

## 📝 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenWeatherMap** - Weather data API
- **Chart.js** - Temperature graphs
- **html2canvas** - Export functionality

---

## 📞 Support

Open an issue on GitHub or contact: your.email@example.com

---

**Made with ❤️ by AKASH**

[Back to top](#readme)
