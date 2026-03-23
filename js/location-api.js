/**
 * WeatherNow - Location Search API Module
 * 
 * Provides worldwide location search with comprehensive error handling.
 * Uses OpenWeatherMap Geocoding API for consistent, reliable results.
 * 
 * Features:
 * - Search by city name worldwide
 * - Search by postal/ZIP code
 * - Reverse geocoding (coordinates to location)
 * - Country code search
 * - Coordinates search (lat,lon)
 * - Proper error handling and rate limiting
 */

import CONFIG, { COUNTRY_NAMES, COUNTRY_FLAGS } from './config.js';

// Cache for better performance
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Rate limiting tracker
const rateLimit = {
  calls: 0,
  resetTime: Date.now() + 60000,
  maxCalls: CONFIG.RATE_LIMIT.GEOCODING
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
      console.log('✅ Cache hit:', cacheKey);
      return cached.data;
    }
  }

  // Check rate limit
  if (!checkRateLimit()) {
    throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
  }

  rateLimit.calls++;

  try {
    console.log('🌐 Fetching:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
 * Handle API errors with proper messages
 */
function handleApiError(status, errorData) {
  switch (status) {
    case 401:
      throw new Error(CONFIG.ERROR_MESSAGES.API_KEY);
    case 403:
      throw new Error('API key expired or insufficient permissions.');
    case 404:
      throw new Error(CONFIG.ERROR_MESSAGES.NOT_FOUND);
    case 429:
      throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
    case 500:
    case 502:
    case 503:
      throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
    default:
      throw new Error(`API Error: ${status} - ${errorData.message || 'Unknown error'}`);
  }
}

/**
 * Main search function - searches locations worldwide
 * @param {string} query - Search query (city name, postal code, coordinates, country)
 * @returns {Promise<Array>} Array of location results
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

    // Detect query type and search accordingly
    const coordMatch = trimmedQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    
    if (coordMatch) {
      // Coordinates search (lat,lon)
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      }

      results = await reverseGeocode(lat, lon);
    }
    else if (/^\d{4,10}$/.test(trimmedQuery)) {
      // Postal code search
      results = await searchByPostalCode(trimmedQuery);
    }
    else if (/^[A-Z]{2}$/i.test(trimmedQuery) && trimmedQuery.length === 2) {
      // Country code search
      results = await searchByCountryCode(trimmedQuery.toUpperCase());
    }
    else {
      // City/state name search
      results = await searchByCityName(trimmedQuery);
    }

    if (!results || results.length === 0) {
      return [];
    }

    return formatSearchResults(results);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Search by city/state name
 */
async function searchByCityName(cityName) {
  // Use backend URL instead of direct API call
  const backendUrl = `${CONFIG.BACKEND_URL}/geo?q=${encodeURIComponent(cityName)}&limit=5`;
  const directUrl = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(cityName)}&limit=5&appid=${CONFIG.API_KEY}`;
  const url = CONFIG.BACKEND_URL ? backendUrl : directUrl;
  return fetchWithCache(url, `search:${cityName.toLowerCase()}`);
}

/**
 * Reverse geocoding - get location from coordinates
 */
async function reverseGeocode(lat, lon) {
  // Use backend URL instead of direct API call
  const backendUrl = `${CONFIG.BACKEND_URL}/reverse-geo?lat=${lat}&lon=${lon}&limit=3`;
  const directUrl = `${CONFIG.GEOCODING_URL}/reverse?lat=${lat}&lon=${lon}&limit=3&appid=${CONFIG.API_KEY}`;
  const url = CONFIG.BACKEND_URL ? backendUrl : directUrl;
  return fetchWithCache(url, `reverse:${lat},${lon}`);
}

/**
 * Search by postal code worldwide
 */
async function searchByPostalCode(postalCode) {
  const results = [];

  // Try direct ZIP search
  try {
    const url = `${CONFIG.GEOCODING_URL}/direct?zip=${postalCode}&limit=5&appid=${CONFIG.API_KEY}`;
    const data = await fetchWithCache(url, `zip:${postalCode}`, { useCache: true });
    if (data && data.length > 0) {
      results.push(...data);
    }
  } catch (error) {
    console.warn('Direct ZIP search failed:', error.message);
  }

  // If no results, try country-specific searches for major countries
  if (results.length === 0) {
    const countries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'JP', 'BR', 'MX', 'IT', 'ES'];
    
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
  }

  // Remove duplicates
  return deduplicateResults(results);
}

/**
 * Search by country code
 */
async function searchByCountryCode(countryCode) {
  try {
    const url = `${CONFIG.GEOCODING_URL}/direct?q=${countryCode}&limit=10&appid=${CONFIG.API_KEY}`;
    const data = await fetchWithCache(url, `country:${countryCode}`);

    if (data && data.length > 0) {
      // Filter and return major cities
      return data
        .filter(city => city.name && city.name.length > 2)
        .slice(0, 5);
    }
  } catch (error) {
    console.warn('Country code search failed:', error.message);
  }

  return [];
}

/**
 * Remove duplicate results
 */
function deduplicateResults(results) {
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
 * Format search results for display
 */
function formatSearchResults(results) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter(result => result && result.name && typeof result.lat === 'number')
    .map(result => ({
      name: result.name || 'Unknown',
      state: result.state || '',
      country: result.country || '',
      countryName: COUNTRY_NAMES[result.country] || result.country || '',
      countryFlag: COUNTRY_FLAGS[result.country] || '',
      lat: result.lat,
      lon: result.lon,
      zip: result.zip || ''
    }))
    .slice(0, 5);
}

/**
 * Get full location details including state/province
 */
export async function getLocationDetails(lat, lon) {
  try {
    const results = await reverseGeocode(lat, lon);
    if (results && results.length > 0) {
      const location = results[0];
      return {
        name: location.name || 'Unknown',
        state: location.state || '',
        country: location.country || '',
        countryName: COUNTRY_NAMES[location.country] || location.country || '',
        countryFlag: COUNTRY_FLAGS[location.country] || '',
        lat: location.lat,
        lon: location.lon,
        zip: location.zip || ''
      };
    }
  } catch (error) {
    console.error('Location details error:', error);
  }
  
  return null;
}

/**
 * Get timezone from coordinates (approximate)
 */
export function getTimezoneFromCoords(lat, lon) {
  const offset = Math.round(lon / 15);
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.abs(offset);
  const minutes = (Math.abs(lon) % 15) * 4; // Each degree = 4 minutes
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Clear location cache
 */
export function clearCache() {
  cache.clear();
  console.log('🗑️ Location cache cleared');
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
 * Get country name from code
 */
export function getCountryName(code) {
  return COUNTRY_NAMES[code] || code;
}

/**
 * Get country flag emoji from code
 */
export function getCountryFlag(code) {
  return COUNTRY_FLAGS[code] || '';
}

// Default export
export default {
  searchLocations,
  getLocationDetails,
  clearCache,
  initCacheCleanup,
  getTimezoneFromCoords,
  getCountryName,
  getCountryFlag
};
