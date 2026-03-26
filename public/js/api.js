/**
 * WeatherNow - API Module v5.0 (Optimized)
 * Performance optimized with request caching, abort controllers, and timeout handling
 */

const API_BASE_URL = window.location.origin + '/api';

// Request cache with LRU eviction
const requestCache = new Map();
const cacheTimestamps = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes for API responses
const MAX_CACHE_SIZE = 50; // Reduced from 100

// Pending requests map to deduplicate identical requests
const pendingRequests = new Map();

// Request timing for performance monitoring
const requestTimings = new Map();

/**
 * Get cached response if still valid
 */
function getCachedResponse(cacheKey) {
  const cached = requestCache.get(cacheKey);
  if (!cached) return null;

  const timestamp = cacheTimestamps.get(cacheKey);
  if (!timestamp || Date.now() - timestamp > CACHE_DURATION) {
    requestCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
    return null;
  }
  return cached;
}

/**
 * Set cached response with LRU eviction
 */
function setCachedResponse(cacheKey, data) {
  // Evict oldest entry if cache is full (LRU eviction)
  if (requestCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cacheTimestamps.keys().next().value;
    if (oldestKey) {
      requestCache.delete(oldestKey);
      cacheTimestamps.delete(oldestKey);
    }
  }

  requestCache.set(cacheKey, data);
  cacheTimestamps.set(cacheKey, Date.now());
}

/**
 * Clear cache for specific key or all
 */
export function clearCache(key = null) {
  if (key) {
    requestCache.delete(key);
    cacheTimestamps.delete(key);
  } else {
    requestCache.clear();
    cacheTimestamps.clear();
  }
}

/**
 * Handle API response with standardized error handling
 */
async function handleResponse(response, cacheKey = null) {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    let errorCode = 'HTTP_ERROR';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorCode = errorData.error || errorCode;
    } catch (e) {
      // Response might not be JSON
    }

    const error = new Error(errorMessage);
    error.code = errorCode;
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  // Cache successful responses
  if (cacheKey && data.success) {
    setCachedResponse(cacheKey, data);
  }

  return data;
}

/**
 * Fetch with deduplication and timeout - optimized
 */
async function fetchWithDedup(url, options = {}, timeout = 5000, cacheKey = null) {
  const startTime = performance.now();

  // Check cache first
  if (cacheKey) {
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('📦 API cache hit:', cacheKey);
      return cached;
    }
  }

  // Check for pending identical request
  const pendingKey = url;
  if (pendingRequests.has(pendingKey)) {
    console.log('⏳ Using pending request:', pendingKey);
    return pendingRequests.get(pendingKey);
  }

  // Create abort controller if not provided
  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller.signal;

  // Set timeout
  const timeoutId = setTimeout(() => {
    if (controller) controller.abort();
  }, timeout);

  // Create fetch promise
  const fetchPromise = fetch(url, { ...options, signal })
    .then(response => handleResponse(response, cacheKey))
    .then(data => {
      const duration = Math.round(performance.now() - startTime);
      console.log(`✅ API request completed in ${duration}ms:`, new URL(url).pathname);
      return data;
    })
    .catch(error => {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ API request failed after ${duration}ms:`, new URL(url).pathname, error.message);
      throw error;
    })
    .finally(() => {
      clearTimeout(timeoutId);
      pendingRequests.delete(pendingKey);
      if (controller) {
        // Clean up controller reference
      }
    });

  // Store pending request
  pendingRequests.set(pendingKey, fetchPromise);

  return fetchPromise;
}

/**
 * Fetch geocoding data for a city query
 * @param {string} query - City name to search
 * @param {AbortSignal} signal - Optional abort signal
/**
 * Smart geocoding — handles city names, states, countries AND postal/PIN codes
 * Uses /api/smart-geo which auto-detects whether query is a ZIP/postal code
 * @param {string} query - City name, country, state, OR postal/PIN code
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Array>} Array of location results
 */
export async function fetchGeo(query, signal = null) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Please enter at least 2 characters');
    }

    const trimmedQuery = query.trim();
    const cacheKey = `smartgeo:${trimmedQuery.toLowerCase()}`;
    const url = `${API_BASE_URL}/smart-geo?q=${encodeURIComponent(trimmedQuery)}`;

    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);

    if (result.success && result.error) {
      const emptyResult = [];
      emptyResult._apiError = result.error;
      emptyResult._apiMessage = result.message;
      return emptyResult;
    }

    return result.success ? result.data : [];
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error('fetchGeo error:', error);
    throw error;
  }
}

/**
 * Dedicated ZIP / Postal code geocoding
 * @param {string} zip - Postal / PIN code (e.g. "400001", "SW1A1AA", "10001")
 * @param {string} country - Optional 2-letter country code (e.g. "IN", "GB", "US")
 * @returns {Promise<Array>} Array of location results
 */
export async function fetchZipGeo(zip, country = '', signal = null) {
  try {
    const cleanZip = String(zip).trim();
    if (!cleanZip || cleanZip.length < 3) {
      throw new Error('Postal code must be at least 3 characters');
    }

    const cacheKey = `zipgeo:${cleanZip.toLowerCase()}:${country}`;
    const params = new URLSearchParams({ zip: cleanZip });
    if (country) params.append('country', country);
    const url = `${API_BASE_URL}/geo-zip?${params}`;

    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);

    if (result.success && result.error) {
      const emptyResult = [];
      emptyResult._apiError = result.error;
      emptyResult._apiMessage = result.message;
      return emptyResult;
    }

    return result.success ? result.data : [];
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error('fetchZipGeo error:', error);
    throw error;
  }
}


/**
 * Fetch reverse geocoding data for coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Location data
 */
export async function fetchReverseGeo(lat, lon, signal = null) {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    const cacheKey = `reverse:${lat}:${lon}`;
    const url = `${API_BASE_URL}/reverse-geo?lat=${lat}&lon=${lon}`;
    
    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);
    return result.success ? result.data : null;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('fetchReverseGeo error:', error);
    throw error;
  }
}

/**
 * Fetch current weather data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units (metric, imperial, standard)
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Weather data
 */
export async function fetchWeather(lat, lon, units = 'metric', signal = null) {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    const validUnits = ['metric', 'imperial', 'standard'];
    const selectedUnits = validUnits.includes(units) ? units : 'metric';

    const cacheKey = `weather:${lat}:${lon}:${selectedUnits}`;
    const url = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${selectedUnits}`;

    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch weather data');
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('fetchWeather error:', error);
    throw error;
  }
}

/**
 * Fetch 5-day/3-hour forecast data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} units - Units (metric, imperial, standard)
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Forecast data
 */
export async function fetchForecast(lat, lon, units = 'metric', signal = null) {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    const validUnits = ['metric', 'imperial', 'standard'];
    const selectedUnits = validUnits.includes(units) ? units : 'metric';

    const cacheKey = `forecast:${lat}:${lon}:${selectedUnits}`;
    const url = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${selectedUnits}`;

    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch forecast data');
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('fetchForecast error:', error);
    throw error;
  }
}

/**
 * Fetch air quality/pollution data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Air quality data
 */
export async function fetchAQI(lat, lon, signal = null) {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    const cacheKey = `aqi:${lat}:${lon}`;
    const url = `${API_BASE_URL}/air-pollution?lat=${lat}&lon=${lon}`;

    const result = await fetchWithDedup(url, { signal }, 5000, cacheKey);

    if (!result.success) {
      // Return empty data instead of throwing for AQI (it's optional)
      return { success: true, data: { list: [] } };
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('fetchAQI error:', error);
    // Return empty data instead of throwing for AQI (it's optional)
    return { success: true, data: { list: [] } };
  }
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: 'API unhealthy' };
    }

    return await response.json();
  } catch (error) {
    console.error('checkApiHealth error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch weather alerts (if available)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<Object>} Alerts data
 */
export async function fetchAlerts(lat, lon, signal = null) {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Invalid coordinates');
    }

    const cacheKey = `alerts:${lat}:${lon}`;
    const url = `${API_BASE_URL}/alerts?lat=${lat}&lon=${lon}`;
    
    const result = await fetchWithDedup(url, { signal }, 8000, cacheKey);

    if (!result.success) {
      return { success: true, data: { alerts: [], count: 0 } };
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('fetchAlerts error:', error);
    return { success: true, data: { alerts: [], count: 0 } };
  }
}
