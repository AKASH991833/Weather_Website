/**
 * WeatherNow - Main Application (Enhanced)
 * Worldwide weather with comprehensive location data
 */

import CONFIG from './config.js';
import * as api from './api-enhanced.js';
import locationDisplay from './location-display.js';
import * as ui from './ui.js';
import * as pwa from './pwa.js';
import weatherAnimations from './animations.js';

// Application state
const state = {
  currentLocation: null,
  weatherData: null,
  unit: 'metric',
  theme: 'light',
  isLoading: false,
  searchTimer: null
};

/**
 * Initialize application
 */
async function init() {
  try {
    // Initialize modules
    ui.initElements();
    locationDisplay.initLocationInfoCard();
    setupEventListeners();
    api.initCacheCleanup();
    pwa.initPWA();
    
    // Load saved settings
    loadSettings();
    applyTheme();
    
    // Load last location or default
    await loadLocation();
    await fetchWeather();
    
    console.log('✅ WeatherNow initialized successfully');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    ui.showError('Failed to initialize. Please refresh the page.');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
  }
  
  // Location button
  const locationBtn = document.getElementById('location-btn');
  if (locationBtn) {
    locationBtn.addEventListener('click', getUserLocation);
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Unit toggle
  const unitToggle = document.getElementById('unit-toggle');
  if (unitToggle) {
    unitToggle.addEventListener('click', toggleUnit);
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshWeather);
  }
  
  // Close location card
  const closeLocationCard = document.getElementById('close-location-card');
  if (closeLocationCard) {
    closeLocationCard.addEventListener('click', () => {
      locationDisplay.hideLocationInfoCard();
    });
  }
  
  // Handle location selection
  document.addEventListener('locationSelected', handleLocationSelected);
  
  // Click outside to close dropdowns
  document.addEventListener('click', handleOutsideClick);
}

/**
 * Handle search input with debounce
 */
function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  // Clear previous timer
  if (state.searchTimer) {
    clearTimeout(state.searchTimer);
  }
  
  // Hide results if query too short
  if (query.length < 2) {
    ui.hideSearchResults();
    return;
  }
  
  // Debounce search
  state.searchTimer = setTimeout(async () => {
    await performSearch(query);
  }, 300);
}

/**
 * Handle search keyboard events
 */
function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    selectFirstSearchResult();
  } else if (e.key === 'Escape') {
    ui.hideSearchResults();
    e.target.blur();
  }
}

/**
 * Perform search
 */
async function performSearch(query) {
  try {
    ui.showSearchLoading(true);
    const results = await api.searchLocations(query);
    ui.showSearchLoading(false);
    ui.showSearchResults(results, query);
  } catch (error) {
    ui.showSearchLoading(false);
    console.error('Search error:', error);
    ui.hideSearchResults();
    
    // Show user-friendly error
    let errorMessage = 'Unable to search. ';
    if (error.message.includes('rate limit')) {
      errorMessage += 'Too many requests. Please wait a moment.';
    } else if (error.message.includes('API key')) {
      errorMessage += 'Configuration error. Please contact support.';
    } else {
      errorMessage += 'Please check your connection and try again.';
    }
    ui.showError(errorMessage);
  }
}

/**
 * Select first search result
 */
function selectFirstSearchResult() {
  const firstResult = document.querySelector('.search-result-item');
  if (firstResult) {
    firstResult.click();
  }
}

/**
 * Handle location selection from search
 */
async function handleLocationSelected(e) {
  const { lat, lon, name, state: stateName, country } = e.detail;
  
  if (!lat || !lon) {
    ui.showError('Invalid location selected');
    return;
  }
  
  // Update current location
  state.currentLocation = {
    lat,
    lon,
    name: name || 'Selected Location',
    state: stateName || '',
    country: country || ''
  };
  
  // Update search input
  ui.setSearchValue(formatLocationName(state.currentLocation));
  ui.hideSearchResults();
  
  // Show location info card
  locationDisplay.showLocationInfo(state.currentLocation);
  
  // Fetch weather
  await fetchWeather();
  
  // Save location
  saveLocation(state.currentLocation);
}

/**
 * Get user's current location
 */
async function getUserLocation() {
  try {
    ui.showLoading('Getting your location...');
    
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }
    
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });
    
    const { latitude, longitude } = position.coords;
    
    // Reverse geocode to get location name
    const results = await api.searchLocations(`${latitude}, ${longitude}`);
    const location = results[0] || {
      lat: latitude,
      lon: longitude,
      name: 'Current Location',
      state: '',
      country: ''
    };
    
    state.currentLocation = location;
    locationDisplay.showLocationInfo(location);
    await fetchWeather();
    
  } catch (error) {
    console.error('Location error:', error);
    let errorMessage = 'Unable to get your location. ';
    
    if (error.message.includes('Permission denied')) {
      errorMessage += 'Please enable location permissions in your browser.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Location request timed out. Please try again.';
    }
    
    ui.showError(errorMessage);
  } finally {
    ui.hideLoading();
  }
}

/**
 * Fetch weather data
 */
async function fetchWeather() {
  if (!state.currentLocation || state.isLoading) {
    return;
  }
  
  try {
    state.isLoading = true;
    ui.showLoading('Loading weather...');
    
    // Fetch current weather, forecast, and air quality in parallel
    const [weatherData, forecastData, airQuality] = await Promise.all([
      api.getCurrentWeather(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getForecast(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getAirQuality(state.currentLocation.lat, state.currentLocation.lon)
    ]);
    
    // Combine data
    state.weatherData = {
      ...weatherData,
      ...forecastData,
      airQuality
    };
    
    // Update UI
    ui.updateCurrentWeather(state.weatherData);
    ui.updateAirQuality(airQuality);
    ui.updateSunTimes(state.weatherData);
    ui.renderForecast(state.weatherData.daily);
    ui.renderHourly(state.weatherData.hourly);
    ui.renderTemperatureGraph(state.weatherData.hourly);
    
    // Update location card with weather
    locationDisplay.showLocationInfo(state.currentLocation, state.weatherData);
    
    // Initialize weather animations
    weatherAnimations.init(state.weatherData);
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    
    let errorMessage = 'Failed to load weather. ';
    if (error.message.includes('API key')) {
      errorMessage += 'Invalid API configuration.';
    } else if (error.message.includes('rate limit')) {
      errorMessage += 'Too many requests. Please wait.';
    } else if (error.message.includes('Network')) {
      errorMessage += 'Please check your internet connection.';
    } else {
      errorMessage += 'Please try again.';
    }
    
    ui.showError(errorMessage);
  } finally {
    state.isLoading = false;
    ui.hideLoading();
  }
}

/**
 * Refresh weather data
 */
async function refreshWeather() {
  const btn = document.getElementById('refresh-btn');
  if (btn) {
    btn.classList.add('spinning');
  }
  
  try {
    api.clearCache();
    await fetchWeather();
    ui.showError('Weather updated!', 2000);
  } catch (error) {
    console.error('Refresh error:', error);
  } finally {
    if (btn) {
      setTimeout(() => btn.classList.remove('spinning'), 1000);
    }
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('weathernow:theme', state.theme);
  applyTheme();
}

/**
 * Apply theme
 */
function applyTheme() {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${state.theme}`);
}

/**
 * Toggle temperature unit
 */
function toggleUnit() {
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('weathernow:unit', state.unit);
  ui.updateUnitToggle(state.unit);
  api.clearCache();
  fetchWeather();
}

/**
 * Load saved location
 */
async function loadLocation() {
  try {
    const saved = localStorage.getItem('weathernow:lastLocation');
    if (saved) {
      state.currentLocation = JSON.parse(saved);
      ui.setSearchValue(formatLocationName(state.currentLocation));
    }
  } catch (error) {
    console.warn('Load location error:', error);
  }
}

/**
 * Save location
 */
function saveLocation(location) {
  try {
    localStorage.setItem('weathernow:lastLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Save location error:', error);
  }
}

/**
 * Load settings
 */
function loadSettings() {
  try {
    const unit = localStorage.getItem('weathernow:unit');
    if (unit && (unit === 'metric' || unit === 'imperial')) {
      state.unit = unit;
      ui.updateUnitToggle(unit);
    }
    
    const theme = localStorage.getItem('weathernow:theme');
    if (theme) {
      state.theme = theme;
    }
  } catch (error) {
    console.warn('Load settings error:', error);
  }
}

/**
 * Format location name for display
 */
function formatLocationName(location) {
  if (!location) return '';
  
  const parts = [location.name];
  
  if (location.state && location.state.toLowerCase() !== location.name.toLowerCase()) {
    parts.push(location.state);
  }
  
  if (location.country) {
    parts.push(location.country);
  }
  
  return parts.filter(Boolean).join(', ');
}

/**
 * Handle clicks outside dropdowns
 */
function handleOutsideClick(e) {
  const searchContainer = document.querySelector('.search-container');
  const searchResults = document.getElementById('search-results');
  
  if (searchContainer && !searchContainer.contains(e.target)) {
    ui.hideSearchResults();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
