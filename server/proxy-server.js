/**
 * WeatherNow - Backend Proxy Server
 * 
 * Secure API proxy to hide OpenWeatherMap API key
 * Features: Rate limiting, caching, error handling
 * 
 * SETUP:
 * 1. npm install express cors dotenv express-rate-limit node-cache
 * 2. Create .env file with OPENWEATHER_API_KEY
 * 3. node server.js
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache for API responses (10 minutes)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Environment variables - API key from env var (set in Render dashboard)
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Validate API key
if (!API_KEY) {
  console.error('❌ OPENWEATHER_API_KEY environment variable is not set!');
  console.error('📝 Please add it in your Render dashboard: Service > Environment > Add Variable');
  console.error('🔑 Key: OPENWEATHER_API_KEY, Value: your_openweathermap_api_key');
  process.exit(1);
}

console.log('✅ API Key loaded successfully');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://192.168.1.0/24', // Local network
    /^http:\/\/192\.168\..*/, // Local network IP range
    'https://weather-website-yf9y.onrender.com', // Production URL
    'https://weather-website-yj9y.onrender.com', // Old production URL
    // Add your GitHub Pages URL here when you have it
    // 'https://yourusername.github.io',
    // 'https://yourusername.github.io/weather-website'
  ],
  credentials: true
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Weather endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, units = 'metric', lang = 'en' } = req.query;

    // Validate parameters
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon'
      });
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return res.status(400).json({
        error: 'Invalid coordinates. lat and lon must be numbers.'
      });
    }

    // Check cache
    const cacheKey = `weather:${lat}:${lon}:${units}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for weather data');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${API_KEY}&units=${units}&lang=${lang}`;
    
    console.log('🌐 Fetching weather from API:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 404) {
        throw new Error('Location not found');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data);
    
    console.log('✅ Weather data fetched and cached');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Weather API error:', error.message);
    
    res.status(error.message.includes('API key') ? 401 : 500).json({
      error: error.message || 'Failed to fetch weather data'
    });
  }
});

// One Call API endpoint (forecast, historical)
app.get('/api/onecall', async (req, res) => {
  try {
    const { lat, lon, exclude, units = 'metric', lang = 'en' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon'
      });
    }

    // Check cache
    const cacheKey = `onecall:${lat}:${lon}:${units}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for onecall data');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=${exclude || ''}&appid=${API_KEY}&units=${units}&lang=${lang}`;
    
    console.log('🌐 Fetching onecall from API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data);
    
    console.log('✅ Onecall data fetched and cached');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Onecall API error:', error.message);
    
    res.status(error.message.includes('API key') ? 401 : 500).json({
      error: error.message || 'Failed to fetch forecast data'
    });
  }
});

// Geocoding endpoint
app.get('/api/geo', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Missing required parameter: q (query)'
      });
    }

    // Check cache
    const cacheKey = `geo:${q}:${limit}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for geocoding');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap
    const url = `https://api.openweathermap.org/geo/1.0?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;
    
    console.log('🌐 Fetching geocoding from API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data);
    
    console.log('✅ Geocoding data fetched and cached');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Geocoding API error:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to fetch location data'
    });
  }
});

// Reverse geocoding endpoint
app.get('/api/reverse-geo', async (req, res) => {
  try {
    const { lat, lon, limit = 1 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon'
      });
    }

    // Check cache
    const cacheKey = `reverse:${lat}:${lon}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for reverse geocoding');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=${limit}&appid=${API_KEY}`;
    
    console.log('🌐 Fetching reverse geocoding from API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data[0] || null);
    
    console.log('✅ Reverse geocoding data fetched and cached');
    
    res.json(data[0] || null);
  } catch (error) {
    console.error('❌ Reverse geocoding API error:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to fetch location data'
    });
  }
});

// Air pollution endpoint
app.get('/api/air-pollution', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon'
      });
    }

    // Check cache
    const cacheKey = `air:${lat}:${lon}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for air quality');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    console.log('🌐 Fetching air quality from API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Air quality API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, data);
    
    console.log('✅ Air quality data fetched and cached');
    
    res.json(data);
  } catch (error) {
    console.error('❌ Air quality API error:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to fetch air quality data'
    });
  }
});

// Weather alerts endpoint (OneCall API with alerts)
app.get('/api/alerts', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters: lat and lon'
      });
    }

    // Check cache
    const cacheKey = `alerts:${lat}:${lon}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Cache hit for weather alerts');
      return res.json(cached);
    }

    // Fetch from OpenWeatherMap OneCall API (includes alerts)
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${API_KEY}&alerts`;
    
    console.log('🌐 Fetching weather alerts from API');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alerts API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract only alerts
    const alerts = data.alerts || [];
    
    // Cache the response (shorter cache for alerts - 5 minutes)
    cache.set(cacheKey, alerts);
    
    console.log(`✅ Weather alerts fetched: ${alerts.length} alerts`);
    
    res.json({
      alerts: alerts,
      count: alerts.length,
      hasAlerts: alerts.length > 0
    });
  } catch (error) {
    console.error('❌ Weather alerts API error:', error.message);
    
    res.status(500).json({
      error: error.message || 'Failed to fetch weather alerts'
    });
  }
});

// Clear cache endpoint (admin)
app.post('/api/cache/clear', (req, res) => {
  const { key } = req.body;
  
  if (key) {
    cache.del(key);
    console.log('🗑️ Cache key cleared:', key);
    res.json({ success: true, message: `Cache key "${key}" cleared` });
  } else {
    const stats = cache.flushAll();
    console.log('🗑️ All cache cleared');
    res.json({ success: true, message: 'All cache cleared', stats });
  }
});

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  res.json({
    keys: cache.keys(),
    count: cache.keys().length,
    stats: cache.getStats()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🌤️  WeatherNow Proxy Server  🌤️          ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Cache TTL: 10 minutes`);
  console.log(`🔒 Rate limit: 100 requests per 15 minutes`);
  console.log(`🌍 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/health          - Server health check');
  console.log('  GET  /api/weather         - Current weather');
  console.log('  GET  /api/onecall         - Forecast & historical');
  console.log('  GET  /api/geo             - Geocoding');
  console.log('  GET  /api/reverse-geo     - Reverse geocoding');
  console.log('  GET  /api/air-pollution   - Air quality index');
  console.log('  GET  /api/cache/stats     - Cache statistics');
  console.log('  POST /api/cache/clear     - Clear cache');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
