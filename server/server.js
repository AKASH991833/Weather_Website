/**
 * WeatherNow - Backend Server
 * Secure API Key Management
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from parent directory (main website)
app.use(express.static(join(__dirname, '..')));

// OpenWeatherMap API Configuration
const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

if (!API_KEY) {
  console.error('❌ OPENWEATHER_API_KEY not found in .env file!');
  process.exit(1);
}

console.log('✅ WeatherNow Server starting...');
console.log(`🌡️  OpenWeatherMap API Key: ${API_KEY.substring(0, 8)}...`);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== API ENDPOINTS =====

// 1. Search Locations
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Use limit from query or default to 5
    const searchLimit = limit || 5;
    const url = `${GEO_URL}/direct?q=${encodeURIComponent(q)}&limit=${searchLimit}&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    // Return results (up to limit)
    if (data && data.length > 0) {
      res.json(data.map(item => ({
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
        state: item.state
      })));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 2. Current Weather
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, units } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units || 'metric'}&appid=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Weather API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 3. Weather Forecast (5 days)
app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon, units } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units || 'metric'}&appid=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Forecast error:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// 4. Air Quality
app.get('/api/air-pollution', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.json(null); // Air quality not available for this location
      }
      throw new Error(`Air Quality API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Air quality error:', error.message);
    res.status(500).json({ error: 'Failed to fetch air quality data' });
  }
});

// 5. Reverse Geocoding (coordinates to location name)
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const url = `${GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    res.status(500).json({ error: 'Failed to fetch location name' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WeatherNow API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Catch-all route for SPA - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 API Endpoints:`);
  console.log(`   GET /api/search?q=city`);
  console.log(`   GET /api/weather?lat=&lon=&units=`);
  console.log(`   GET /api/forecast?lat=&lon=&units=`);
  console.log(`   GET /api/air-pollution?lat=&lon=`);
  console.log(`   GET /api/health`);
});
