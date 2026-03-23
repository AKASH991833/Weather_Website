/**
 * WeatherNow - Frontend JavaScript
 * Comprehensive error handling and safe data access
 */

// API Base URL - automatically detects current domain
const API_BASE_URL = window.location.origin + '/api';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherDisplay = document.getElementById('weather-display');
const apiStatus = document.getElementById('api-status');
const apiUrlDisplay = document.getElementById('api-url');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  apiUrlDisplay.textContent = API_BASE_URL;
  checkApiHealth();
  
  // Event listeners
  searchBtn.addEventListener('click', searchWeather);
  locationBtn.addEventListener('click', getLocationWeather);
  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
  });
  
  console.log('🌤️ WeatherNow initialized');
  console.log('API Base URL:', API_BASE_URL);
});

/**
 * Check API health status
 */
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data && data.status === 'ok') {
      apiStatus.textContent = 'Online ✓';
      apiStatus.style.color = '#10b981';
    } else {
      apiStatus.textContent = 'Degraded';
      apiStatus.style.color = '#f59e0b';
    }
  } catch (error) {
    apiStatus.textContent = 'Offline ✗';
    apiStatus.style.color = '#ef4444';
    console.error('API health check failed:', error);
  }
}

/**
 * Search weather by city name
 */
async function searchWeather() {
  const city = cityInput.value.trim();
  
  if (!city) {
    showError('Please enter a city name to search');
    return;
  }
  
  // Validate city name (basic validation)
  if (city.length < 2) {
    showError('City name must be at least 2 characters');
    return;
  }
  
  await fetchWeather(city);
}

/**
 * Get weather for current location
 */
function getLocationWeather() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser. Please use a modern browser.');
    return;
  }
  
  showLoading();
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Validate coordinates
      if (!isValidCoordinate(latitude, longitude)) {
        showError('Invalid location coordinates received');
        return;
      }
      
      try {
        // First get location name from coordinates
        const locationResponse = await fetch(
          `${API_BASE_URL}/reverse-geo?lat=${latitude}&lon=${longitude}`
        );
        
        if (!locationResponse.ok) {
          throw new Error('Failed to get location name');
        }
        
        const locationDataArray = await locationResponse.json();
        
        let cityName = 'Current Location';
        if (locationDataArray && Array.isArray(locationDataArray) && locationDataArray.length > 0) {
          cityName = locationDataArray[0].name || 'Current Location';
        }
        
        // Then get weather data
        await fetchWeatherByCoords(latitude, longitude, cityName);
      } catch (error) {
        console.error('Location weather error:', error);
        showError('Failed to get weather for your location. Please try searching for a city.');
      }
    },
    (error) => {
      let errorMsg = 'Unable to get your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'Location access denied. Please enable location permissions in your browser.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'Location information unavailable. Please try searching for a city.';
          break;
        case error.TIMEOUT:
          errorMsg = 'Location request timed out. Please try again or search for a city.';
          break;
      }
      
      showError(errorMsg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

/**
 * Validate coordinates
 */
function isValidCoordinate(lat, lon) {
  return typeof lat === 'number' && 
         typeof lon === 'number' && 
         !isNaN(lat) && 
         !isNaN(lon) &&
         lat >= -90 && lat <= 90 &&
         lon >= -180 && lon <= 180;
}

/**
 * Fetch weather by city name
 */
async function fetchWeather(city) {
  showLoading();
  
  try {
    // First geocode the city to get coordinates
    const geoResponse = await fetch(`${API_BASE_URL}/geo?q=${encodeURIComponent(city)}`);
    
    if (!geoResponse.ok) {
      throw new Error('Failed to search for city');
    }
    
    const geoData = await geoResponse.json();
    
    // Check if we got valid results
    if (!geoData || !Array.isArray(geoData) || geoData.length === 0) {
      showError(`City "${city}" not found. Please check the spelling and try again.`);
      return;
    }
    
    const location = geoData[0];
    
    // Validate location data
    if (!location || typeof location !== 'object') {
      showError('Invalid location data received. Please try another city.');
      return;
    }
    
    if (!isValidCoordinate(location.lat, location.lon)) {
      showError('Invalid coordinates for this location. Please try another city.');
      return;
    }
    
    const cityName = location.name || city;
    await fetchWeatherByCoords(location.lat, location.lon, cityName);
  } catch (error) {
    console.error('Fetch weather error:', error);
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      showError('Network error. Please check your internet connection and try again.');
    } else {
      showError('Unable to fetch weather data. Please try again.');
    }
  }
}

/**
 * Fetch weather by coordinates with comprehensive error handling
 */
async function fetchWeatherByCoords(lat, lon, cityName) {
  try {
    // Fetch current weather
    const weatherResponse = await fetch(
      `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric`
    );
    
    // Handle HTTP errors
    if (!weatherResponse.ok) {
      let errorData = {};
      try {
        errorData = await weatherResponse.json();
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      const errorMessage = errorData.message || 'Failed to fetch weather data';
      const errorCode = errorData.error || 'UNKNOWN_ERROR';
      
      console.error('Weather API error:', errorCode, errorMessage);
      
      // User-friendly error messages based on error type
      switch (errorCode) {
        case 'INVALID_API_KEY':
          showError('Weather service configuration error. Please contact support.');
          break;
        case 'LOCATION_NOT_FOUND':
          showError('Weather data not available for this location.');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          showError('Too many requests. Please wait a moment and try again.');
          break;
        case 'NETWORK_ERROR':
          showError('Network error. Please check your connection.');
          break;
        default:
          showError(`Unable to fetch weather: ${errorMessage}`);
      }
      return;
    }
    
    const weatherData = await weatherResponse.json();
    
    // Validate weather data structure
    if (!validateWeatherData(weatherData)) {
      showError('Received invalid weather data. Please try again.');
      return;
    }
    
    // Fetch air quality (non-critical, so don't fail if it errors)
    let airQualityData = null;
    try {
      const airResponse = await fetch(
        `${API_BASE_URL}/air-pollution?lat=${lat}&lon=${lon}`
      );
      
      if (airResponse && airResponse.ok) {
        airQualityData = await airResponse.json();
      }
    } catch (e) {
      console.log('Air quality data not available (non-critical)');
    }
    
    // Display the weather
    displayWeather(weatherData, airQualityData, cityName);
  } catch (error) {
    console.error('Fetch weather by coords error:', error);
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      showError('Network error. Please check your internet connection.');
    } else {
      showError('An unexpected error occurred. Please try again.');
    }
  }
}

/**
 * Validate weather data structure
 */
function validateWeatherData(data) {
  if (!data || typeof data !== 'object') {
    console.error('Invalid weather data: not an object');
    return false;
  }
  
  // Check required fields
  const requiredFields = [
    { field: 'name', type: 'string' },
    { field: 'coord', type: 'object' },
    { field: 'main', type: 'object' },
    { field: 'weather', type: 'array' }
  ];
  
  for (const { field, type } of requiredFields) {
    if (!data[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
    if (typeof data[field] !== type) {
      console.error(`Invalid type for ${field}: expected ${type}`);
      return false;
    }
  }
  
  // Validate nested fields
  if (typeof data.coord.lat !== 'number' || typeof data.coord.lon !== 'number') {
    console.error('Invalid coordinates in weather data');
    return false;
  }
  
  if (typeof data.main.temp !== 'number') {
    console.error('Invalid temperature in weather data');
    return false;
  }
  
  if (!data.weather[0] || !data.weather[0].description || !data.weather[0].icon) {
    console.error('Invalid weather description');
    return false;
  }
  
  return true;
}

/**
 * Display weather data with safe property access
 */
function displayWeather(weather, airQuality, cityName) {
  try {
    hideLoading();
    hideError();
    
    // Location info with safe access
    const locationName = safeGet(weather, 'name', 'Unknown');
    const countryCode = safeGet(weather, 'sys.country', '');
    document.getElementById('city-name').textContent = 
      `${locationName}${countryCode ? ', ' + countryCode : ''}`;
    document.getElementById('current-date').textContent = getCurrentDate();
    
    // Main weather with safe access
    const temp = safeGet(weather, 'main.temp', null);
    if (temp === null) {
      showError('Temperature data not available');
      return;
    }
    
    document.getElementById('temperature').textContent = Math.round(temp);
    
    const weatherDesc = safeGet(weather, 'weather[0].description', 'No data');
    document.getElementById('weather-description').textContent = 
      weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1);
    
    const weatherIcon = safeGet(weather, 'weather[0].icon', '');
    const weatherIconEl = document.getElementById('weather-icon');
    if (weatherIcon) {
      weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
      weatherIconEl.alt = weatherDesc;
    } else {
      weatherIconEl.src = '';
      weatherIconEl.alt = 'No icon';
    }
    
    // Badges with safe access
    const feelsLike = safeGet(weather, 'main.feels_like', temp);
    document.getElementById('feels-like-badge').textContent = 
      `Feels like ${Math.round(feelsLike)}°`;
    
    const humidity = safeGet(weather, 'main.humidity', null);
    document.getElementById('humidity-badge').textContent = 
      humidity !== null ? `Humidity: ${humidity}%` : 'Humidity: N/A';
    
    // Weather details with safe access and defaults
    const windSpeed = safeGet(weather, 'wind.speed', 0);
    document.getElementById('wind-speed').textContent = 
      `${(windSpeed * 3.6).toFixed(1)} km/h`;
    
    const visibility = safeGet(weather, 'visibility', 0);
    document.getElementById('visibility').textContent = 
      `${(visibility / 1000).toFixed(1)} km`;
    
    const pressure = safeGet(weather, 'main.pressure', null);
    document.getElementById('pressure').textContent = 
      pressure !== null ? `${pressure} hPa` : 'N/A';
    
    document.getElementById('feels-like').textContent = 
      `${Math.round(feelsLike)}°`;
    
    // Air quality with safe access
    displayAirQuality(airQuality);
    
    weatherDisplay.classList.remove('hidden');
  } catch (error) {
    console.error('Display weather error:', error);
    showError('Error displaying weather data. Please try again.');
  }
}

/**
 * Display air quality data
 */
function displayAirQuality(airQuality) {
  const aqiValueEl = document.getElementById('aqi-value');
  const aqiLabelEl = document.getElementById('aqi-label');
  
  // Check if air quality data is available
  if (!airQuality || !airQuality.list || !Array.isArray(airQuality.list) || airQuality.list.length === 0) {
    aqiValueEl.textContent = '--';
    aqiLabelEl.textContent = 'Not available';
    aqiLabelEl.style.color = '#6b7280';
    
    // Set all pollutant values to '--'
    ['pm25', 'pm10', 'o3', 'no2'].forEach(id => {
      document.getElementById(id).textContent = '--';
    });
    return;
  }
  
  try {
    const aqi = airQuality.list[0];
    const aqiValue = safeGet(aqi, 'main.aqi', null);
    const components = safeGet(aqi, 'components', {});
    
    if (aqiValue === null) {
      aqiValueEl.textContent = '--';
      aqiLabelEl.textContent = 'Not available';
      return;
    }
    
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiColors = [
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #84cc16, #65a30d)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #f97316, #ea580c)',
      'linear-gradient(135deg, #ef4444, #dc2626)'
    ];
    
    const index = Math.max(0, Math.min(aqiValue - 1, 4));
    
    aqiValueEl.textContent = aqiValue;
    aqiValueEl.style.background = aqiColors[index];
    
    aqiLabelEl.textContent = aqiLabels[index];
    aqiLabelEl.style.color = aqiColors[index].split(',')[0].replace('linear-gradient(135deg, ', '');
    
    // Pollutant values with safe access
    document.getElementById('pm25').textContent = 
      `${safeGet(components, 'pm2_5', null)?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('pm10').textContent = 
      `${safeGet(components, 'pm10', null)?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('o3').textContent = 
      `${safeGet(components, 'o3', null)?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('no2').textContent = 
      `${safeGet(components, 'no2', null)?.toFixed(1) || '--'} μg/m³`;
  } catch (error) {
    console.error('Display air quality error:', error);
    aqiValueEl.textContent = '--';
    aqiLabelEl.textContent = 'Error';
  }
}

/**
 * Safe property access helper
 * Supports dot notation and array access: 'weather[0].icon'
 */
function safeGet(obj, path, defaultValue = null) {
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
    console.warn('Safe get failed for path:', path, e);
    return defaultValue;
  }
}

/**
 * Get current date formatted
 */
function getCurrentDate() {
  try {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleDateString('en-US', options);
  } catch (e) {
    return new Date().toLocaleString();
  }
}

/**
 * Show loading state
 */
function showLoading() {
  loading.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
  errorMessage.classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
  loading.classList.add('hidden');
}

/**
 * Show error message
 */
function showError(message) {
  hideLoading();
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  weatherDisplay.classList.add('hidden');
  console.error('Error displayed to user:', message);
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.add('hidden');
}
