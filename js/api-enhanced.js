/**
 * WeatherNow - Enhanced Location & Weather API
 * Worldwide coverage with comprehensive error handling
 * 
 * APIs Used:
 * - OpenWeatherMap Geocoding API (free, 50 calls/min)
 * - OpenWeatherMap Current Weather API (free, 60 calls/min)
 * - OpenWeatherMap One Call API 3.0 (free tier: 1000 calls/day)
 */

import CONFIG from './config.js';

// In-memory cache for better performance
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate limiting
const rateLimit = {
  calls: 0,
  resetTime: Date.now() + 60000,
  maxCalls: 50
};

/**
 * Check rate limit status
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
 * Generic fetch with error handling and caching
 */
async function fetchWithCache(url, cacheKey, options = {}) {
  const { ttl = CACHE_TTL, useCache = true } = options;
  
  // Check cache first
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('✅ Cache hit:', cacheKey);
      return cached.data;
    }
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    throw new Error('API rate limit exceeded. Please wait 30 seconds.');
  }
  
  rateLimit.calls++;
  
  try {
    console.log('🌐 Fetching:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          throw new Error('Invalid API key. Please check configuration.');
        case 403:
          throw new Error('API key expired or insufficient permissions.');
        case 404:
          throw new Error('Location not found. Please check the name.');
        case 429:
          throw new Error('Too many requests. Please wait 30 seconds.');
        case 500:
        case 502:
        case 503:
          throw new Error('Weather service temporarily unavailable.');
        default:
          throw new Error(`API Error: ${response.status}`);
      }
    }
    
    const data = await response.json();
    
    // Cache successful response
    if (useCache) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Search for locations worldwide
 * Returns multiple results for user selection
 */
export async function searchLocations(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid search query');
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < 2) {
    throw new Error('Please enter at least 2 characters');
  }
  
  try {
    let results = [];
    
    // Check if query is coordinates (lat,lon)
    const coordMatch = trimmedQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      }
      
      results = await reverseGeocode(lat, lon);
    }
    // Check if query is postal code
    else if (/^\d{4,10}$/.test(trimmedQuery)) {
      results = await searchByPostalCode(trimmedQuery);
    }
    // Check if query is country code (2 letters)
    else if (/^[A-Z]{2}$/i.test(trimmedQuery) && trimmedQuery.length === 2) {
      results = await searchByCountryCode(trimmedQuery.toUpperCase());
    }
    // Regular city/state/country search
    else {
      results = await searchByCityName(trimmedQuery);
    }
    
    if (!results || results.length === 0) {
      return [];
    }
    
    // Format and return results
    return formatSearchResults(results);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Search by city name
 */
async function searchByCityName(cityName) {
  const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${CONFIG.API_KEY}`;
  return fetchWithCache(url, `search:${cityName}`);
}

/**
 * Reverse geocoding (coordinates to location)
 */
async function reverseGeocode(lat, lon) {
  const url = `${CONFIG.GEOCODING_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.API_KEY}`;
  return fetchWithCache(url, `reverse:${lat},${lon}`);
}

/**
 * Search by postal code worldwide
 */
async function searchByPostalCode(postalCode) {
  const results = [];
  
  // Try direct search first
  try {
    const url = `${CONFIG.GEOCODING_URL}/direct?zip=${postalCode}&limit=5&appid=${CONFIG.API_KEY}`;
    const data = await fetchWithCache(url, `zip:${postalCode}`);
    if (data && data.length > 0) {
      results.push(...data);
    }
  } catch (error) {
    console.warn('Direct ZIP search failed:', error);
  }
  
  // Try country-specific search for common countries
  const countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'JP', 'BR', 'MX'];
  
  for (const country of countries) {
    try {
      const url = `${CONFIG.GEOCODING_URL}/zip?zip=${postalCode},${country}&appid=${CONFIG.API_KEY}`;
      const data = await fetchWithCache(url, `zip:${postalCode}:${country}`, { useCache: true });
      if (data && data.name && data.zip) {
        results.push({
          name: data.name,
          lat: data.lat,
          lon: data.lon,
          country: country,
          state: data.state || '',
          zip: data.zip
        });
      }
    } catch (error) {
      // Continue to next country
    }
  }
  
  // Remove duplicates
  const uniqueMap = new Map();
  results.forEach(result => {
    const key = `${result.name}|${result.lat}|${result.lon}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, result);
    }
  });
  
  return Array.from(uniqueMap.values());
}

/**
 * Search by country code
 */
async function searchByCountryCode(countryCode) {
  try {
    const url = `${CONFIG.GEOCODING_URL}/direct?q=${countryCode}&limit=10&appid=${CONFIG.API_KEY}`;
    const data = await fetchWithCache(url, `country:${countryCode}`);
    
    if (data && data.length > 0) {
      // Return capital cities and major cities
      return data.filter(city => city.name && city.name.length > 2).slice(0, 5);
    }
  } catch (error) {
    console.warn('Country code search failed:', error);
  }
  
  return [];
}

/**
 * Format search results for display
 */
function formatSearchResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }
  
  return results
    .filter(result => result && result.name && result.lat && result.lon)
    .map(result => ({
      name: result.name || 'Unknown',
      state: result.state || '',
      country: result.country || '',
      lat: result.lat,
      lon: result.lon,
      zip: result.zip || ''
    }))
    .slice(0, 5);
}

/**
 * Get current weather for a location
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
 * Get weather forecast (5 days / 3 hour)
 */
export async function getForecast(lat, lon, units = 'metric') {
  const cacheKey = `forecast:${lat}:${lon}:${units}`;
  const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;
  
  try {
    const data = await fetchWithCache(url, cacheKey);
    return formatForecastData(data.list);
  } catch (error) {
    console.error('Forecast error:', error);
    throw error;
  }
}

/**
 * Get air quality data
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `aqi:${lat}:${lon}`;
  const url = `${CONFIG.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
  
  try {
    const data = await fetchWithCache(url, cacheKey);
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
      state: '',
      timezone: data.timezone || 'UTC',
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000
    },
    current: {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      windDeg: data.wind?.deg || 0,
      windDir: getWindDirection(data.wind?.deg || 0),
      visibility: Math.round((data.visibility || 0) / 1000),
      cloudiness: data.clouds?.all || 0,
      description: capitalizeFirst(data.weather[0]?.description || 'Unknown'),
      icon: data.weather[0]?.icon || '01d',
      iconId: data.weather[0]?.id || 800,
      uvIndex: 0, // Will be calculated separately
      dewPoint: calculateDewPoint(data.main.temp, data.main.humidity),
      precipitation: 0,
      timestamp: data.dt * 1000
    },
    units: units
  };
}

/**
 * Format forecast data
 */
function formatForecastData(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return { daily: [], hourly: [] };
  }
  
  // Daily forecast
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
        precipitation: Math.round((item.pop || 0) * 100)
      });
    } else {
      const day = dailyMap.get(date);
      day.tempMax = Math.max(day.tempMax, item.main.temp_max);
      day.tempMin = Math.min(day.tempMin, item.main.temp_min);
    }
  });
  
  // Hourly forecast (next 24 hours)
  const hourly = forecastList.slice(0, 8).map(item => ({
    date: item.dt * 1000,
    temp: Math.round(item.main.temp),
    icon: item.weather[0]?.icon || '01d',
    precipitation: Math.round((item.pop || 0) * 100),
    humidity: item.main.humidity,
    windSpeed: Math.round((item.wind?.speed || 0) * 3.6)
  }));
  
  return {
    daily: Array.from(dailyMap.values()).slice(0, 7).map(day => ({
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
 * Helper: Get wind direction text
 */
function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Helper: Calculate dew point
 */
function calculateDewPoint(temp, humidity) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
  return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Clear cache
 */
export function clearCache() {
  cache.clear();
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

/**
 * Get timezone from coordinates (approximate)
 */
export function getTimezoneFromCoords(lat, lon) {
  const offset = Math.round(lon / 15);
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${Math.abs(offset)}`;
}

/**
 * Get country name from code
 */
export function getCountryName(code) {
  const countries = {
    'IN': 'India',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'IT': 'Italy',
    'ES': 'Spain',
    'RU': 'Russia',
    'CN': 'China',
    'ZA': 'South Africa',
    'KR': 'South Korea',
    'AR': 'Argentina',
    'EG': 'Egypt',
    'NG': 'Nigeria',
    'KE': 'Kenya'
  };
  return countries[code] || code;
}

/**
 * Default export
 */
export default {
  searchLocations,
  getCurrentWeather,
  getForecast,
  getAirQuality,
  clearCache,
  initCacheCleanup,
  getTimezoneFromCoords,
  getCountryName
};
