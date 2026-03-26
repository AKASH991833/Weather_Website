/**
 * WeatherNow - Enhanced API Utilities v2.0
 * Robust API fetching with retry logic, timeout handling, and fallback support
 */

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with timeout and retry logic - optimized
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in ms (default: 5000)
 * @param {number} retries - Number of retries (default: 1)
 * @param {number} retryDelay - Delay between retries in ms (default: 500)
 */
export async function fetchWithTimeout(url, options = {}, timeout = 5000, retries = 1, retryDelay = 500) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🌐 Fetch attempt ${attempt + 1}/${retries + 1}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        let errorCode = 'HTTP_ERROR';

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.cod || errorMessage;
          errorCode = errorData.cod || errorCode;
        } catch (e) {
          // Response might not be JSON
        }

        const error = new Error(errorMessage);
        error.code = errorCode;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return { success: true, data, response };

    } catch (error) {
      lastError = error;

      console.error(`❌ Fetch attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        throw error;
      }

      // Don't retry on abort
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Wait before retry (if not last attempt)
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
        retryDelay *= 2; // Exponential backoff
      }
    }
  }

  // All retries failed
  throw lastError || new Error('Unknown fetch error');
}

/**
 * Standardized API response creator
 */
export function createResponse(success, data = null, error = null, message = null) {
  const response = { success };
  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (message) response.message = message;
  return response;
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat, lon) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return { 
      valid: false, 
      error: 'INVALID_COORDINATES', 
      message: 'Coordinates must be valid numbers' 
    };
  }

  if (latNum < -90 || latNum > 90) {
    return { 
      valid: false, 
      error: 'LATITUDE_OUT_OF_RANGE', 
      message: 'Latitude must be between -90 and 90' 
    };
  }

  if (lonNum < -180 || lonNum > 180) {
    return { 
      valid: false, 
      error: 'LONGITUDE_OUT_OF_RANGE', 
      message: 'Longitude must be between -180 and 180' 
    };
  }

  return { valid: true, lat: latNum, lon: lonNum };
}

/**
 * Validate city name
 */
export function validateCity(city) {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: 'INVALID_CITY', message: 'City name is required' };
  }

  const trimmed = city.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'CITY_TOO_SHORT', message: 'City name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'CITY_TOO_LONG', message: 'City name must be less than 100 characters' };
  }

  // Basic sanitization
  const sanitized = trimmed.replace(/[<>\"\'&]/g, '');
  if (sanitized.length === 0) {
    return { valid: false, error: 'INVALID_CHARACTERS', message: 'City name contains invalid characters' };
  }

  return { valid: true, city: sanitized };
}

/**
 * Validate limit parameter
 */
export function validateLimit(limit, max = 100, defaultLimit = 5) {
  const num = parseInt(limit);
  if (isNaN(num) || num < 1) {
    return defaultLimit;
  }
  return Math.min(num, max);
}

/**
 * Safe object property access
 */
export function safeGet(obj, path, defaultValue = null) {
  try {
    if (!obj || !path) return defaultValue;

    const keys = path.split(/[\.\[\]]+/).filter(k => k !== '');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Get fallback weather data (used when API fails)
 */
export function getFallbackWeather(lat, lon, units = 'metric') {
  const isMetric = units === 'metric';
  return {
    coord: { lon, lat },
    weather: [{
      id: 800,
      main: 'Clear',
      description: 'clear sky',
      icon: '01d'
    }],
    main: {
      temp: isMetric ? 20 : 68,
      feels_like: isMetric ? 19 : 66,
      temp_min: isMetric ? 18 : 64,
      temp_max: isMetric ? 22 : 72,
      pressure: 1013,
      humidity: 50,
      sea_level: 1013,
      grnd_level: 1013
    },
    visibility: 10000,
    wind: { speed: isMetric ? 3.6 : 2.2, deg: 180 },
    clouds: { all: 0 },
    dt: Math.floor(Date.now() / 1000),
    sys: {
      type: 1,
      id: 1,
      country: 'XX',
      sunrise: Math.floor(Date.now() / 1000) - 21600,
      sunset: Math.floor(Date.now() / 1000) + 21600
    },
    timezone: 0,
    id: 0,
    name: 'Location (Fallback Data)',
    cod: 200
  };
}

/**
 * Get fallback forecast data
 */
export function getFallbackForecast(lat, lon, units = 'metric') {
  const isMetric = units === 'metric';
  const list = [];
  const now = Date.now();
  
  for (let i = 0; i < 40; i++) {
    const dt = now + (i * 3 * 60 * 60 * 1000);
    list.push({
      dt: Math.floor(dt / 1000),
      main: {
        temp: isMetric ? 20 + Math.sin(i / 8) * 5 : 68 + Math.sin(i / 8) * 9,
        feels_like: isMetric ? 19 : 66,
        temp_min: isMetric ? 18 : 64,
        temp_max: isMetric ? 22 : 72,
        pressure: 1013,
        humidity: 50
      },
      weather: [{
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }],
      clouds: { all: 0 },
      wind: { speed: isMetric ? 3.6 : 2.2, deg: 180 },
      visibility: 10000,
      pop: 0,
      dt_txt: new Date(dt).toISOString()
    });
  }
  
  return {
    cod: '200',
    message: 0,
    cnt: 40,
    list,
    city: {
      id: 0,
      name: 'Location (Fallback)',
      coord: { lat, lon },
      country: 'XX',
      population: 0,
      timezone: 0,
      sunrise: Math.floor(now / 1000) - 21600,
      sunset: Math.floor(now / 1000) + 21600
    }
  };
}

/**
 * Handle API errors gracefully
 */
export function handleAPIError(error, context = 'API') {
  console.error(`❌ ${context} Error:`, {
    message: error.message,
    code: error.code || error.status,
    status: error.status,
    name: error.name
  });
  
  // Categorize error
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: 'TIMEOUT',
      status: 408,
      code: 'REQUEST_TIMEOUT',
      message: 'Request timed out. Please try again.'
    };
  }
  
  if (error.status === 401 || error.code === '401') {
    return {
      type: 'AUTH',
      status: 401,
      code: 'INVALID_API_KEY',
      message: 'Invalid API key configuration'
    };
  }
  
  if (error.status === 404 || error.code === '404') {
    return {
      type: 'NOT_FOUND',
      status: 404,
      code: 'LOCATION_NOT_FOUND',
      message: 'Location not found'
    };
  }
  
  if (error.status === 429 || error.code === '429') {
    return {
      type: 'RATE_LIMIT',
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a moment.'
    };
  }
  
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      type: 'NETWORK',
      status: 503,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to service. Please check your connection.'
    };
  }
  
  // Default to internal error
  return {
    type: 'INTERNAL',
    status: 500,
    code: 'INTERNAL_ERROR',
    message: error.message || 'Failed to fetch data'
  };
}
