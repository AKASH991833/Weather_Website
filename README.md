# 🌤️ WeatherNow - Ultimate Weather Experience

A modern, feature-rich weather application built with HTML, CSS, and JavaScript that provides real-time weather data, forecasts, and air quality information.

![WeatherNow](https://img.shields.io/badge/Weather-App-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

---

## ✨ Features

### 🌡️ Current Weather
- Real-time temperature display
- Weather conditions with animated icons
- Feels like temperature
- Dynamic weather backgrounds (rain, snow, sun rays, clouds)
- **NEW**: Last updated timestamp
- **NEW**: Manual refresh button

### 📊 Detailed Weather Metrics
- **Humidity** - Current moisture levels
- **Wind Speed & Direction** - Real-time wind data with compass visualization
- **Visibility** - Distance visibility
- **Pressure** - Atmospheric pressure
- **UV Index** - Sun protection indicator
- **Precipitation** - Rain/snow probability
- **Dew Point** - Comfort level indicator

### 🌬️ Air Quality Index (AQI)
- PM2.5, PM10, O₃, NO₂ levels
- Health recommendations
- Color-coded quality indicators

### 📈 Forecasting
- **7-Day Forecast** - Weekly weather outlook with min/max temperatures
- **24-Hour Forecast** - Hourly temperature trends
- **Temperature Graph** - Visual temperature trends using Chart.js
- **NEW**: UV Index 5-day forecast
- **NEW**: Hourly precipitation chart

### 🌅 Sun & Moon
- Sunrise time
- Sunset time
- Moon phase information
- **NEW**: Visual sun position timeline

### 💡 Weather Tips
- Clothing recommendations based on temperature
- Outdoor activity suggestions
- Sun protection advice
- Rain gear recommendations

### 🎨 User Experience
- **PWA Support** - Install as app, offline mode, background sync
- **Light/Dark Theme** - Toggle between themes
- **Unit Toggle** - Switch between °C and °F
- **Saved Locations** - Save and manage favorite cities
- **City Comparison** - Compare temperatures between cities
- **Geolocation** - Auto-detect user location
- **Responsive Design** - Works on all devices
- **Search Autocomplete** - Quick city search
- **Keyboard Shortcuts** - Quick navigation
- **Export/Share** - Download weather report as PDF/Image or share
- **Weather Alerts** - Severe weather warnings
- **Loading Skeletons** - Better loading experience

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K` - Focus search
- `Ctrl/Cmd + R` - Refresh weather
- `Ctrl/Cmd + T` - Toggle theme
- `Ctrl/Cmd + U` - Toggle unit (°C/°F)
- `Alt + C` - Compare cities
- `Alt + E` - Export panel
- `Escape` - Close panels

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenWeatherMap API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AKASH991833/Weather_Website.git
   cd Weather_Website
   ```

2. **Get your API key**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Navigate to API Keys section
   - Copy your API key

3. **Configure the API key**
   ```bash
   # Copy the example config file
   cp js/config.js.example js/config.js
   
   # On Windows PowerShell:
   Copy-Item js/config.js.example js/config.js
   ```
   
   Open `js/config.js` and replace:
   ```javascript
   API_KEY: 'YOUR_API_KEY_HERE',
   ```
   with your actual API key:
   ```javascript
   API_KEY: 'your_actual_api_key_here',
   ```

4. **Run locally**

   **Option A: Python**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Node.js**
   ```bash
   npm install -g http-server
   http-server -p 8000
   ```

   **Option C: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html`
   - Select "Open with Live Server"

5. **Open in browser**
   ```
   http://localhost:8000
   ```

---

## 📁 Project Structure

```
Weather_Website/
├── index.html              # Main HTML file
├── README.md               # Project documentation
├── SETUP.txt               # Setup instructions
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── generate-icons.html     # PWA icon generator
├── .gitignore              # Git ignore rules
├── css/
│   ├── styles.css          # Base styles & variables
│   ├── components.css      # Component styles
│   └── responsive.css      # Media queries
├── js/
│   ├── config.js           # API configuration (create from example)
│   ├── config.js.example   # Configuration template
│   ├── api.js              # API module
│   ├── ui.js               # UI module
│   ├── main.js             # Main application
│   ├── pwa.js              # PWA functionality
│   └── features.js         # Enhanced features
└── icons/                  # PWA icons (generate using generate-icons.html)
```

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure & semantics |
| **CSS3** | Styling & animations |
| **JavaScript (ES6+)** | Functionality & API integration |
| **Chart.js** | Temperature graphs |
| **OpenWeatherMap API** | Weather data |
| **Google Fonts** | Poppins font family |

---

## 🌐 Deployment

### Deploy to Netlify
1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Your site will be live at: `your-site.netlify.app`

### Deploy to Vercel
1. Create account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. Run: `vercel`
4. Your site will be live at: `your-project.vercel.app`

### Deploy to GitHub Pages
1. Go to repository **Settings > Pages**
2. Select source: **Deploy from branch > main > / (root)**
3. Your site will be live at: `username.github.io/Weather_Website`

---

## 🔒 Security Best Practices

- ⚠️ **Never commit `config.js`** to version control (already in `.gitignore`)
- 🔄 Consider implementing API key rotation
- 📊 Monitor API usage in OpenWeather dashboard
- 🚫 Free tier limits: 60 calls/minute, 1,000,000 calls/month

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Invalid API key | Double-check your API key in `config.js` |
| Map not loading | Check browser console for errors |
| Location denied | Allow location permissions in browser |
| Search not working | Ensure query is at least 2 characters |

---

## 📸 Screenshots

> Add your screenshots here:
> 
> ![Dashboard](screenshots/dashboard.png)
> ![Dark Theme](screenshots/dark-theme.png)
> ![Mobile View](screenshots/mobile.png)

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] Current weather display
- [x] 7-day forecast
- [x] Air quality index
- [x] Theme toggle
- [x] Saved locations
- [x] PWA support
- [x] Weather alerts
- [x] Wind compass
- [x] Sun timeline visualization
- [x] Weather tips
- [x] UV forecast
- [x] Export/Share
- [x] City comparison
- [x] Keyboard shortcuts
- [x] Loading skeletons

### Phase 2: Enhanced Features (API Required)
- [ ] Real weather alerts from API
- [ ] Weather maps overlay (radar, clouds)
- [ ] Historical weather data
- [ ] Minute-by-minute precipitation
- [ ] Severe weather notifications

### Phase 3: Advanced Features
- [ ] Backend API proxy
- [ ] User authentication
- [ ] Multi-language support
- [ ] Advanced data visualization
- [ ] Social sharing improvements

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**AKASH**  
- GitHub: [@AKASH991833](https://github.com/AKASH991833)
- Repository: [Weather_Website](https://github.com/AKASH991833/Weather_Website)

---

## 🙏 Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons and design inspiration from various open-source projects
- Chart.js for beautiful graphs

---

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact me directly.

**Enjoy tracking the weather! 🌈**
