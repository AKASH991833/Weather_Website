/**
 * WeatherNow - Frontend JavaScript
 * Fetches weather data from the backend API
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
  
  console.log('WeatherNow initialized');
  console.log('API Base URL:', API_BASE_URL);
});

/**
 * Check API health status
 */
async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'ok') {
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
    showError('Please enter a city name');
    return;
  }
  
  await fetchWeather(city);
}

/**
 * Get weather for current location
 */
function getLocationWeather() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // First get location name from coordinates
        const locationResponse = await fetch(
          `${API_BASE_URL}/reverse-geo?lat=${latitude}&lon=${longitude}`
        );
        const locationDataArray = await locationResponse.json();

        let cityName = 'Current Location';
        if (locationDataArray && Array.isArray(locationDataArray) && locationDataArray.length > 0) {
          cityName = locationDataArray[0].name || 'Current Location';
        }

        // Then get weather data
        await fetchWeatherByCoords(latitude, longitude, cityName);
      } catch (error) {
        showError('Failed to get location weather: ' + error.message);
      }
    },
    (error) => {
      showError('Unable to get your location: ' + error.message);
    }
  );
}

/**
 * Fetch weather by city name
 */
async function fetchWeather(city) {
  showLoading();

  try {
    // First geocode the city to get coordinates
    const geoResponse = await fetch(`${API_BASE_URL}/geo?q=${encodeURIComponent(city)}`);
    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      showError(`City "${city}" not found. Please try another city.`);
      return;
    }

    const location = geoData[0];
    
    // Validate location data
    if (!location.lat || !location.lon) {
      showError('Invalid location data received. Please try another city.');
      return;
    }
    
    await fetchWeatherByCoords(location.lat, location.lon, location.name);
  } catch (error) {
    showError('Failed to fetch weather: ' + error.message);
  }
}

/**
 * Fetch weather by coordinates
 */
async function fetchWeatherByCoords(lat, lon, cityName) {
  try {
    // Fetch current weather
    const weatherResponse = await fetch(
      `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Fetch air quality
    let airQualityData = null;
    try {
      const airResponse = await fetch(
        `${API_BASE_URL}/air-pollution?lat=${lat}&lon=${lon}`
      );
      if (airResponse.ok) {
        airQualityData = await airResponse.json();
      }
    } catch (e) {
      console.log('Air quality data not available');
    }
    
    displayWeather(weatherData, airQualityData, cityName);
  } catch (error) {
    showError('Failed to fetch weather: ' + error.message);
  }
}

/**
 * Display weather data
 */
function displayWeather(weather, airQuality, cityName) {
  hideLoading();
  hideError();
  
  // Location info
  document.getElementById('city-name').textContent = 
    `${weather.name}, ${weather.sys.country}`;
  document.getElementById('current-date').textContent = 
    getCurrentDate();
  
  // Main weather
  const temp = Math.round(weather.main.temp);
  document.getElementById('temperature').textContent = temp;
  document.getElementById('weather-description').textContent = 
    weather.weather[0].description;
  document.getElementById('weather-icon').src = 
    `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
  document.getElementById('weather-icon').alt = weather.weather[0].description;
  
  // Badges
  document.getElementById('feels-like-badge').textContent = 
    `Feels like ${Math.round(weather.main.feels_like)}°`;
  document.getElementById('humidity-badge').textContent = 
    `Humidity: ${weather.main.humidity}%`;
  
  // Weather details
  document.getElementById('wind-speed').textContent = 
    `${(weather.wind.speed * 3.6).toFixed(1)} km/h`; // Convert m/s to km/h
  document.getElementById('visibility').textContent = 
    `${(weather.visibility / 1000).toFixed(1)} km`;
  document.getElementById('pressure').textContent = 
    `${weather.main.pressure} hPa`;
  document.getElementById('feels-like').textContent = 
    `${Math.round(weather.main.feels_like)}°`;
  
  // Air quality
  if (airQuality && airQuality.list && airQuality.list.length > 0) {
    const aqi = airQuality.list[0];
    const aqiValue = aqi.main.aqi;
    const components = aqi.components;
    
    const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const aqiColors = [
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #84cc16, #65a30d)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #f97316, #ea580c)',
      'linear-gradient(135deg, #ef4444, #dc2626)'
    ];
    
    const aqiElement = document.getElementById('aqi-value');
    aqiElement.textContent = aqiValue;
    aqiElement.style.background = aqiColors[aqiValue - 1] || aqiColors[0];
    
    document.getElementById('aqi-label').textContent = 
      aqiLabels[aqiValue - 1] || 'Unknown';
    document.getElementById('aqi-label').style.color = 
      aqiColors[aqiValue - 1] || aqiColors[0];
    
    document.getElementById('pm25').textContent = 
      `${components.pm2_5?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('pm10').textContent = 
      `${components.pm10?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('o3').textContent = 
      `${components.o3?.toFixed(1) || '--'} μg/m³`;
    document.getElementById('no2').textContent = 
      `${components.no2?.toFixed(1) || '--'} μg/m³`;
  } else {
    document.getElementById('aqi-value').textContent = '--';
    document.getElementById('aqi-label').textContent = 'Not available';
  }
  
  weatherDisplay.classList.remove('hidden');
}

/**
 * Get current date formatted
 */
function getCurrentDate() {
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
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.add('hidden');
}
