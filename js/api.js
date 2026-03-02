/**
 * WeatherNow - API Module
 * GitHub Pages Compatible - Direct OpenWeatherMap API
 */

import CONFIG from './config.js';

// In-memory cache for weather data
const weatherCache = new Map();
const CACHE_DURATION = CONFIG.CACHE_DURATION;

// Storage keys
const SAVED_LOCATIONS_KEY = 'weathernow:savedLocations';
const THEME_KEY = 'weathernow:theme';

/**
 * Search for locations by query
 * Uses direct OpenWeatherMap API (GitHub Pages compatible)
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const trimmedQuery = query.trim();

  try {
    let results = [];

    // Check if query is coordinates (lat,lon)
    const coordMatch = trimmedQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const url = `${CONFIG.GEOCODING_URL}/reverse?lat=${coordMatch[1]}&lon=${coordMatch[2]}&limit=1&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }
    // Postal code search
    else if (/^\d{4,10}$/.test(trimmedQuery)) {
      results = await searchByPostalCode(trimmedQuery);
    }
    // Country code search (2 letters)
    else if (/^[A-Z]{2}$/i.test(trimmedQuery) && trimmedQuery.length === 2) {
      const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(trimmedQuery)}&limit=10&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }
    // Regular city/state/country search
    else {
      const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(trimmedQuery)}&limit=10&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }

    if (!results || results.length === 0) {
      return [];
    }

    return results.slice(0, 5).map(location => ({
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      state: location.state
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Search by postal code with multiple country support
 * GitHub Pages compatible - direct API calls only
 */
async function searchByPostalCode(postalCode) {
  const allResults = [];

  const commonCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'JP', 'BR', 'MX', 'IN'];

  for (const country of commonCountries) {
    try {
      const url = `${CONFIG.GEOCODING_URL}/zip?zip=${postalCode},${country}&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data && data.name && data.lat) {
          allResults.push({
            name: data.name,
            lat: data.lat,
            lon: data.lon,
            country: country,
            state: data.state || ''
          });
        }
      }
    } catch (err) {
      continue;
    }
  }

  const uniqueMap = new Map();
  allResults.forEach(result => {
    const key = `${result.name}|${result.lat}|${result.lon}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, result);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Get current weather for a location
 * Direct OpenWeatherMap API call (GitHub Pages compatible)
 */
export async function getCurrentWeather(lat, lon, units = 'metric') {
  const cacheKey = `current:${lat}:${lon}:${units}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid API key');
      if (response.status === 429) throw new Error('Too many requests. Please wait.');
      if (response.status === 404) throw new Error('Location not found');
      throw new Error(`Failed to fetch current weather (${response.status})`);
    }

    const data = await response.json();
    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Current weather error:', error);
    throw error;
  }
}

/**
 * Get weather forecast (5 days / 3 hour)
 * Direct OpenWeatherMap API call (GitHub Pages compatible)
 */
export async function getForecast(lat, lon, units = 'metric') {
  const cacheKey = `forecast:${lat}:${lon}:${units}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid API key');
      if (response.status === 429) throw new Error('Too many requests. Please wait.');
      throw new Error(`Failed to fetch forecast (${response.status})`);
    }

    const data = await response.json();
    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Forecast error:', error);
    throw error;
  }
}

/**
 * Get air quality data
 * Direct OpenWeatherMap API call (GitHub Pages compatible)
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `aqi:${lat}:${lon}`;
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const url = `${CONFIG.AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid API key');
      if (response.status === 429) throw new Error('Too many requests. Please wait.');
      if (response.status === 404) {
        console.warn('Air quality data not available for this location');
        return null;
      }
      throw new Error(`Failed to fetch air quality (${response.status})`);
    }

    const data = await response.json();
    setInCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Air quality error:', error);
    return null;
  }
}

/**
 * Get current location using browser Geolocation API
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred getting location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
}

/**
 * Format weather data for UI
 */
export function formatWeatherData(current, forecast, aqi, cityName, currentUnit = 'metric') {
  return {
    location: { name: cityName, lat: current.coord.lat, lon: current.coord.lon },
    current: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6),
      windDeg: current.wind.deg || 0,
      visibility: Math.round(current.visibility / 1000),
      pressure: current.main.pressure,
      description: capitalizeFirst(current.weather[0].description),
      icon: current.weather[0].icon,
      iconId: current.weather[0].id,
      timestamp: current.dt * 1000,
      sunrise: current.sys.sunrise * 1000,
      sunset: current.sys.sunset * 1000,
      moonPhase: 0.5,
      dewPoint: current.main.temp - ((100 - current.main.humidity) / 5),
      precipitation: 0
    },
    daily: formatDailyForecast(forecast.list),
    hourly: formatHourlyForecast(forecast.list),
    airQuality: aqi?.list?.[0] ? formatAirQuality(aqi.list[0]) : null
  };
}

/**
 * Format daily forecast from 3-hour data
 */
function formatDailyForecast(forecastList) {
  const dailyMap = new Map();

  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date: item.dt * 1000,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        precipitation: item.pop * 100
      });
    } else {
      const day = dailyMap.get(date);
      day.tempMax = Math.max(day.tempMax, item.main.temp_max);
      day.tempMin = Math.min(day.tempMin, item.main.temp_min);
    }
  });

  return Array.from(dailyMap.values()).slice(0, 7).map(day => ({
    ...day,
    tempMax: Math.round(day.tempMax),
    tempMin: Math.round(day.tempMin),
    description: capitalizeFirst(day.description),
    precipitation: Math.round(day.precipitation)
  }));
}

/**
 * Format hourly forecast from 3-hour data
 */
function formatHourlyForecast(forecastList) {
  return forecastList.slice(0, 8).map(item => ({
    date: item.dt * 1000,
    temp: Math.round(item.main.temp),
    icon: item.weather[0].icon,
    precipitation: Math.round(item.pop * 100)
  }));
}

/**
 * Format air quality data
 */
function formatAirQuality(aqiData) {
  return {
    aqi: aqiData.main.aqi,
    pm25: Math.round(aqiData.components.pm2_5),
    pm10: Math.round(aqiData.components.pm10),
    o3: Math.round(aqiData.components.o3),
    no2: Math.round(aqiData.components.no2)
  };
}

/**
 * Get AQI category
 */
export function getAQICategory(aqi) {
  const categories = {
    1: { label: 'Good', color: 'aqi-good', health: 'Air quality is satisfactory. Perfect for outdoor activities!' },
    2: { label: 'Fair', color: 'aqi-moderate', health: 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion.' },
    3: { label: 'Moderate', color: 'aqi-moderate', health: 'Sensitive groups may experience health effects.' },
    4: { label: 'Poor', color: 'aqi-unhealthy', health: 'Everyone may experience health effects. Limit outdoor activities.' },
    5: { label: 'Very Poor', color: 'aqi-unhealthy', health: 'Health alert! Avoid outdoor activities.' }
  };
  return categories[aqi] || categories[1];
}

/**
 * Cache utilities
 */
function getFromCache(key) {
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  weatherCache.delete(key);
  return null;
}

function setInCache(key, data) {
  weatherCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear weather cache
 */
export function clearWeatherCache() {
  weatherCache.clear();
}

/**
 * Initialize cache cleanup
 */
export function initCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of weatherCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        weatherCache.delete(key);
      }
    }
  }, 600000);
}

/**
 * Saved locations management
 */
export function saveLocation(location) {
  const locations = getSavedLocations();
  const exists = locations.some(loc => loc.lat === location.lat && loc.lon === location.lon);

  if (!exists) {
    locations.push(location);
    localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
  }

  return locations;
}

export function removeLocation(lat, lon) {
  const locations = getSavedLocations().filter(
    loc => !(loc.lat === lat && loc.lon === lon)
  );
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
  return locations;
}

export function getSavedLocations() {
  try {
    const stored = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Theme management
 */
export function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Helper functions
 */
function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Default export
 */
export default {
  searchLocations,
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getCurrentLocation,
  formatWeatherData,
  getAQICategory,
  initCacheCleanup,
  clearWeatherCache,
  saveLocation,
  removeLocation,
  getSavedLocations,
  getCurrentTheme,
  saveTheme
};
