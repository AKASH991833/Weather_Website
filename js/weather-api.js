/**
 * WeatherNow - Weather API Module
 * 
 * Provides comprehensive weather data worldwide.
 * Uses OpenWeatherMap APIs for current weather, forecast, and air quality.
 * 
 * Features:
 * - Current weather data
 * - 5-day/3-hour forecast
 * - Air quality index
 * - UV index calculation
 * - Sun/moon data
 * - Proper error handling and caching
 */

import CONFIG from './config.js';

// Cache for better performance
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for weather data

// Rate limiting tracker
const rateLimit = {
  calls: 0,
  resetTime: Date.now() + 60000,
  maxCalls: CONFIG.RATE_LIMIT.WEATHER
};

/**
 * Check if we're within rate limits
 */
function checkRateLimit() {
  const now = Date.now();
  if (now > rateLimit.resetTime) {
    rateLimit.calls = 0;
    rateLimit.resetTime = now + 60000;
  }
  return rateLimit.calls < rateLimit.maxCalls;
}

/**
 * Generic fetch with caching and error handling
 */
async function fetchWithCache(url, cacheKey, options = {}) {
  const { ttl = CACHE_TTL, useCache = true } = options;

  // Check cache first
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('✅ Weather cache hit:', cacheKey);
      return cached.data;
    }
  }

  // Check rate limit
  if (!checkRateLimit()) {
    throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
  }

  rateLimit.calls++;

  try {
    console.log('🌐 Fetching weather:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleApiError(response.status, errorData);
    }

    const data = await response.json();

    // Cache successful response
    if (useCache && data) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(CONFIG.ERROR_MESSAGES.NETWORK);
    }
    throw error;
  }
}

/**
 * Handle API errors
 */
function handleApiError(status, errorData) {
  switch (status) {
    case 401:
      throw new Error(CONFIG.ERROR_MESSAGES.API_KEY);
    case 403:
      throw new Error('API key expired or insufficient permissions.');
    case 404:
      throw new Error('Weather data not available for this location.');
    case 429:
      throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
    case 500:
    case 502:
    case 503:
      throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    default:
      throw new Error(`API Error: ${status}`);
  }
}

/**
 * Get current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - 'metric' or 'imperial'
 * @returns {Promise<Object>} Formatted weather data
 */
export async function getCurrentWeather(lat, lon, units = 'metric') {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    throw new Error('Invalid coordinates');
  }

  const cacheKey = `weather:${lat}:${lon}:${units}`;
  const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    return formatWeatherData(data, units);
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw error;
  }
}

/**
 * Get 5-day/3-hour forecast
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - 'metric' or 'imperial'
 * @returns {Promise<Object>} Formatted forecast data
 */
export async function getForecast(lat, lon, units = 'metric') {
  const cacheKey = `forecast:${lat}:${lon}:${units}`;
  const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;

  try {
    const data = await fetchWithCache(url, cacheKey);
    return formatForecastData(data.list, units);
  } catch (error) {
    console.error('Forecast error:', error);
    throw error;
  }
}

/**
 * Get air quality data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} Formatted air quality data or null
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `aqi:${lat}:${lon}`;
  const url = `${CONFIG.AIR_POLLUTION_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;

  try {
    const data = await fetchWithCache(url, cacheKey, { ttl: 30 * 60 * 1000 }); // 30 min cache for AQI
    return formatAirQualityData(data.list[0]);
  } catch (error) {
    console.warn('Air quality data not available:', error.message);
    return null;
  }
}

/**
 * Format current weather data
 */
function formatWeatherData(data, units) {
  if (!data || !data.main || !data.weather) {
    throw new Error('Invalid weather data received');
  }

  return {
    location: {
      name: data.name || 'Unknown',
      lat: data.coord.lat,
      lon: data.coord.lon,
      country: data.sys.country || '',
      timezone: data.timezone || 0,
      timezoneOffset: data.timezone,
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000
    },
    current: {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempRaw: data.main.temp,
      feelsLikeRaw: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      windSpeedRaw: data.wind?.speed || 0,
      windDeg: data.wind?.deg || 0,
      windDir: getWindDirection(data.wind?.deg || 0),
      visibility: Math.round((data.visibility || 0) / 1000),
      cloudiness: data.clouds?.all || 0,
      description: capitalizeFirst(data.weather[0]?.description || 'Unknown'),
      icon: data.weather[0]?.icon || '01d',
      iconId: data.weather[0]?.id || 800,
      uvIndex: 0, // Will be calculated separately based on time and conditions
      dewPoint: calculateDewPoint(data.main.temp, data.main.humidity),
      precipitation: 0,
      timestamp: data.dt * 1000
    },
    units: units
  };
}

/**
 * Format forecast data into daily and hourly
 */
function formatForecastData(forecastList, units) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return { daily: [], hourly: [] };
  }

  // Group by day for daily forecast
  const dailyMap = new Map();
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date: item.dt * 1000,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        description: item.weather[0]?.description || '',
        icon: item.weather[0]?.icon || '01d',
        iconId: item.weather[0]?.id || 800,
        precipitation: Math.round((item.pop || 0) * 100),
        humidity: item.main.humidity,
        windSpeed: Math.round((item.wind?.speed || 0) * 3.6)
      });
    } else {
      const day = dailyMap.get(date);
      day.tempMax = Math.max(day.tempMax, item.main.temp_max);
      day.tempMin = Math.min(day.tempMin, item.main.temp_min);
      // Update precipitation to max for the day
      day.precipitation = Math.max(day.precipitation, Math.round((item.pop || 0) * 100));
    }
  });

  // Hourly forecast (next 24 hours = 8 items at 3-hour intervals)
  const hourly = forecastList.slice(0, 8).map(item => ({
    date: item.dt * 1000,
    temp: Math.round(item.main.temp),
    tempRaw: item.main.temp,
    feelsLike: Math.round(item.main.feels_like),
    icon: item.weather[0]?.icon || '01d',
    iconId: item.weather[0]?.id || 800,
    precipitation: Math.round((item.pop || 0) * 100),
    humidity: item.main.humidity,
    windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
    windDeg: item.wind?.deg || 0,
    description: capitalizeFirst(item.weather[0]?.description || '')
  }));

  return {
    daily: Array.from(dailyMap.values())
      .slice(0, 7)
      .map(day => ({
        ...day,
        tempMax: Math.round(day.tempMax),
        tempMin: Math.round(day.tempMin),
        description: capitalizeFirst(day.description)
      })),
    hourly
  };
}

/**
 * Format air quality data
 */
function formatAirQualityData(aqiData) {
  if (!aqiData || !aqiData.main) {
    return null;
  }

  return {
    aqi: aqiData.main.aqi,
    pm25: Math.round(aqiData.components.pm2_5 || 0),
    pm10: Math.round(aqiData.components.pm10 || 0),
    o3: Math.round(aqiData.components.o3 || 0),
    no2: Math.round(aqiData.components.no2 || 0),
    so2: Math.round(aqiData.components.so2 || 0),
    co: Math.round(aqiData.components.co || 0)
  };
}

/**
 * Get wind direction text from degrees
 */
function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Calculate dew point from temperature and humidity
 */
function calculateDewPoint(temp, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
  return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculate UV index (approximate based on weather conditions and time)
 */
export function calculateUVIndex(weatherData) {
  if (!weatherData || !weatherData.current) {
    return 0;
  }

  const { iconId, cloudiness } = weatherData.current;
  const hour = new Date().getHours();

  // Base UV on time of day
  let baseUV = 0;
  if (hour >= 6 && hour <= 18) {
    // Peak UV hours
    const distanceFromNoon = Math.abs(12 - hour);
    baseUV = Math.max(0, 11 - distanceFromNoon * 1.5);
  }

  // Reduce UV based on cloud cover
  const cloudFactor = 1 - (cloudiness / 100) * 0.5;

  // Reduce UV for rain/storm
  if (iconId >= 200 && iconId < 600) {
    return Math.round(baseUV * cloudFactor * 0.3);
  }

  return Math.round(baseUV * cloudFactor);
}

/**
 * Get moon phase name from phase value (0-1)
 */
export function getMoonPhaseName(phase) {
  const phases = [
    { name: 'New Moon', min: 0, max: 0.0625 },
    { name: 'Waxing Crescent', min: 0.0625, max: 0.1875 },
    { name: 'First Quarter', min: 0.1875, max: 0.25 },
    { name: 'Waxing Gibbous', min: 0.25, max: 0.375 },
    { name: 'Full Moon', min: 0.375, max: 0.4375 },
    { name: 'Waning Gibbous', min: 0.4375, max: 0.5625 },
    { name: 'Last Quarter', min: 0.5625, max: 0.625 },
    { name: 'Waning Crescent', min: 0.625, max: 0.75 },
    { name: 'New Moon', min: 0.75, max: 1 }
  ];

  const normalizedPhase = phase % 1;
  const phaseInfo = phases.find(p => normalizedPhase >= p.min && normalizedPhase < p.max);
  return phaseInfo ? phaseInfo.name : 'New Moon';
}

/**
 * Clear weather cache
 */
export function clearCache() {
  cache.clear();
  console.log('🗑️ Weather cache cleared');
}

/**
 * Initialize cache cleanup
 */
export function initCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

// Default export
export default {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  calculateUVIndex,
  getMoonPhaseName,
  clearCache,
  initCacheCleanup
};
