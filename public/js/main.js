/**
 * SkyCast Pro — Enterprise Main Controller v10
 * Handles all app logic: weather data, canvas effects,
 * dynamic theming, chart, map, AQI, favorites, and more.
 */

import * as api from './api.js';
import { debounce, formatTime, formatDate, getWindDirection } from './utils.js';

// ─── STATE ───────────────────────────────────────────────────────────
const state = {
  units: localStorage.getItem('units') || 'metric',
  theme: localStorage.getItem('theme') || 'dark',
  currentWeather: null,
  currentForecast: null,
  currentAQI: null,
  currentCity: null,
  currentCoords: null,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
  mapLayer: 'precipitation_new',
  map: null,
  mapMarker: null,
  mapOverlay: null,
  chart: null,
  canvasCtx: null,
  particles: [],
  animFrame: null,
  lastRetryFn: null,
  _apiHealthy: false,
  _timeThemeAuto: localStorage.getItem('timeThemeAuto') !== 'false',
};

// ─── DOM REFS ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const el = {
  canvas:          $('weather-canvas'),
  skyOverlay:      $('sky-overlay'),
  cityInput:       $('city-input'),
  autocomplete:    $('autocomplete-results'),
  locationBtn:     $('location-btn'),
  unitC:           $('unit-c'),
  unitF:           $('unit-f'),
  themeToggle:     $('theme-toggle'),
  apiDot:          $('api-dot'),
  apiStatus:       $('api-status'),
  favoritesBar:    $('favorites-bar'),
  favContainer:    $('favorites-container'),
  favBtn:          $('favorite-btn'),
  loading:         $('loading'),
  loadingMsg:      $('loading-message'),
  error:           $('error-message'),
  errorText:       $('error-text'),
  errorRetry:      $('error-retry'),
  errorDismiss:    $('error-dismiss'),
  fallbackWarn:    $('fallback-warning'),
  dashboard:       $('weather-display'),
  heroCard:        $('hero-card'),
  heroBg:          $('hero-bg'),
  brandIcon:       $('brand-icon'),
  cityName:        $('city-name'),
  currentDate:     $('current-date'),
  temperature:     $('temperature'),
  currentUnit:     $('current-unit'),
  weatherIcon:     $('weather-icon'),
  weatherDesc:     $('weather-description'),
  weatherHL:       $('weather-high-low'),
  feelsLike:       $('feels-like-badge'),
  humidityBadge:   $('humidity-badge'),
  uvBadge:         $('uv-badge'),
  pressureBadge:   $('pressure-badge'),
  sunrise:         $('sunrise'),
  sunset:          $('sunset'),
  sunFill:         $('sun-fill'),
  sunDot:          $('sun-dot'),
  windSpeedH:      $('wind-speed'),
  visibilityEl:    $('visibility'),
  timezone:        $('timezone'),
  dewPoint:        $('dew-point'),
  hourlyContainer: $('hourly-container'),
  dailyContainer:  $('daily-container'),
  aqiValue:        $('aqi-value'),
  aqiLabel:        $('aqi-label'),
  aqiArc:          $('aqi-arc'),
  aqiTip:          $('aqi-health-tip'),
  pm25:            $('pm25'),
  pm10:            $('pm10'),
  o3:              $('o3'),
  no2:             $('no2'),
  so2:             $('so2'),
  co:              $('co'),
  windNeedle:      $('wind-needle'),
  windDir:         $('wind-direction'),
  windSpeedD:      $('wind-speed-detail'),
  windGust:        $('wind-gust'),
  weatherChart:    $('weather-chart'),
  weatherMap:      $('weather-map'),
  lastUpdated:     $('last-updated'),
  lastUpdatedFoot: $('last-updated-footer'),
  // New enterprise elements
  greeting:        $('dynamic-greeting'),
  aiInsight:       $('ai-insight-card'),
  aiInsightText:   $('ai-insight-text'),
  alertStrip:      $('alert-strip'),
  alertContent:    $('alert-content'),
  uvBar:           $('uv-bar'),
  uvValue:         $('uv-value'),
  uvLabel:         $('uv-label'),
  recentContainer: $('recent-searches'),
  pwaInstallBtn:   $('pwa-install-btn'),
  mapLayerBtns:    null,
  chartSection:    null,
};

// ─── WEATHER ICON MAPPING ─────────────────────────────────────────────
function getWeatherConditionClass(weatherId, hour) {
  const now = new Date();
  const h = hour !== undefined ? hour : now.getHours();
  const isNight = h < 6 || h > 20;

  if (weatherId >= 200 && weatherId < 300) return 'weather-storm';
  if (weatherId >= 300 && weatherId < 600) return 'weather-rain';
  if (weatherId >= 600 && weatherId < 700) return 'weather-snow';
  if (weatherId >= 700 && weatherId < 800) return 'weather-fog';
  if (weatherId === 800) {
    if (isNight) return 'weather-clear-night';
    if (h < 7) return 'weather-dawn';
    if (h > 18) return 'weather-dusk';
    return 'weather-clear-day';
  }
  if (weatherId > 800) return 'weather-cloudy';
  return '';
}

function getConditionEmoji(weatherId, isNight) {
  if (weatherId >= 200 && weatherId < 300) return '⛈️';
  if (weatherId >= 300 && weatherId < 400) return '🌧️';
  if (weatherId >= 500 && weatherId < 600) return '🌧️';
  if (weatherId >= 600 && weatherId < 700) return '❄️';
  if (weatherId >= 700 && weatherId < 800) return '🌫️';
  if (weatherId === 800) return isNight ? '🌙' : '☀️';
  if (weatherId === 801 || weatherId === 802) return isNight ? '🌤️' : '⛅';
  if (weatherId >= 803) return '☁️';
  return '🌡️';
}

// ─── CANVAS PARTICLE ANIMATIONS ───────────────────────────────────────
function initCanvas() {
  const canvas = el.canvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  state.canvasCtx = ctx;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', debounce(resize, 200));
}

function clearParticles() {
  if (state.animFrame) cancelAnimationFrame(state.animFrame);
  state.particles = [];
  if (state.canvasCtx) {
    state.canvasCtx.clearRect(0, 0, el.canvas.width, el.canvas.height);
  }
}

function startRainAnimation() {
  clearParticles();
  const ctx = state.canvasCtx;
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;

  for (let i = 0; i < 180; i++) {
    state.particles.push({
      x: Math.random() * W(),
      y: Math.random() * H(),
      len: Math.random() * 20 + 10,
      speed: Math.random() * 8 + 6,
      opacity: Math.random() * 0.4 + 0.1,
      width: Math.random() * 1.5 + 0.3,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    ctx.strokeStyle = 'rgba(147,197,253,0.5)';
    state.particles.forEach(p => {
      ctx.beginPath();
      ctx.globalAlpha = p.opacity;
      ctx.lineWidth = p.width;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 2, p.y + p.len);
      ctx.stroke();
      p.y += p.speed;
      if (p.y > H()) { p.y = -p.len; p.x = Math.random() * W(); }
    });
    ctx.globalAlpha = 1;
    state.animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startSnowAnimation() {
  clearParticles();
  const ctx = state.canvasCtx;
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;

  for (let i = 0; i < 120; i++) {
    state.particles.push({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 4 + 1,
      speed: Math.random() * 1.5 + 0.3,
      drift: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.6 + 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    state.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226,232,240,${p.opacity})`;
      ctx.fill();
      p.y += p.speed;
      p.x += p.drift;
      if (p.y > H()) { p.y = -5; p.x = Math.random() * W(); }
    });
    state.animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startStarsAnimation() {
  clearParticles();
  const ctx = state.canvasCtx;
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;

  for (let i = 0; i < 200; i++) {
    state.particles.push({
      x: Math.random() * W(),
      y: Math.random() * H() * 0.7,
      r: Math.random() * 1.5 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    state.particles.forEach(p => {
      p.twinkle += p.speed;
      const alpha = 0.3 + 0.5 * Math.sin(p.twinkle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,232,255,${alpha})`;
      ctx.fill();
    });
    state.animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startStormAnimation() {
  clearParticles();
  const ctx = state.canvasCtx;
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;
  let lightningTimer = 0;
  let lightningAlpha = 0;

  for (let i = 0; i < 200; i++) {
    state.particles.push({
      x: Math.random() * W(), y: Math.random() * H(),
      len: Math.random() * 25 + 12, speed: Math.random() * 12 + 8,
      opacity: Math.random() * 0.35 + 0.05, width: Math.random() * 1.5,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    // Rain
    ctx.strokeStyle = 'rgba(100,150,200,0.4)';
    state.particles.forEach(p => {
      ctx.beginPath();
      ctx.globalAlpha = p.opacity;
      ctx.lineWidth = p.width;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y + p.len);
      ctx.stroke();
      p.y += p.speed;
      if (p.y > H()) { p.y = -p.len; p.x = Math.random() * W(); }
    });
    // Lightning flash
    lightningTimer++;
    if (lightningTimer > 180 + Math.random() * 120) {
      lightningAlpha = 0.15;
      lightningTimer = 0;
    }
    if (lightningAlpha > 0) {
      ctx.globalAlpha = lightningAlpha;
      ctx.fillStyle = 'rgba(200,200,255,1)';
      ctx.fillRect(0, 0, W(), H());
      lightningAlpha -= 0.015;
    }
    ctx.globalAlpha = 1;
    state.animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function startFogAnimation() {
  clearParticles();
  const ctx = state.canvasCtx;
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;

  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x: Math.random() * W() * 1.5 - W() * 0.25,
      y: Math.random() * H(),
      r: Math.random() * 150 + 80,
      speed: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
      opacity: Math.random() * 0.06 + 0.02,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W(), H());
    state.particles.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(180,200,220,${p.opacity})`);
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      p.x += p.speed;
      if (p.x > W() + 200) p.x = -200;
      if (p.x < -200) p.x = W() + 200;
    });
    state.animFrame = requestAnimationFrame(draw);
  }
  draw();
}

function applyWeatherTheme(weatherId) {
  const h = new Date().getHours();
  const isNight = h < 6 || h > 20;
  const klass = getWeatherConditionClass(weatherId, h);

  // Remove all weather classes
  document.body.classList.remove(
    'weather-clear-day','weather-clear-night','weather-dawn','weather-dusk',
    'weather-cloudy','weather-rain','weather-storm','weather-snow','weather-fog'
  );
  if (klass) document.body.classList.add(klass);

  // Brand icon
  if (el.brandIcon) el.brandIcon.textContent = getConditionEmoji(weatherId, isNight);

  // Canvas effects
  if (weatherId >= 200 && weatherId < 300) return startStormAnimation();
  if (weatherId >= 300 && weatherId < 600) return startRainAnimation();
  if (weatherId >= 600 && weatherId < 700) return startSnowAnimation();
  if (weatherId >= 700 && weatherId < 800) return startFogAnimation();
  if (weatherId === 800 && isNight) return startStarsAnimation();
  clearParticles();
}

// ─── UPDATE HERO CARD ──────────────────────────────────────────────────
function updateHero(weather) {
  const w = weather;
  const isMetric = state.units === 'metric';
  const mainWeather = w.weather?.[0];
  const h = new Date().getHours();
  const isNight = h < 6 || h > 20;

  el.cityName.textContent = `${w.name}${w.sys?.country ? ', ' + w.sys.country : ''}`;
  el.currentDate.textContent = formatDate(new Date());
  el.temperature.textContent = Math.round(w.main.temp);
  el.currentUnit.textContent = isMetric ? '°C' : '°F';

  if (mainWeather) {
    el.weatherIcon.src = `https://openweathermap.org/img/wn/${mainWeather.icon}@2x.png`;
    el.weatherIcon.alt = mainWeather.description;
    el.weatherDesc.textContent = mainWeather.description;
    applyWeatherTheme(mainWeather.id);
  }

  el.weatherHL.textContent = `H:${Math.round(w.main.temp_max)}° L:${Math.round(w.main.temp_min)}°`;
  el.feelsLike.textContent  = `${Math.round(w.main.feels_like)}°`;
  el.humidityBadge.textContent = `${w.main.humidity}%`;
  el.pressureBadge.textContent = `${w.main.pressure} hPa`;
  el.uvBadge.textContent = '—'; // UV from One Call API (not free tier)

  // Sunrise/Sunset timeline
  if (w.sys) {
    const srDate = new Date(w.sys.sunrise * 1000);
    const ssDate = new Date(w.sys.sunset  * 1000);
    el.sunrise.textContent = formatTime(srDate);
    el.sunset.textContent  = formatTime(ssDate);

    const now  = Date.now();
    const dawn = w.sys.sunrise * 1000;
    const dusk = w.sys.sunset  * 1000;
    const pct  = Math.max(0, Math.min(1, (now - dawn) / (dusk - dawn)));
    el.sunFill.style.width = `${pct * 100}%`;
    el.sunDot.style.left   = `${pct * 100}%`;
  }

  // Detail items
  if (isMetric) {
    el.windSpeedH.textContent = `${(w.wind.speed * 3.6).toFixed(1)} km/h`;
    el.visibilityEl.textContent = `${(w.visibility / 1000).toFixed(1)} km`;
  } else {
    el.windSpeedH.textContent = `${w.wind.speed.toFixed(1)} mph`;
    el.visibilityEl.textContent = `${(w.visibility / 1609.34).toFixed(1)} mi`;
  }

  // Timezone
  const tzOffset = w.timezone; // seconds
  const tzH = Math.floor(Math.abs(tzOffset) / 3600);
  const tzM = Math.floor((Math.abs(tzOffset) % 3600) / 60);
  el.timezone.textContent = `UTC${tzOffset >= 0 ? '+' : '-'}${String(tzH).padStart(2,'0')}:${String(tzM).padStart(2,'0')}`;

  // Dew Point (approx from humidity and temp)
  const dewC = w.main.temp - ((100 - w.main.humidity) / 5);
  el.dewPoint.textContent = isMetric
    ? `${Math.round(dewC)}°C`
    : `${Math.round(dewC * 9/5 + 32)}°F`;

  // Last updated
  const ts = new Date();
  const upd = `Updated ${ts.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  if (el.lastUpdated) el.lastUpdated.textContent = upd;
  if (el.lastUpdatedFoot) el.lastUpdatedFoot.textContent = upd;

  // Wind compass
  updateWindCompass(w.wind);

  // Favorite button
  if (el.favBtn) {
    el.favBtn.classList.remove('hidden');
    const cityKey = `${Math.round(w.coord?.lat || 0)},${Math.round(w.coord?.lon || 0)}`;
    const isFav = state.favorites.some(f => f.key === cityKey);
    el.favBtn.textContent = isFav ? '★ Saved' : '☆ Save Location';
    el.favBtn.classList.toggle('active', isFav);
    el.favBtn.onclick = () => toggleFavorite(w, cityKey);
  }
}

// ─── WIND COMPASS ──────────────────────────────────────────────────────
function updateWindCompass(wind) {
  if (!wind) return;
  const deg = wind.deg || 0;
  if (el.windNeedle) {
    el.windNeedle.style.transition = 'transform 1s cubic-bezier(0.4,0,0.2,1)';
    el.windNeedle.setAttribute('transform', `rotate(${deg} 100 100)`);
  }

  const dirName = getWindDirection(deg);
  if (el.windDir) el.windDir.textContent = `${dirName} ${deg}°`;

  const isMetric = state.units === 'metric';
  if (el.windSpeedD) {
    el.windSpeedD.textContent = isMetric
      ? `${(wind.speed * 3.6).toFixed(1)} km/h`
      : `${wind.speed.toFixed(1)} mph`;
  }
  if (el.windGust) {
    const gust = wind.gust || wind.speed;
    el.windGust.textContent = isMetric
      ? `${(gust * 3.6).toFixed(1)} km/h`
      : `${gust.toFixed(1)} mph`;
  }
}

// ─── HOURLY FORECAST ──────────────────────────────────────────────────
function renderHourly(forecast) {
  if (!el.hourlyContainer || !forecast?.list) return;
  const items = forecast.list.slice(0, 9);
  const now = new Date();

  el.hourlyContainer.innerHTML = items.map((item, i) => {
    const dt    = new Date(item.dt * 1000);
    const isNow = i === 0;
    const temp  = Math.round(item.main.temp);
    const icon  = item.weather?.[0]?.icon;
    const pop   = item.pop > 0 ? `💧 ${Math.round(item.pop * 100)}%` : '';
    const timeLabel = isNow ? 'NOW' : formatTime(dt);

    return `<div class="hourly-item${isNow ? ' current-hour' : ''}">
      <span class="hourly-time">${timeLabel}</span>
      <span class="hourly-icon">
        ${icon ? `<img src="https://openweathermap.org/img/wn/${icon}.png" alt="${item.weather?.[0]?.description || ''}" loading="lazy">` : '🌡️'}
      </span>
      <span class="hourly-temp">${temp}°</span>
      ${pop ? `<span class="hourly-pop">${pop}</span>` : '<span class="hourly-pop"> </span>'}
    </div>`;
  }).join('');
}

// ─── 7-DAY FORECAST ──────────────────────────────────────────────────
function renderDaily(forecast) {
  if (!el.dailyContainer || !forecast?.list) return;

  // Group by day
  const dayMap = {};
  forecast.list.forEach(item => {
    const d = new Date(item.dt * 1000);
    const key = d.toDateString();
    if (!dayMap[key]) {
      dayMap[key] = { date: d, items: [], maxTemp: -Infinity, minTemp: Infinity, icon: item.weather?.[0]?.icon, desc: item.weather?.[0]?.description, pop: 0 };
    }
    dayMap[key].maxTemp = Math.max(dayMap[key].maxTemp, item.main.temp_max || item.main.temp);
    dayMap[key].minTemp = Math.min(dayMap[key].minTemp, item.main.temp_min || item.main.temp);
    dayMap[key].pop     = Math.max(dayMap[key].pop, item.pop || 0);
    // Use midday icon if available
    if (d.getHours() >= 11 && d.getHours() <= 14 && item.weather?.[0]?.icon) {
      dayMap[key].icon = item.weather[0].icon;
      dayMap[key].desc = item.weather[0].description;
    }
  });

  const days = Object.values(dayMap).slice(0, 7);
  const today = new Date().toDateString();

  el.dailyContainer.innerHTML = days.map(day => {
    const isToday = day.date.toDateString() === today;
    const dayName = isToday ? 'Today' : day.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const pop     = day.pop > 0 ? `💧${Math.round(day.pop * 100)}%` : '';
    return `<div class="daily-item">
      <span class="daily-day">${dayName}</span>
      <div class="daily-condition">
        ${day.icon ? `<img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.desc}" loading="lazy">` : ''}
        <span class="daily-desc">${day.desc || ''}</span>
      </div>
      <span class="daily-pop">${pop}</span>
      <div class="daily-temps">
        <span class="daily-max">${Math.round(day.maxTemp)}°</span>
        <span class="daily-min">${Math.round(day.minTemp)}°</span>
      </div>
    </div>`;
  }).join('');
}

// ─── AQI ─────────────────────────────────────────────────────────────
const AQI_CONFIG = [
  { max: 50,  label: 'Good',        color: '#10b981', tip: 'Air quality is excellent. Enjoy outdoor activities!' },
  { max: 100, label: 'Fair',        color: '#fbbf24', tip: 'Air quality is acceptable for most people.' },
  { max: 150, label: 'Moderate',    color: '#f97316', tip: 'Sensitive groups may be affected.' },
  { max: 200, label: 'Poor',        color: '#ef4444', tip: 'Everyone may experience health effects. Limit outdoors.' },
  { max: 300, label: 'Very Poor',   color: '#a855f7', tip: 'Health alert! Avoid prolonged outdoor exposure.' },
  { max: 500, label: 'Hazardous',   color: '#7c3aed', tip: 'Emergency conditions. Stay indoors.' },
];

function getAQIConfig(aqi) {
  // OWM AQI scale: 1-5
  const aqiNum = aqi * 50;
  return AQI_CONFIG.find(c => aqiNum <= c.max) || AQI_CONFIG[AQI_CONFIG.length - 1];
}

function renderAQI(aqiData) {
  if (!aqiData?.list?.[0]) return;
  const item = aqiData.list[0];
  const aqi  = item.main.aqi;
  const comp = item.components;
  const cfg  = getAQIConfig(aqi);
  const aqiDisplay = aqi * 50;

  if (el.aqiValue) el.aqiValue.textContent = aqiDisplay;
  if (el.aqiLabel) {
    el.aqiLabel.textContent = cfg.label;
    el.aqiLabel.style.background = cfg.color + '33';
    el.aqiLabel.style.color = cfg.color;
    el.aqiLabel.style.borderColor = cfg.color + '66';
  }
  if (el.aqiTip) el.aqiTip.textContent = cfg.tip;

  // Animate AQI arc (326.7 = full circumference of r=52 SVG circle)
  if (el.aqiArc) {
    const pct = Math.min(1, aqiDisplay / 500);
    const dashOffset = 326.7 * (1 - pct);
    el.aqiArc.style.strokeDashoffset = dashOffset;
    el.aqiArc.style.stroke = cfg.color;
  }

  // Components
  const fmt = v => v != null ? v.toFixed(1) : '—';
  if (el.pm25) el.pm25.textContent = `${fmt(comp.pm2_5)} µg/m³`;
  if (el.pm10) el.pm10.textContent = `${fmt(comp.pm10)} µg/m³`;
  if (el.o3)   el.o3.textContent   = `${fmt(comp.o3)} µg/m³`;
  if (el.no2)  el.no2.textContent  = `${fmt(comp.no2)} µg/m³`;
  if (el.so2)  el.so2.textContent  = `${fmt(comp.so2)} µg/m³`;
  if (el.co)   el.co.textContent   = `${fmt(comp.co)} µg/m³`;
}

// ─── TEMPERATURE CHART ────────────────────────────────────────────────
function renderChart(forecast) {
  if (!el.weatherChart || !forecast?.list) return;

  const items  = forecast.list.slice(0, 9);
  const labels = items.map(item => formatTime(new Date(item.dt * 1000)));
  const temps  = items.map(item => Math.round(item.main.temp));
  const feels  = items.map(item => Math.round(item.main.feels_like));
  const pops   = items.map(item => Math.round((item.pop || 0) * 100));

  if (state.chart) { state.chart.destroy(); state.chart = null; }

  const isDark = state.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#bbc9cf' : '#3a5068';

  const ctx = el.weatherChart.getContext('2d');

  const tempGrad = ctx.createLinearGradient(0, 0, 0, 220);
  tempGrad.addColorStop(0, 'rgba(0,212,255,0.35)');
  tempGrad.addColorStop(1, 'rgba(0,212,255,0)');

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: `Temp (${state.units === 'metric' ? '°C' : '°F'})`,
          data: temps,
          borderColor: '#00d4ff',
          backgroundColor: tempGrad,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#00d4ff',
          pointBorderColor: isDark ? '#0e1322' : '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Feels Like',
          data: feels,
          borderColor: 'rgba(168,232,255,0.5)',
          borderWidth: 1.5,
          borderDash: [5,4],
          pointRadius: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Rain %',
          data: pops,
          borderColor: 'rgba(96,165,250,0.7)',
          backgroundColor: 'rgba(96,165,250,0.1)',
          borderWidth: 1.5,
          pointRadius: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Inter', size: 11 }, padding: 14, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: isDark ? '#1a1f2f' : '#fff',
          titleColor: isDark ? '#dee1f7' : '#0d1b3e',
          bodyColor: isDark ? '#bbc9cf' : '#3a5068',
          borderColor: 'rgba(0,212,255,0.3)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
        },
        y: {
          position: 'left',
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter', size: 10 } },
        },
        y1: {
          position: 'right',
          min: 0, max: 100,
          grid: { drawOnChartArea: false },
          ticks: {
            color: 'rgba(96,165,250,0.7)',
            font: { family: 'Inter', size: 10 },
            callback: v => v + '%',
          },
        },
      },
    },
  });
}

// ─── WEATHER MAP ──────────────────────────────────────────────────────
function initMap(lat, lon) {
  const mapEl = el.weatherMap;
  if (!mapEl) return;

  if (state.map) {
    state.map.setView([lat, lon], 8);
    if (state.mapMarker) state.mapMarker.setLatLng([lat, lon]);
    return;
  }

  state.map = L.map(mapEl, { zoomControl: true, attributionControl: false }).setView([lat, lon], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
  }).addTo(state.map);

  // Precipitation layer from OWM
  L.tileLayer(
    `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=ce297ed447c02eab76c9d89693653c5b`,
    { opacity: 0.6, maxZoom: 18 }
  ).addTo(state.map);

  const cityIcon = L.divIcon({
    html: `<div style="background:linear-gradient(135deg,#0e1322,#00d4ff33);border:2px solid #00d4ff;border-radius:50% 50% 50% 0;width:24px;height:24px;transform:rotate(-45deg);box-shadow:0 0 12px rgba(0,212,255,0.5)"></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  state.mapMarker = L.marker([lat, lon], { icon: cityIcon })
    .addTo(state.map)
    .bindPopup(state.currentCity || 'Location');
}

// ─── FAVORITES ────────────────────────────────────────────────────────
function toggleFavorite(weather, key) {
  const idx = state.favorites.findIndex(f => f.key === key);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.push({
      key,
      name: `${weather.name}, ${weather.sys?.country || ''}`,
      lat: weather.coord?.lat,
      lon: weather.coord?.lon,
      icon: weather.weather?.[0]?.icon,
    });
  }
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
  renderFavorites();
  // Update button
  if (el.favBtn) {
    const isFav = state.favorites.some(f => f.key === key);
    el.favBtn.textContent = isFav ? '★ Saved' : '☆ Save Location';
    el.favBtn.classList.toggle('active', isFav);
  }
}

function renderFavorites() {
  if (!el.favContainer) return;
  if (state.favorites.length === 0) {
    el.favoritesBar.classList.add('hidden');
    return;
  }
  el.favoritesBar.classList.remove('hidden');
  el.favContainer.innerHTML = state.favorites.map(f => `
    <button class="fav-chip" data-lat="${f.lat}" data-lon="${f.lon}" data-name="${f.name}">
      ${f.icon ? `<img src="https://openweathermap.org/img/wn/${f.icon}.png" width="16" height="16" style="vertical-align:middle">` : '📍'} ${f.name}
    </button>
  `).join('');

  el.favContainer.querySelectorAll('.fav-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const lat  = parseFloat(chip.dataset.lat);
      const lon  = parseFloat(chip.dataset.lon);
      const name = chip.dataset.name;
      fetchAllData(lat, lon, name);
    });
  });
}

// ─── RECENT SEARCHES ─────────────────────────────────────────────────
function addToRecentSearches(name, lat, lon, icon) {
  const entry = { name, lat, lon, icon: icon || '', ts: Date.now() };
  state.recentSearches = [entry, ...state.recentSearches.filter(r => r.name !== name)].slice(0, 6);
  localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  if (!el.recentContainer) return;
  if (!state.recentSearches.length) {
    el.recentContainer.classList.add('hidden');
    return;
  }
  el.recentContainer.classList.remove('hidden');
  el.recentContainer.innerHTML =
    `<div class="recent-header">🕐 Recent</div>` +
    state.recentSearches.map(r =>
      `<div class="autocomplete-item recent-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}">
        ${r.icon ? `<img src="https://openweathermap.org/img/wn/${r.icon}.png" width="16" height="16" style="vertical-align:middle;margin-right:4px">` : '🕐'}
        ${r.name}
      </div>`
    ).join('');
  el.recentContainer.querySelectorAll('.recent-item').forEach(it => {
    it.addEventListener('click', () => {
      el.cityInput.value = it.dataset.name;
      showAutocomplete(false);
      fetchAllData(parseFloat(it.dataset.lat), parseFloat(it.dataset.lon), it.dataset.name);
    });
  });
}

// ─── SEARCH AUTOCOMPLETE ──────────────────────────────────────────────
// Postal code pattern detector
function isPostalCode(q) {
  return (
    /^\d{4,6}$/.test(q) ||                               // IN, DE, FR, AU (4-6 digits)
    /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(q) || // UK SW1A 1AA
    /^\d{5}(-\d{4})?$/.test(q) ||                        // US 10001 or 10001-1234
    /^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i.test(q) ||            // CA A1B 2C3
    /^\d{4,6}[,\s]+[A-Z]{2}$/i.test(q)                  // 400001,IN or 400001 IN
  );
}

const handleSearchInput = debounce(async (query) => {
  if (!query || query.trim().length < 2) {
    // Show recent searches when input is empty/cleared
    if (state.recentSearches.length > 0) {
      renderRecentSearches();
      showAutocomplete(true);
    } else {
      showAutocomplete(false);
    }
    return;
  }
  try {
    const geo = await api.fetchGeo(query);
    if (!geo || geo.length === 0) {
      // If nothing found and looks like postal code, show hint
      if (isPostalCode(query.trim())) {
        el.autocomplete.innerHTML = `<div class="autocomplete-item autocomplete-hint">📮 Try adding country: "${query.trim()},IN" or "${query.trim()},US"</div>`;
        showAutocomplete(true);
      } else {
        showAutocomplete(false);
      }
      return;
    }
    showAutoList(geo);
  } catch { showAutocomplete(false); }
}, 320);

function showAutoList(items) {
  el.autocomplete.innerHTML = items.map((item, i) => {
    const label = item.zip
      ? `📮 ${item.zip} — ${item.name}${item.country ? ', ' + item.country : ''}`
      : `📍 ${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`;
    return `<div class="autocomplete-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.zip ? item.zip + ' — ' + item.name + ', ' + item.country : item.name + (item.state ? ', ' + item.state : '') + ', ' + item.country}">
      ${label}
    </div>`;
  }).join('');
  showAutocomplete(true);

  el.autocomplete.querySelectorAll('.autocomplete-item:not(.autocomplete-hint)').forEach(it => {
    it.addEventListener('click', () => {
      const lat  = parseFloat(it.dataset.lat);
      const lon  = parseFloat(it.dataset.lon);
      const name = it.dataset.name;
      el.cityInput.value = name;
      showAutocomplete(false);
      fetchAllData(lat, lon, name);
    });
  });
}

function showAutocomplete(show) {
  el.autocomplete.classList.toggle('hidden', !show);
}

// ─── LOADING / ERROR / FALLBACK ───────────────────────────────────────
function showLoading(msg = 'Fetching atmospheric data...') {
  el.loading.classList.remove('hidden');
  el.loadingMsg.textContent = msg;
  el.error.classList.add('hidden');
  el.dashboard.classList.add('hidden');
}

function hideLoading() {
  el.loading.classList.add('hidden');
}

function showError(msg, retryFn) {
  el.error.classList.remove('hidden');
  el.errorText.textContent = msg;
  el.loading.classList.add('hidden');
  state.lastRetryFn = retryFn || null;
}

function hideError() {
  el.error.classList.add('hidden');
}

function showDashboard() {
  el.dashboard.classList.remove('hidden');
  hideLoading();
  hideError();
}

function showFallbackWarning(show) {
  el.fallbackWarn.classList.toggle('hidden', !show);
}

// ─── MAIN DATA FETCH ──────────────────────────────────────────────────
async function fetchAllData(lat, lon, cityName) {
  showLoading(`Loading weather for ${cityName}...`);
  state.currentCity  = cityName;
  state.currentCoords = { lat, lon };

  try {
    const [weatherRes, forecastRes, aqiRes] = await Promise.all([
      api.fetchWeather(lat, lon, state.units),
      api.fetchForecast(lat, lon, state.units),
      api.fetchAQI(lat, lon).catch(() => null),
    ]);

    // Unwrap .data from {success, data} response envelopes
    const weather  = weatherRes?.data  || weatherRes;
    const forecast = forecastRes?.data  || forecastRes;
    const aqiData  = aqiRes?.data      || aqiRes;

    state.currentWeather  = weather;
    state.currentForecast = forecast;
    state.currentAQI      = aqiData;

    const isFallback = weather?.name?.includes('(Fallback)') || weather?.name?.includes('Fallback');
    showFallbackWarning(!!isFallback);

    updateHero(weather);
    renderHourly(forecast);
    renderDaily(forecast);
    renderChart(forecast);
    if (aqiData?.list?.length > 0) renderAQI(aqiData);
    initMap(lat, lon);
    showDashboard();

    // Persist last location
    localStorage.setItem('lastCoords', JSON.stringify({ lat, lon }));
    localStorage.setItem('lastCity',   cityName);

    // — NEW ENTERPRISE FEATURES —
    // Save to recent searches
    const icon = state.currentWeather?.weather?.[0]?.icon || '';
    addToRecentSearches(cityName, lat, lon, icon);

    // Update dynamic greeting
    updateGreeting();

    // AI Insight
    renderAIInsight(state.currentWeather, state.currentForecast, state.currentAQI);

    // UV Index
    if (state.currentWeather?.uvi != null) {
      renderUVIndex(state.currentWeather.uvi);
    }

    // Weather alerts (from forecast data if available)
    const alerts = state.currentForecast?._alerts || state.currentWeather?._alerts || [];
    renderAlertsStrip(alerts);

    // Scroll animations
    initScrollReveal();

  } catch (error) {
    console.error('fetchAllData error:', error);
    hideLoading();
    showError(
      error.message || 'Failed to fetch weather data. Please try again.',
      () => fetchAllData(lat, lon, cityName)
    );
  }
}

// ─── SEARCH ──────────────────────────────────────────────────────────
async function handleSearch(query) {
  const q = (query || el.cityInput.value || '').trim();
  if (!q || q.length < 2) {
    showError('Please enter at least 2 characters');
    return;
  }

  showLoading(`Searching for "${q}"...`);
  showAutocomplete(false);

  try {
    // Smart-geo endpoint handles both city names and postal/ZIP codes automatically
    const geo = await api.fetchGeo(q);
    if (!geo || geo.length === 0) {
      const errCode = geo?._apiError;
      let msg;
      if (errCode === 'API_KEY_INVALID') msg = '⚠️ API key is invalid.';
      else if (errCode === 'NOT_FOUND') msg = `📮 Postal code "${q}" not found. Try adding country code, e.g. "${q},IN"`.trim();
      else if (errCode === 'SERVICE_UNAVAILABLE') msg = 'Search unavailable. Try again shortly.';
      else if (isPostalCode(q)) msg = `📮 Postal code "${q}" not found. Try format: "${q},IN" or "${q},US"`.trim();
      else msg = `"${q}" not found. Check spelling or try adding country (e.g. Mumbai, IN).`;
      hideLoading();
      showError(msg, () => handleSearch(q));
      return;
    }
    const result = geo[0];
    // Build display name — use ZIP info if available
    let displayName;
    if (result.zip) {
      displayName = `${result.zip} — ${result.name}${result.country ? ', ' + result.country : ''}`;
    } else {
      displayName = `${result.name}${result.state ? ', ' + result.state : ''}, ${result.country}`;
    }
    el.cityInput.value = displayName;
    fetchAllData(result.lat, result.lon, displayName);
  } catch (err) {
    hideLoading();
    showError(err.message || 'Search failed. Please try again.', () => handleSearch(q));
  }
}

// ─── GEOLOCATION ─────────────────────────────────────────────────────
function handleGeolocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  showLoading('Getting your location...');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const geo = await api.fetchReverseGeo(lat, lon);
        const name = geo?.[0]
          ? `${geo[0].name}, ${geo[0].country}`
          : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        el.cityInput.value = name;
        fetchAllData(lat, lon, name);
      } catch {
        fetchAllData(lat, lon, `${lat.toFixed(2)}, ${lon.toFixed(2)}`);
      }
    },
    (err) => {
      hideLoading();
      showError(`Location access denied. ${err.message || ''}`, handleGeolocation);
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}

// ─── DYNAMIC GREETING ─────────────────────────────────────────────
function updateGreeting() {
  if (!el.greeting) return;
  const h = new Date().getHours();
  let g;
  if      (h >= 5  && h < 12) g = '☀️ Good Morning';
  else if (h >= 12 && h < 17) g = '⛅ Good Afternoon';
  else if (h >= 17 && h < 21) g = '🌅 Good Evening';
  else                         g = '🌙 Good Night';
  el.greeting.textContent = g;
}

// ─── AI WEATHER INSIGHT ────────────────────────────────────────────
function renderAIInsight(weather, forecast, aqiData) {
  if (!el.aiInsight || !el.aiInsightText || !weather) return;

  const wId   = weather.weather?.[0]?.id || 800;
  const temp  = Math.round(weather.main?.temp || 25);
  const hum   = weather.main?.humidity || 50;
  const wind  = (weather.wind?.speed || 0) * 3.6; // km/h
  const vis   = (weather.visibility || 10000) / 1000; // km
  const aqi   = aqiData?.list?.[0]?.main?.aqi || 1;
  const h     = new Date().getHours();
  const pop   = (forecast?.list?.[0]?.pop || 0) * 100; // rain chance %

  let insights = [];

  // Temperature advice
  if (temp >= 40)       insights.push('🔥 Extreme heat! Stay indoors 12–16h. Drink water every 30 min.');
  else if (temp >= 35)  insights.push(`☀️ Very hot (${temp}°). Apply SPF 50+ sunscreen. Stay hydrated.`);
  else if (temp <= 5)   insights.push('❄️ Very cold! Wear heavy layers and a waterproof jacket.');
  else if (temp <= 15)  insights.push(`🧥 Chilly (${temp}°). A jacket is recommended today.`);
  else                  insights.push(`🌡️ Comfortable ${temp}° — great weather for outdoor activities.`);

  // Rain advice
  if (wId >= 200 && wId < 300)  insights.push('⚡ Thunderstorm warning! Avoid open areas and tall trees.');
  else if (wId >= 300 && wId < 600) {
    if (pop > 70)     insights.push('☔ High rain chance! Carry an umbrella definitely.');
    else              insights.push('🌧️ Rain likely. Keep an umbrella handy.');
  } else if (pop > 50)           insights.push(`☔ ${Math.round(pop)}% chance of rain later — umbrella advised.`);
  else if (pop > 25)             insights.push(`🌦️ ${Math.round(pop)}% rain chance. Check forecast before going out.`);
  else if (wId === 800)          insights.push('💚 Clear skies all day — perfect for outdoor plans!');

  // Wind advice
  if (wind > 60)        insights.push('🌬️ Strong wind advisory! Avoid cycling and outdoor structures.');
  else if (wind > 30)   insights.push(`💨 Windy (${Math.round(wind)} km/h). Hold on to umbrellas and hats!`);

  // AQI advice
  if (aqi >= 4)         insights.push('😷 Poor air quality. Wear a mask and limit outdoor exposure.');
  else if (aqi === 3)   insights.push('🌫️ Moderate air quality. Sensitive groups should limit outdoor time.');

  // Best time to go out
  if (temp > 35 && h >= 9 && h <= 18) {
    insights.push('🕒 Best time to go out: Early morning (6–9 AM) or evening (after 6 PM).');
  }

  const finalText = insights.slice(0, 2).join(' · ');
  el.aiInsightText.textContent = finalText || '🌡️ Weather data loaded. Have a great day!';
  el.aiInsight.classList.remove('hidden');
}

// ─── UV INDEX ─────────────────────────────────────────────────────────
function renderUVIndex(uvi) {
  if (uvi == null) return;
  const rounded = Math.round(uvi);
  const pct     = Math.min(100, (uvi / 11) * 100);
  const labels  = ['Low','Low','Low','Moderate','Moderate','Moderate','High','High','Very High','Very High','Very High','Extreme'];
  const label   = labels[Math.min(11, rounded)] || 'Extreme';
  const colors  = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', 'Very High': '#dc2626', Extreme: '#7c3aed' };
  const color   = colors[label] || '#ef4444';

  if (el.uvBar) {
    el.uvBar.style.width  = `${pct}%`;
    el.uvBar.style.background = `linear-gradient(90deg, #10b981, #f59e0b, ${color})`;
  }
  if (el.uvValue)  el.uvValue.textContent  = rounded;
  if (el.uvLabel)  el.uvLabel.textContent  = label;
  if (el.uvLabel)  el.uvLabel.style.color  = color;
  // Also update uvBadge in hero section
  if ($('uv-badge-val')) $('uv-badge-val').textContent = rounded;
}

// ─── WEATHER ALERTS STRIP ───────────────────────────────────────────────
function renderAlertsStrip(alerts) {
  if (!el.alertStrip || !el.alertContent) return;

  // Generate smart alerts from weather data as fallback
  const smartAlerts = [];
  const w = state.currentWeather;
  if (w) {
    const temp  = Math.round(w.main?.temp || 0);
    const wind  = (w.wind?.speed || 0) * 3.6;
    const wId   = w.weather?.[0]?.id || 800;
    const aqi   = state.currentAQI?.list?.[0]?.main?.aqi || 1;

    if (temp >= 40)              smartAlerts.push({ icon:'🔥', color:'#ef4444', text:`Extreme Heat Alert: ${temp}° — heat index dangerously high. Stay hydrated!` });
    else if (temp <= 2)          smartAlerts.push({ icon:'🧣', color:'#60a5fa', text:`Freeze Warning: Temperature near 0°. Ice may form on roads.` });
    if (wId >= 200 && wId < 300) smartAlerts.push({ icon:'⚡', color:'#fbbf24', text:`Thunderstorm: Lightning risk. Stay indoors and away from windows.` });
    if (wind > 60)               smartAlerts.push({ icon:'🌬️', color:'#f97316', text:`High Wind Warning: ${Math.round(wind)} km/h gusts expected.` });
    if (aqi >= 4)                smartAlerts.push({ icon:'😷', color:'#a78bfa', text:`Air Quality Alert: Unhealthy levels. Limit outdoor exposure.` });
  }

  const allAlerts = [
    ...(alerts || []).map(a => ({ icon:'⚠️', color:'#f97316', text: a.event || a.description || JSON.stringify(a) })),
    ...smartAlerts,
  ];

  if (allAlerts.length === 0) {
    el.alertStrip.classList.add('hidden');
    return;
  }

  el.alertContent.innerHTML = allAlerts.map(a =>
    `<span class="alert-badge" style="border-color:${a.color}33;color:${a.color}">${a.icon} ${a.text}</span>`
  ).join('');
  el.alertStrip.classList.remove('hidden');
}

// ─── MAP LAYER SWITCHER ──────────────────────────────────────────────────
const OWM_LAYERS = {
  precipitation_new: '🌧️ Radar',
  wind_new:          '💨 Wind',
  temp_new:          '🌡️ Heat',
  clouds_new:        '☁️ Clouds',
  pressure_new:      '📊 Pressure',
};

function updateMapLayer(layerKey) {
  if (!state.map) return;
  const apiKey = 'ce297ed447c02eab76c9d89693653c5b';
  state.mapLayer = layerKey;

  // Remove existing overlay
  if (state.mapOverlay) {
    state.map.removeLayer(state.mapOverlay);
    state.mapOverlay = null;
  }

  state.mapOverlay = L.tileLayer(
    `https://tile.openweathermap.org/map/${layerKey}/{z}/{x}/{y}.png?appid=${apiKey}`,
    { opacity: 0.55, attribution: 'OWM', zIndex: 5 }
  ).addTo(state.map);

  // Update pill button states
  document.querySelectorAll('.map-layer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layer === layerKey);
  });
}

// ─── SCROLL REVEAL ────────────────────────────────────────────────────
function initScrollReveal() {
  const targets = document.querySelectorAll('[data-sr]');
  if (!targets.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('sr-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  targets.forEach(t => obs.observe(t));
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────
async function checkHealth() {

  try {
    const health = await api.checkApiHealth();
    const serverUp = health?.success === true;
    if (serverUp) {
      const testGeo = await api.fetchGeo('London').catch(() => null);
      const online  = testGeo && testGeo.length > 0;
      state._apiHealthy = online;
      setApiStatus(online);
    } else {
      state._apiHealthy = false;
      setApiStatus(false);
    }
  } catch {
    state._apiHealthy = false;
    setApiStatus(false);
  }
}

function setApiStatus(online) {
  if (el.apiDot) {
    el.apiDot.classList.toggle('online',  online);
    el.apiDot.classList.toggle('offline', !online);
    el.apiDot.title = online ? 'API: Online' : 'API: Offline';
  }
  if (el.apiStatus) {
    el.apiStatus.textContent = online ? '● Online' : '● Offline';
    el.apiStatus.style.color = online ? '#10b981' : '#ef4444';
  }
}

// ─── THEME ────────────────────────────────────────────────────────────
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const sunIcon  = el.themeToggle?.querySelector('.sun-icon');
  const moonIcon = el.themeToggle?.querySelector('.moon-icon');
  if (sunIcon)  sunIcon.classList.toggle('hidden',  theme === 'dark');
  if (moonIcon) moonIcon.classList.toggle('hidden', theme === 'light');
  // Re-render chart with new colors
  if (state.currentForecast) renderChart(state.currentForecast);
}

// ─── UNITS ────────────────────────────────────────────────────────────
function applyUnit(unit) {
  state.units = unit;
  localStorage.setItem('units', unit);
  el.unitC.classList.toggle('active', unit === 'metric');
  el.unitF.classList.toggle('active', unit === 'imperial');
  // Refetch data with new units
  if (state.currentCoords) {
    fetchAllData(state.currentCoords.lat, state.currentCoords.lon, state.currentCity);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────
function init() {
  // Apply saved preferences
  applyTheme(state.theme);
  el.unitC.classList.toggle('active', state.units === 'metric');
  el.unitF.classList.toggle('active', state.units === 'imperial');

  // Init canvas
  initCanvas();

  // Render favorites + recent searches
  renderFavorites();
  renderRecentSearches();

  // Dynamic greeting (update every minute)
  updateGreeting();
  setInterval(updateGreeting, 60 * 1000);

  // Check API health
  checkHealth();
  setInterval(checkHealth, 5 * 60 * 1000);

  // ── EVENT LISTENERS ──

  // Search input
  el.cityInput.addEventListener('input', e => handleSearchInput(e.target.value));
  el.cityInput.addEventListener('focus', () => {
    if (!el.cityInput.value && state.recentSearches.length > 0) {
      renderRecentSearches();
      showAutocomplete(true);
    }
  });
  el.cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { showAutocomplete(false); handleSearch(); }
    if (e.key === 'Escape') showAutocomplete(false);
  });

  // Location button
  el.locationBtn?.addEventListener('click', handleGeolocation);

  // Unit toggles
  el.unitC?.addEventListener('click', () => applyUnit('metric'));
  el.unitF?.addEventListener('click', () => applyUnit('imperial'));

  // Theme toggle
  el.themeToggle?.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Error buttons
  el.errorRetry?.addEventListener('click', () => {
    hideError();
    if (state.lastRetryFn) state.lastRetryFn();
  });
  el.errorDismiss?.addEventListener('click', hideError);

  // Close autocomplete on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-search')) showAutocomplete(false);
  });

  // Keyboard shortcut Ctrl+K / Cmd+K => focus search
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      el.cityInput?.focus();
    }
  });

  // Voice search
  document.getElementById('voice-search-btn')?.addEventListener('click', () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      showError('Voice search is not supported in this browser.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.start();
    document.getElementById('voice-search-btn').classList.add('listening');
    rec.onresult = e => {
      const phrase = e.results[0][0].transcript;
      el.cityInput.value = phrase;
      handleSearch(phrase);
    };
    rec.onend = () => document.getElementById('voice-search-btn').classList.remove('listening');
  });

  // Map layer switcher buttons
  document.querySelectorAll('.map-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => updateMapLayer(btn.dataset.layer));
  });

  // Alert strip dismiss
  document.getElementById('alert-dismiss-btn')?.addEventListener('click', () => {
    el.alertStrip?.classList.add('hidden');
  });

  // PWA install button
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (el.pwaInstallBtn) el.pwaInstallBtn.classList.remove('hidden');
  });
  el.pwaInstallBtn?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') el.pwaInstallBtn?.classList.add('hidden');
      deferredInstallPrompt = null;
    }
  });

  // Auto-refresh every 10 minutes
  setInterval(() => {
    if (state.currentCoords && !el.loading.classList.contains('hidden') === false) {
      fetchAllData(state.currentCoords.lat, state.currentCoords.lon, state.currentCity);
    }
  }, 10 * 60 * 1000);

  // ── INITIAL LOAD ──
  const savedCoords = JSON.parse(localStorage.getItem('lastCoords') || 'null');
  const savedCity   = localStorage.getItem('lastCity') || '';

  if (savedCoords) {
    fetchAllData(savedCoords.lat, savedCoords.lon, savedCity || 'Current Location');
  } else {
    fetchAllData(19.076, 72.877, 'Mumbai, Maharashtra, IN');
    el.cityInput.value = 'Mumbai, Maharashtra, IN';
  }
}

// Start the app
init();
