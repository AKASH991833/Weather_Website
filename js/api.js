/**
 * WeatherNow - API Module
 * Real OpenWeatherMap API integration
 */

import CONFIG from './config.js';

// In-memory cache for weather data
const weatherCache = new Map();
const CACHE_DURATION = CONFIG.CACHE_DURATION;

// Saved locations storage
const SAVED_LOCATIONS_KEY = 'weathernow:savedLocations';
const THEME_KEY = 'weathernow:theme';

/**
 * Search for locations by query
 * Enhanced with support for: cities, countries, states, postal codes, coordinates
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const trimmedQuery = query.trim();

  try {
    let url;
    let results = [];
    
    // Check if query is coordinates (lat,lon)
    const coordMatch = trimmedQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      // Reverse geocoding - get location from coordinates
      url = `${CONFIG.GEOCODING_URL}/reverse?lat=${coordMatch[1]}&lon=${coordMatch[2]}&limit=${CONFIG.MAX_SEARCH_RESULTS}&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }
    // Check if query is postal code (mostly numeric, 4-10 chars)
    else if (/^\d{4,10}$/.test(trimmedQuery)) {
      // Try multiple country codes for postal code search
      results = await searchByPostalCode(trimmedQuery);
    }
    // Check if query is country code (2 letters)
    else if (/^[A-Z]{2}$/i.test(trimmedQuery) && trimmedQuery.length === 2) {
      // Search by country code - get capital cities
      url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(trimmedQuery)}&limit=10&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }
    // Regular city/state/country search
    else {
      // Search with more results to allow client-side filtering
      url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(trimmedQuery)}&limit=10&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        results = await response.json();
      }
    }
    
    // Handle empty results
    if (!results || results.length === 0) {
      return [];
    }

    // Filter and rank results
    const filteredResults = rankAndFilterResults(results, trimmedQuery);
    
    return filteredResults.map(location => ({
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
 * Enhanced with comprehensive Indian PIN code coverage
 */
async function searchByPostalCode(postalCode) {
  const allResults = [];
  
  // === INDIAN PIN CODE SPECIAL HANDLING ===
  if (/^\d{6}$/.test(postalCode)) {
    // Indian PIN codes are 6 digits
    const indiaResult = await searchIndianPinCode(postalCode);
    if (indiaResult && indiaResult.length > 0) {
      allResults.push(...indiaResult);
    }
  }
  
  // === OTHER COUNTRIES ===
  const commonCountries = [
    { code: 'US', name: 'United States' },  // USA ZIP codes
    { code: 'GB', name: 'United Kingdom' }, // UK postcodes (numeric parts)
    { code: 'CA', name: 'Canada' },         // Canadian postal codes
    { code: 'AU', name: 'Australia' },      // Australian postcodes
    { code: 'DE', name: 'Germany' },        // German ZIP codes
    { code: 'FR', name: 'France' },         // French postal codes
    { code: 'IT', name: 'Italy' },          // Italian CAP codes
    { code: 'ES', name: 'Spain' },          // Spanish postal codes
    { code: 'BR', name: 'Brazil' },         // Brazilian CEP codes
    { code: 'JP', name: 'Japan' },          // Japanese postal codes
  ];
  
  // Try searching in multiple countries (skip IN as we already handled it)
  for (const country of commonCountries) {
    try {
      const url = `${CONFIG.GEOCODING_URL}/zip?zip=${postalCode},${country.code}&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.name && data.name !== 'India') {  // Skip generic "India" results
          allResults.push({
            name: data.name,
            lat: data.lat,
            lon: data.lon,
            country: country.code,
            state: data.state || ''
          });
        }
      }
    } catch (err) {
      // Continue to next country if this one fails
      continue;
    }
  }
  
  // Also try without country code (API might find it)
  try {
    const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(postalCode)}&limit=5&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        allResults.push(...data);
      }
    }
  } catch (err) {
    // Ignore errors from fallback search
  }
  
  // Remove duplicates and return
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
 * Search Indian PIN codes using multiple strategies
 */
async function searchIndianPinCode(pinCode) {
  const results = [];
  
  // Strategy 1: Try ZIP API
  try {
    const url = `${CONFIG.GEOCODING_URL}/zip?zip=${pinCode},IN&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.name && data.name !== 'India') {
        results.push({
          name: data.name,
          lat: data.lat,
          lon: data.lon,
          country: 'IN',
          state: data.state || getIndianStateFromPin(pinCode)
        });
      }
    }
  } catch (err) {
    // Continue to next strategy
  }
  
  // Strategy 2: Try direct search with PIN code
  if (results.length === 0) {
    try {
      const url = `${CONFIG.GEOCODING_URL}/direct?q=${pinCode}%20India&limit=5&appid=${CONFIG.API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Filter for Indian results only
          const indianResults = data.filter(loc => loc.country === 'IN');
          results.push(...indianResults.map(loc => ({
            name: loc.name,
            lat: loc.lat,
            lon: loc.lon,
            country: 'IN',
            state: loc.state || getIndianStateFromPin(pinCode)
          })));
        }
      }
    } catch (err) {
      // Continue
    }
  }
  
  // Strategy 3: Use PIN code to state mapping for major cities
  if (results.length === 0) {
    const state = getIndianStateFromPin(pinCode);
    if (state) {
      // Search for major cities in that state
      const majorCities = getMajorCitiesForState(state);
      for (const city of majorCities) {
        try {
          const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(city)},${state},IN&limit=1&appid=${CONFIG.API_KEY}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              results.push({
                name: data[0].name,
                lat: data[0].lat,
                lon: data[0].lon,
                country: 'IN',
                state: state
              });
              break; // Found one result, that's enough
            }
          }
        } catch (err) {
          continue;
        }
      }
    }
  }
  
  return results;
}

/**
 * Get Indian state from PIN code (first digit indicates region)
 */
function getIndianStateFromPin(pinCode) {
  const firstDigit = pinCode.charAt(0);
  
  const stateMap = {
    '1': 'Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Ladakh',
    '2': 'Uttar Pradesh, Uttarakhand',
    '3': 'Rajasthan, Gujarat, Dadra & Nagar Haveli, Daman & Diu',
    '4': 'Maharashtra, Goa, Andhra Pradesh (parts)',
    '5': 'Andhra Pradesh, Telangana, Karnataka (parts)',
    '6': 'Tamil Nadu, Kerala, Lakshadweep, Puducherry',
    '7': 'West Bengal, Odisha, Sikkim, Assam, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Meghalaya',
    '8': 'Bihar, Jharkhand',
    '9': 'Army Post (APO), Field Post (FPO)'
  };
  
  return stateMap[firstDigit] || '';
}

/**
 * Get major cities for an Indian state
 */
function getMajorCitiesForState(state) {
  const cities = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'],
    'Telangana': ['Hyderabad', 'Warangal'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
  };
  
  // Find matching state
  for (const [stateName, citiesList] of Object.entries(cities)) {
    if (state.toLowerCase().includes(stateName.toLowerCase())) {
      return citiesList;
    }
  }
  
  // Default to major metros
  return ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
}

/**
 * Filter and rank search results
 * - Prioritize capital cities and major population centers
 * - Remove duplicates (same name + state)
 * - Boost country-level results when searching country names
 * - Limit to MAX_SEARCH_RESULTS
 */
function rankAndFilterResults(results, query) {
  if (!results || results.length === 0) return [];
  
  // Remove duplicates based on name + state
  const uniqueMap = new Map();
  
  results.forEach(location => {
    const key = `${location.name}|${location.state || ''}|${location.country}`;
    
    // Keep first occurrence (API returns ranked by population)
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, location);
    }
  });
  
  const uniqueResults = Array.from(uniqueMap.values());
  
  // Boost results that match query exactly
  const queryLower = query.toLowerCase();
  uniqueResults.sort((a, b) => {
    // 1. Exact name match gets priority
    const aNameMatch = a.name.toLowerCase() === queryLower;
    const bNameMatch = b.name.toLowerCase() === queryLower;
    
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    
    // 2. If searching for a country name, boost cities in that country
    // (This helps when searching "India" - show Indian cities first)
    const aCountryMatch = a.country?.toLowerCase() === queryLower || 
                          a.country?.toLowerCase() === queryLower.substring(0, 2);
    const bCountryMatch = b.country?.toLowerCase() === queryLower ||
                          b.country?.toLowerCase() === queryLower.substring(0, 2);
    
    if (aCountryMatch && !bCountryMatch) return -1;
    if (!aCountryMatch && bCountryMatch) return 1;
    
    // 3. Prefer results with state info (more specific)
    const aHasState = !!a.state;
    const bHasState = !!b.state;
    if (aHasState && !bHasState) return -1;
    if (!aHasState && bHasState) return 1;
    
    // 4. Prefer larger cities (API returns by population, so first = larger)
    // Keep original order for everything else
    return 0;
  });
  
  return uniqueResults.slice(0, CONFIG.MAX_SEARCH_RESULTS);
}

/**
 * Get current weather for a location
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
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait.');
      } else if (response.status === 404) {
        throw new Error('Location not found');
      }
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
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait.');
      }
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
 */
export async function getAirQuality(lat, lon) {
  const cacheKey = `aqi:${lat}:${lon}`;
  const cached = getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait.');
      }
      // Air quality is optional, don't throw error for 404
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
    // Return null for network errors (air quality is optional)
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
      windSpeed: Math.round(current.wind.speed * 3.6), // m/s to km/h
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
  // Clean cache every 10 minutes
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
