/**
 * WeatherNow - Main Application
 * Enhanced with PWA, Export, Comparison, Tips, and more
 */

import CONFIG from './config.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as pwa from './pwa.js';
import * as features from './features.js';
import weatherAnimations from './animations.js';

// Validate API key
if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.API_KEY) {
  console.error('❌ API Key not configured! Please add your API key in js/config.js');
}

// Export state for other modules
export const state = {
  currentLocation: { lat: CONFIG.DEFAULT_LAT, lon: CONFIG.DEFAULT_LON, name: CONFIG.DEFAULT_CITY },
  weatherData: null,
  unit: 'metric',
  theme: 'light',
  isLoading: false,
  searchTimer: null,
  lastUpdated: null
};

async function init() {
  try {
    ui.initElements();
    setupEvents();
    api.initCacheCleanup();
    pwa.initPWA();
    loadSettings();
    applyTheme();
    await loadLocation();
    await fetchWeather();
    updateSavedLocationsUI();
    setupKeyboardShortcuts();
  } catch (error) {
    console.error('Initialization error:', error);
    ui.showError('Failed to initialize app. Please refresh the page.');
  }
}

function setupEvents() {
  ui.setupEventListeners({
    onSearch: handleSearch,
    onSearchEnter: handleSearchEnter,
    onLocation: getUserLocation,
    onThemeToggle: toggleTheme,
    onUnitToggle: toggleUnit,
    onLocationsToggle: toggleLocationsDropdown,
    onRefresh: refreshWeather,
    onCompare: openComparison
  });

  // Refresh buttons
  document.getElementById('refresh-btn')?.addEventListener('click', refreshWeather);
  document.getElementById('refresh-hero-btn')?.addEventListener('click', refreshWeather);
  
  // Export button
  document.getElementById('export-btn')?.addEventListener('click', () => {
    document.getElementById('export-panel')?.classList.add('active');
  });

  document.addEventListener('locationSelected', onLocationSelected);
  document.addEventListener('removeLocation', onRemoveLocation);
}

function setupKeyboardShortcuts() {
  features.setupKeyboardShortcuts({
    onRefresh: refreshWeather,
    onThemeToggle: toggleTheme,
    onUnitToggle: toggleUnit,
    onCompare: openComparison
  });
}

function handleSearch(query) {
  if (state.searchTimer) clearTimeout(state.searchTimer);

  const trimmedQuery = query.trim();

  if (!trimmedQuery || trimmedQuery.length < 2) {
    ui.hideSearchResults();
    ui.showSearchLoading(false);
    return;
  }

  // Show loading state immediately
  ui.showSearchLoading(true);

  state.searchTimer = setTimeout(async () => {
    try {
      const results = await api.searchLocations(trimmedQuery);
      ui.showSearchLoading(false);
      ui.showSearchResults(results, trimmedQuery);
    } catch (err) {
      ui.showSearchLoading(false);
      console.error('Search error:', err);
      
      // Don't show error toast for search - just show message in dropdown
      ui.showSearchResults([], trimmedQuery);
    }
  }, CONFIG.DEBOUNCE_DELAY);
}

async function handleSearchEnter() {
  const query = ui.getSearchValue();
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery || trimmedQuery.length < 2) {
    ui.hideSearchResults();
    ui.showError('Please enter at least 2 characters');
    return;
  }

  try {
    const results = await api.searchLocations(trimmedQuery);
    if (results && results.length > 0) {
      const firstResult = results[0];
      const displayName = ui.formatLocationName(firstResult);
      ui.setSearchValue(displayName);
      ui.hideSearchResults();

      const event = new CustomEvent('locationSelected', {
        detail: { lat: firstResult.lat, lon: firstResult.lon, name: displayName }
      });
      document.dispatchEvent(event);
    } else {
      ui.hideSearchResults();
      ui.showError('Location not found. Try a different spelling.');
    }
  } catch (err) {
    console.error('Search error:', err);
    ui.hideSearchResults();
    ui.showError('Unable to search. Please check your connection.');
  }
}

async function onLocationSelected(e) {
  state.currentLocation = e.detail;
  ui.setSearchValue(e.detail.name);
  await fetchWeather();
}

function onRemoveLocation(e) {
  api.removeLocation(e.detail.lat, e.detail.lon);
  updateSavedLocationsUI();
}

async function getUserLocation() {
  try {
    const pos = await api.getCurrentLocation();
    state.currentLocation = { lat: pos.lat, lon: pos.lon, name: 'Current Location' };
    await fetchWeather();
  } catch (err) {
    ui.showError(err.message);
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  api.saveTheme(state.theme);
  applyTheme();
  if (state.weatherData?.hourly) {
    ui.renderTemperatureGraph(state.weatherData.hourly);
  }
}

function toggleUnit() {
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('weathernow:unit', state.unit);
  ui.updateUnitToggle(state.unit);
  CONFIG.UNITS = state.unit;
  api.clearWeatherCache();
  ui.showLoading('Updating to ' + (state.unit === 'metric' ? '°C' : '°F') + '...');
  fetchWeather();
}

function toggleLocationsDropdown() {
  ui.toggleLocationsDropdown();
}

async function refreshWeather() {
  const btn = document.getElementById('refresh-btn') || document.getElementById('refresh-hero-btn');
  btn?.classList.add('spinning');
  
  try {
    await fetchWeather();
    ui.showError('Weather updated!', 2000);
  } catch (err) {
    ui.showError('Failed to refresh');
  } finally {
    setTimeout(() => btn?.classList.remove('spinning'), 1000);
  }
}

function openComparison() {
  const savedLocations = api.getSavedLocations();
  if (savedLocations.length === 0) {
    ui.showError('Save a location first to compare');
    return;
  }
  
  // Compare current location with first saved location
  const compareLoc = savedLocations[0];
  features.showComparison(
    { name: state.currentLocation.name, temp: state.weatherData?.current.temp },
    { name: compareLoc.name, temp: state.weatherData?.current.temp - 2 } // Mock for now
  );
}

function updateSavedLocationsUI() {
  const locations = api.getSavedLocations();
  ui.updateSavedLocations(locations, state.currentLocation.lat, state.currentLocation.lon);
}

async function fetchWeather() {
  if (state.isLoading) return;

  // Validate API key before making requests
  if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE' || !CONFIG.API_KEY) {
    ui.showError('API Key not configured. Please add your API key in config.js');
    return;
  }

  try {
    state.isLoading = true;
    ui.showLoading('Loading weather...');

    const [current, forecast, aqi] = await Promise.all([
      api.getCurrentWeather(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getForecast(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getAirQuality(state.currentLocation.lat, state.currentLocation.lon)
    ]);

    state.weatherData = api.formatWeatherData(current, forecast, aqi, state.currentLocation.name, state.unit);
    state.lastUpdated = new Date();

    ui.updateCurrentWeather(state.weatherData);
    ui.updateAirQuality(state.weatherData.airQuality);
    ui.updateSunTimes(state.weatherData);
    ui.renderForecast(state.weatherData.daily);
    ui.renderHourly(state.weatherData.hourly);
    ui.renderTemperatureGraph(state.weatherData.hourly);

    // New features
    features.generateWeatherTips(state.weatherData);
    features.generateUVForecast(state.weatherData.daily);
    features.updateSunPosition(
      state.weatherData.current.sunrise,
      state.weatherData.current.sunset
    );
    updateLastUpdated();
    updateCompass(state.weatherData.current.windDeg);

    // Advanced weather animations
    weatherAnimations.init(state.weatherData);

  } catch (err) {
    console.error('Weather error:', err);
    const errorMessage = err.message || 'Failed to load weather data. Please try again.';
    
    // Check for API key errors
    if (errorMessage.includes('401') || errorMessage.includes('Invalid API key')) {
      ui.showError('Invalid API key. Please check your configuration.');
    } else if (errorMessage.includes('404')) {
      ui.showError('Location not found. Please try a different city.');
    } else if (errorMessage.includes('429')) {
      ui.showError('Too many requests. Please wait a moment.');
    } else {
      ui.showError(errorMessage);
    }
  } finally {
    state.isLoading = false;
    ui.hideLoading();
  }
}

function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el && state.lastUpdated) {
    el.textContent = `Last updated: ${state.lastUpdated.toLocaleTimeString()}`;
  }
}

function updateCompass(windDeg) {
  const arrow = document.getElementById('compass-arrow');
  const dirText = document.getElementById('wind-direction-text');
  
  if (arrow) {
    arrow.style.transform = `translateX(-50%) rotate(${windDeg}deg)`;
  }
  
  if (dirText) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(windDeg / 45) % 8;
    dirText.textContent = directions[index];
  }
}

async function loadLocation() {
  try {
    const saved = localStorage.getItem('weathernow:lastLocation');
    if (saved) {
      state.currentLocation = JSON.parse(saved);
      ui.setSearchValue(state.currentLocation.name);
    }
  } catch (err) {
    console.warn('Load location error:', err);
  }
}

function saveLocation() {
  try {
    localStorage.setItem('weathernow:lastLocation', JSON.stringify(state.currentLocation));
  } catch (err) {
    console.warn('Save location error:', err);
  }
}

function loadSettings() {
  try {
    const unit = localStorage.getItem('weathernow:unit');
    if (unit && (unit === 'metric' || unit === 'imperial')) {
      state.unit = unit;
      CONFIG.UNITS = unit;
    }
    ui.updateUnitToggle(state.unit);
    state.theme = api.getCurrentTheme();
  } catch (err) {
    console.warn('Load settings error:', err);
  }
}

function applyTheme() {
  ui.setTheme(state.theme);
}

// Save location after weather fetch
const originalFetchWeather = fetchWeather;
fetchWeather = async function() {
  await originalFetchWeather();
  saveLocation();
};

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
