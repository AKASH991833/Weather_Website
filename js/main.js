/**
 * WeatherNow - Main Application
 * All Features Integrated
 */

import CONFIG from './config.js';
import * as api from './api.js';
import * as ui from './ui.js';

const state = {
  currentLocation: { lat: CONFIG.DEFAULT_LAT, lon: CONFIG.DEFAULT_LON, name: CONFIG.DEFAULT_CITY },
  weatherData: null,
  unit: 'metric',
  theme: 'light',
  isLoading: false,
  searchTimer: null
};

async function init() {
  ui.initElements();
  setupEvents();
  api.initCacheCleanup();
  loadSettings();
  applyTheme();
  await loadLocation();
  await fetchWeather();
  updateSavedLocationsUI();
}

function setupEvents() {
  ui.setupEventListeners({
    onSearch: handleSearch,
    onSearchEnter: handleSearchEnter,
    onLocation: getUserLocation,
    onThemeToggle: toggleTheme,
    onUnitToggle: toggleUnit,
    onLocationsToggle: toggleLocationsDropdown
  });

  document.addEventListener('locationSelected', onLocationSelected);
  document.addEventListener('removeLocation', onRemoveLocation);
}

function handleSearch(query) {
  if (state.searchTimer) clearTimeout(state.searchTimer);
  
  if (!query || query.trim().length < 2) {
    ui.hideSearchResults();
    return;
  }
  
  state.searchTimer = setTimeout(async () => {
    try {
      const results = await api.searchLocations(query.trim());
      ui.showSearchResults(results, query);
    } catch (err) {
      console.error('Search error:', err);
      ui.showError('Location not found. Try a different spelling or city name.');
    }
  }, CONFIG.DEBOUNCE_DELAY);
}

async function handleSearchEnter() {
  const query = ui.getSearchValue();
  if (!query || query.trim().length < 2) {
    ui.showError('Please enter at least 2 characters');
    return;
  }
  
  try {
    const results = await api.searchLocations(query.trim());
    if (results && results.length > 0) {
      // Select first result automatically (like Google "I'm Feeling Lucky")
      const firstResult = results[0];
      const displayName = ui.formatLocationName(firstResult);
      ui.setSearchValue(displayName);
      ui.hideSearchResults();
      
      const event = new CustomEvent('locationSelected', {
        detail: { lat: firstResult.lat, lon: firstResult.lon, name: displayName }
      });
      document.dispatchEvent(event);
    } else {
      ui.showError('Location not found. Try a different spelling.');
    }
  } catch (err) {
    console.error('Search error:', err);
    ui.showError('Unable to search. Please check your connection.');
  }
}

async function onLocationSelected(e) {
  state.currentLocation = e.detail;
  ui.setSearchValue(e.detail.name);
  await fetchWeather();
  // Removed: addCurrentLocation() - No auto-save to history
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
    // Removed: addCurrentLocation() - No auto-save to history
  } catch (err) {
    ui.showError(err.message);
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  api.saveTheme(state.theme);
  applyTheme();
  // Re-render graph with new theme
  if (state.weatherData?.hourly) {
    ui.renderTemperatureGraph(state.weatherData.hourly);
  }
}

function toggleUnit() {
  console.log('=== TOGGLE UNIT ===');
  console.log('Old unit:', state.unit);
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  console.log('New unit:', state.unit);
  
  localStorage.setItem('weathernow:unit', state.unit);
  ui.updateUnitToggle(state.unit);
  CONFIG.UNITS = state.unit;

  // Clear weather cache to force fresh API call
  api.clearWeatherCache();
  console.log('Cache cleared');

  // Show loading indicator
  ui.showLoading('Updating to ' + (state.unit === 'metric' ? '°C' : '°F') + '...');

  // Re-fetch weather with new unit
  fetchWeather();
}

function toggleLocationsDropdown() {
  ui.toggleLocationsDropdown();
}

// Removed: addCurrentLocation - No history saving

function updateSavedLocationsUI() {
  const locations = api.getSavedLocations();
  ui.updateSavedLocations(locations, state.currentLocation.lat, state.currentLocation.lon);
}

async function fetchWeather() {
  if (state.isLoading) return;
  
  try {
    state.isLoading = true;
    console.log('=== FETCH WEATHER ===');
    console.log('Location:', state.currentLocation.name);
    console.log('Unit:', state.unit);

    const [current, forecast, aqi] = await Promise.all([
      api.getCurrentWeather(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getForecast(state.currentLocation.lat, state.currentLocation.lon, state.unit),
      api.getAirQuality(state.currentLocation.lat, state.currentLocation.lon)
    ]);
    
    console.log('Current weather temp:', current.main.temp);
    console.log('Forecast first temp:', forecast.list[0].main.temp);
    
    state.weatherData = api.formatWeatherData(current, forecast, aqi, state.currentLocation.name, state.unit);
    
    console.log('Formatted temp:', state.weatherData.current.temp);
    
    ui.updateCurrentWeather(state.weatherData);
    ui.updateAirQuality(state.weatherData.airQuality);
    ui.updateSunTimes(state.weatherData);
    ui.renderForecast(state.weatherData.daily);
    ui.renderHourly(state.weatherData.hourly);
    ui.renderTemperatureGraph(state.weatherData.hourly);
    
  } catch (err) {
    console.error('Weather error:', err);
    ui.showError(err.message || 'Failed to load weather data. Please try again.');
  } finally {
    state.isLoading = false;
    ui.hideLoading();
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
    // Load unit preference
    const unit = localStorage.getItem('weathernow:unit');
    if (unit && (unit === 'metric' || unit === 'imperial')) {
      state.unit = unit;
      CONFIG.UNITS = unit;
    }
    ui.updateUnitToggle(state.unit);

    // Load theme preference
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
