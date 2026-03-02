/**
 * WeatherNow - Main Application Module
 *
 * Production-ready weather application with worldwide coverage.
 * Features comprehensive error handling, loading states, and modular architecture.
 *
 * Architecture:
 * - config.js: API configuration and constants
 * - location-api.js: Location search and geocoding
 * - weather-api.js: Weather data fetching
 * - location-display.js: Location info card display
 * - ui.js: UI updates and rendering
 * - animations.js: Weather animations
 * - pwa.js: Progressive Web App features
 * - error-boundary.js: Error handling and recovery
 */

import CONFIG from './config.js';
import locationApi, { getTimezoneFromCoords } from './location-api.js';
import weatherApi, { calculateUVIndex, getMoonPhaseName } from './weather-api.js';
import locationDisplay from './location-display.js';
import * as ui from './ui.js';
import weatherAnimations from './animations.js';
import * as pwa from './pwa.js';
import { initErrorBoundary } from './error-boundary.js';
import alertsModule from './alerts.js';
import notificationsModule from './notifications.js';
import advancedFeaturesModule from './advanced-features.js';

// Application state
const state = {
  currentLocation: null,
  weatherData: null,
  unit: 'metric',
  theme: 'light',
  isLoading: false,
  searchTimer: null,
  initialized: false,
  errorCount: 0
};

/**
 * Initialize the application
 */
async function init() {
  try {
    console.log('🌤️ Initializing WeatherNow...');

    // Initialize error boundary first
    initErrorBoundary();
    
    // Initialize weather alerts
    alertsModule.initAlerts();
    
    // Initialize push notifications
    notificationsModule.initNotifications();
    
    // Initialize advanced features
    advancedFeaturesModule.initAdvancedFeatures();

    // Initialize all modules
    ui.initElements();
    locationDisplay.initLocationInfoCard();
    setupEventListeners();

    // Optional modules - don't block if they fail
    try {
      weatherApi.initCacheCleanup();
      locationApi.initCacheCleanup();
      pwa.initPWA();
    } catch (moduleError) {
      console.warn('Optional module error:', moduleError.message);
    }

    // Load saved settings
    loadSettings();
    applyTheme();
    updateThemeDropdown();

    // Load last location or use default
    await loadLocation();

    // Set a failsafe timeout to hide loading screen even if fetch hangs
    const failsafeTimeout = setTimeout(() => {
      if (!state.initialized) {
        console.warn('⚠️ Initialization taking too long, hiding loading screen via failsafe');
        ui.hideLoading();
      }
    }, 10000); // 10 seconds failsafe

    // Fetch weather data
    if (state.currentLocation) {
      await fetchWeather();
    }

    clearTimeout(failsafeTimeout);
    state.initialized = true;
    console.log('✅ WeatherNow initialized successfully');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    // Don't block UI - show error but let user interact
    state.initialized = true;
    ui.showError('Application failed to initialize. Some features may be limited.');
  } finally {
    // Ensure loading screen is hidden regardless of success or failure
    ui.hideLoading();
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    searchInput.addEventListener('focus', handleSearchFocus);
  }

  // Location button (GPS)
  const locationBtn = document.getElementById('location-btn');
  if (locationBtn) {
    locationBtn.addEventListener('click', getUserLocation);
  }

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Theme dropdown options
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const themeName = e.currentTarget.dataset.theme;
      if (themeName) {
        setTheme(themeName);
      }
    });
  });

  // Toggle theme dropdown
  themeToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const themeDropdown = document.getElementById('theme-dropdown');
    if (themeDropdown) {
      themeDropdown.classList.toggle('active');
    }
  });

  // Unit toggle (°C / °F)
  const unitToggle = document.getElementById('unit-toggle');
  if (unitToggle) {
    unitToggle.addEventListener('click', toggleUnit);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshWeather);
  }

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportPanel);
  }

  // Close location card
  const closeLocationCard = document.getElementById('close-location-card');
  if (closeLocationCard) {
    closeLocationCard.addEventListener('click', () => {
      locationDisplay.hideLocationInfoCard();
    });
  }

  // Handle location selection from search results
  document.addEventListener('locationSelected', handleLocationSelected);

  // Handle location removal
  document.addEventListener('removeLocation', handleRemoveLocation);

  // Click outside to close dropdowns
  document.addEventListener('click', handleOutsideClick);

  // Popular city clicks
  document.querySelectorAll('.popular-city').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const city = e.target.dataset.city;
      if (city) {
        searchInput.value = city;
        performSearch(city);
      }
    });
  });
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
    ui.showSearchLoading(false);
    return;
  }

  // Debounce search (wait 300ms after typing stops)
  state.searchTimer = setTimeout(async () => {
    await performSearch(query);
  }, CONFIG.DEBOUNCE_DELAY);
}

/**
 * Handle search keyboard events
 */
function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    // Search for exact query on Enter
    const query = e.target.value.trim();
    if (query.length >= 2) {
      performExactSearch(query);
    }
  } else if (e.key === 'Escape') {
    ui.hideSearchResults();
    e.target.blur();
  }
}

/**
 * Show popular searches on focus
 */
function handleSearchFocus() {
  const popularSearches = document.getElementById('popular-searches');
  const searchResults = document.getElementById('search-results');
  
  if (popularSearches && searchResults && !searchResults.classList.contains('active')) {
    popularSearches.style.display = 'block';
  }
}

/**
 * Perform location search
 */
async function performSearch(query) {
  try {
    ui.showSearchLoading(true);
    
    const results = await locationApi.searchLocations(query);
    
    ui.showSearchLoading(false);
    ui.showSearchResults(results, query);
    
    // Hide popular searches when results shown
    const popularSearches = document.getElementById('popular-searches');
    if (popularSearches) {
      popularSearches.style.display = 'none';
    }
  } catch (error) {
    ui.showSearchLoading(false);
    console.error('Search error:', error);
    ui.hideSearchResults();

    // Show user-friendly error message
    let errorMessage = 'Unable to search. ';
    if (error.message.includes('rate limit')) {
      errorMessage += 'Too many requests. Please wait a moment.';
    } else if (error.message.includes('API key')) {
      errorMessage += 'Configuration error. Please contact support.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again.';
    } else {
      errorMessage += 'Please check your connection and try again.';
    }
    ui.showError(errorMessage);
  }
}

/**
 * Select first search result on Enter
 */
function selectFirstSearchResult() {
  const firstResult = document.querySelector('.search-result-item');
  if (firstResult) {
    firstResult.click();
  } else {
    // If no results, try searching with current input
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim().length >= 2) {
      performSearch(searchInput.value.trim());
    }
  }
}

/**
 * Perform exact search - search for exactly what user typed
 */
async function performExactSearch(query) {
  try {
    ui.showSearchLoading(true);
    ui.hideSearchResults();

    console.log('🔍 Exact search for:', query);

    // Search for the exact query with higher limit to find best match
    const results = await locationApi.searchLocations(query);

    ui.showSearchLoading(false);

    if (results && results.length > 0) {
      // Find the best match (exact or closest to query)
      const bestMatch = findBestMatch(results, query);
      
      console.log('✅ Best match:', bestMatch.name, 'from', results.length, 'results');
      
      // Update search input with the result
      ui.setSearchValue(ui.formatLocationName(bestMatch));
      
      // Trigger location selection
      const event = new CustomEvent('locationSelected', {
        detail: {
          lat: bestMatch.lat,
          lon: bestMatch.lon,
          name: bestMatch.name,
          state: bestMatch.state || '',
          country: bestMatch.country || '',
          zip: bestMatch.zip || ''
        }
      });
      document.dispatchEvent(event);
    } else {
      // No results found
      ui.showError(`No location found for "${query}". Please try a different name.`);
    }
  } catch (error) {
    ui.showSearchLoading(false);
    console.error('Exact search error:', error);
    ui.showError('Unable to search. Please try again.');
  }
}

/**
 * Find best match from search results
 * Prioritizes exact matches and close matches
 */
function findBestMatch(results, query) {
  const normalizedQuery = query.toLowerCase().trim();
  
  // First priority: Exact match in name
  const exactMatch = results.find(result => 
    result.name.toLowerCase() === normalizedQuery
  );
  if (exactMatch) {
    console.log('🎯 Found exact name match:', exactMatch.name);
    return exactMatch;
  }
  
  // Second priority: Name starts with query
  const startsWithMatch = results.find(result => 
    result.name.toLowerCase().startsWith(normalizedQuery)
  );
  if (startsWithMatch) {
    console.log('🎯 Found starts-with match:', startsWithMatch.name);
    return startsWithMatch;
  }
  
  // Third priority: Name contains query
  const containsMatch = results.find(result => 
    result.name.toLowerCase().includes(normalizedQuery)
  );
  if (containsMatch) {
    console.log('🎯 Found contains match:', containsMatch.name);
    return containsMatch;
  }
  
  // Fourth priority: State contains query
  const stateMatch = results.find(result => 
    result.state && result.state.toLowerCase().includes(normalizedQuery)
  );
  if (stateMatch) {
    console.log('🎯 Found state match:', stateMatch.name);
    return stateMatch;
  }
  
  // Last resort: First result
  console.log('⚠️ Using first result:', results[0].name);
  return results[0];
}

/**
 * Handle location selection from search results
 */
async function handleLocationSelected(e) {
  const { lat, lon, name, state: stateName, country, zip } = e.detail;

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
    country: country || '',
    zip: zip || ''
  };

  // Update search input with formatted location name
  ui.setSearchValue(ui.formatLocationName(state.currentLocation));
  ui.hideSearchResults();

  // Hide popular searches
  const popularSearches = document.getElementById('popular-searches');
  if (popularSearches) {
    popularSearches.style.display = 'none';
  }

  // Show location info card
  locationDisplay.showLocationInfo(state.currentLocation);

  // Fetch weather data
  await fetchWeather();

  // Save location for next session
  saveLocation(state.currentLocation);
}

/**
 * Get user's current location using GPS
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
    ui.showLoading('Finding location name...');
    const results = await locationApi.searchLocations(`${latitude}, ${longitude}`);
    const location = results[0] || {
      lat: latitude,
      lon: longitude,
      name: 'Current Location',
      state: '',
      country: '',
      zip: ''
    };

    state.currentLocation = location;
    ui.setSearchValue(ui.formatLocationName(location));
    locationDisplay.showLocationInfo(location);
    await fetchWeather();

  } catch (error) {
    console.error('Location error:', error);
    let errorMessage = 'Unable to get your location. ';

    if (error.message.includes('Permission denied')) {
      errorMessage += 'Please enable location permissions in your browser.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Location request timed out. Please try again.';
    } else {
      errorMessage += error.message;
    }

    ui.showError(errorMessage);
  } finally {
    ui.hideLoading();
  }
}

/**
 * Fetch all weather data (current, forecast, air quality)
 */
async function fetchWeather() {
  if (!state.currentLocation || state.isLoading) {
    console.log('⏭️ Skipping fetch: No location or already loading');
    return;
  }

  try {
    state.isLoading = true;
    ui.showLoading('Loading weather...');

    const { lat, lon } = state.currentLocation;

    // Fetch all data in parallel for better performance
    const [weatherData, forecastData, airQuality, alertsData] = await Promise.allSettled([
      weatherApi.getCurrentWeather(lat, lon, state.unit),
      weatherApi.getForecast(lat, lon, state.unit),
      weatherApi.getAirQuality(lat, lon),
      alertsModule.checkForAlerts(lat, lon)
    ]);

    // Process results
    const current = weatherData.status === 'fulfilled' ? weatherData.value : null;
    const forecast = forecastData.status === 'fulfilled' ? forecastData.value : null;
    const aqi = airQuality.status === 'fulfilled' ? airQuality.value : null;
    const alerts = alertsData.status === 'fulfilled' ? alertsData.value : null;

    // Log any errors
    if (weatherData.status === 'rejected') {
      console.error('Current weather failed:', weatherData.reason);
    }
    if (forecastData.status === 'rejected') {
      console.error('Forecast failed:', forecastData.reason);
    }
    if (airQuality.status === 'rejected') {
      console.warn('Air quality failed:', airQuality.reason);
    }

    if (!current) {
      throw new Error('Failed to fetch current weather data');
    }

    // Combine all data
    state.weatherData = {
      ...current,
      ...forecast,
      airQuality: aqi
    };

    // Calculate UV index
    state.weatherData.current.uvIndex = calculateUVIndex(state.weatherData);

    // Update all UI components
    ui.updateCurrentWeather(state.weatherData);
    ui.updateAirQuality(aqi);
    ui.updateSunTimes(state.weatherData);
    
    if (forecast) {
      ui.renderForecast(forecast.daily);
      ui.renderHourly(forecast.hourly);
      ui.renderTemperatureGraph(forecast.hourly);
    }

    // Update location card with weather data
    locationDisplay.showLocationInfo(state.currentLocation, state.weatherData);

    // Initialize weather animations
    weatherAnimations.init(state.weatherData);

    // Update last updated time
    updateLastUpdated();

    console.log('✅ Weather data loaded successfully');
  } catch (error) {
    console.error('Weather fetch error:', error);

    let errorMessage = 'Failed to load weather. ';
    if (error.message.includes('API key')) {
      errorMessage += 'Invalid API configuration.';
    } else if (error.message.includes('rate limit')) {
      errorMessage += 'Too many requests. Please wait.';
    } else if (error.message.includes('Network') || error.message.includes('network')) {
      errorMessage += 'Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again.';
    } else {
      errorMessage += error.message || 'Please try again.';
    }

    ui.showError(errorMessage);
  } finally {
    state.isLoading = false;
    ui.hideLoading();
  }
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated() {
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    lastUpdated.textContent = `Last updated: ${timeStr}`;
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
    // Clear cache and fetch fresh data
    weatherApi.clearCache();
    locationApi.clearCache();
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
 * Toggle theme (light/dark)
 */
function toggleTheme() {
  // Cycle through themes: light -> dark -> sunset -> ocean -> forest -> midnight -> light
  const themes = ['light', 'dark', 'sunset', 'ocean', 'forest', 'midnight'];
  const currentIndex = themes.indexOf(state.theme);
  const nextIndex = (currentIndex + 1) % themes.length;
  state.theme = themes[nextIndex];
  localStorage.setItem('weathernow:theme', state.theme);
  applyTheme();
  updateThemeDropdown();
}

/**
 * Apply theme to document
 */
function applyTheme() {
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-sunset', 'theme-ocean', 'theme-forest', 'theme-midnight');
  document.body.classList.add(`theme-${state.theme}`);
}

/**
 * Update theme dropdown active state
 */
function updateThemeDropdown() {
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
    if (option.dataset.theme === state.theme) {
      option.classList.add('active');
    }
  });
}

/**
 * Set specific theme
 */
function setTheme(themeName) {
  state.theme = themeName;
  localStorage.setItem('weathernow:theme', state.theme);
  applyTheme();
  updateThemeDropdown();
}

/**
 * Toggle temperature unit (°C / °F)
 */
function toggleUnit() {
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('weathernow:unit', state.unit);
  ui.updateUnitToggle(state.unit);
  
  // Clear cache and refetch with new unit
  weatherApi.clearCache();
  fetchWeather();
}

/**
 * Load saved location from localStorage
 * Priority: 1. GPS Location, 2. Saved Location, 3. Default Location
 */
async function loadLocation() {
  try {
    // First, try to get user's current GPS location
    if (navigator.geolocation) {
      console.log('📍 Attempting to get GPS location...');
      
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, // Faster
            timeout: 5000, // Quick timeout
            maximumAge: 300000 // Accept 5 min old location
          });
        });

        const { latitude, longitude } = position.coords;
        console.log('✅ GPS location found:', latitude, longitude);

        // Reverse geocode to get location name
        ui.showLoading('Detecting your location...');
        const results = await locationApi.searchLocations(`${latitude}, ${longitude}`);
        const location = results[0] || {
          lat: latitude,
          lon: longitude,
          name: 'Your Location',
          state: '',
          country: '',
          zip: ''
        };

        state.currentLocation = location;
        ui.setSearchValue(ui.formatLocationName(location));
        locationDisplay.showLocationInfo(location);
        
        console.log('📍 Auto-detected your location:', location.name);
        return; // Exit early - we got GPS location
      } catch (gpsError) {
        console.log('⚠️ GPS not available or denied:', gpsError.message);
        // Continue to saved location
      }
    }

    // If GPS failed, try saved location
    const saved = localStorage.getItem('weathernow:lastLocation');
    if (saved) {
      state.currentLocation = JSON.parse(saved);
      ui.setSearchValue(ui.formatLocationName(state.currentLocation));
      console.log('📍 Loaded saved location:', state.currentLocation.name);
    } else {
      // Use default location from config
      state.currentLocation = {
        lat: CONFIG.DEFAULT_LAT,
        lon: CONFIG.DEFAULT_LON,
        name: CONFIG.DEFAULT_CITY,
        state: '',
        country: 'GB',
        zip: ''
      };
      console.log('📍 Using default location:', state.currentLocation.name);
    }
  } catch (error) {
    console.warn('Load location error:', error);
    // Use default on error
    state.currentLocation = {
      lat: CONFIG.DEFAULT_LAT,
      lon: CONFIG.DEFAULT_LON,
      name: CONFIG.DEFAULT_CITY,
      state: '',
      country: 'GB',
      zip: ''
    };
  }
}

/**
 * Save location to localStorage
 */
function saveLocation(location) {
  try {
    localStorage.setItem('weathernow:lastLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Save location error:', error);
  }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  try {
    // Load unit preference
    const unit = localStorage.getItem('weathernow:unit');
    if (unit && (unit === 'metric' || unit === 'imperial')) {
      state.unit = unit;
      ui.updateUnitToggle(unit);
    }

    // Load theme preference
    const theme = localStorage.getItem('weathernow:theme');
    if (theme) {
      state.theme = theme;
    }
  } catch (error) {
    console.warn('Load settings error:', error);
  }
}

/**
 * Handle clicks outside dropdowns
 */
function handleOutsideClick(e) {
  const searchContainer = document.querySelector('.search-container');
  const searchResults = document.getElementById('search-results');
  const popularSearches = document.getElementById('popular-searches');
  const themeSwitcher = document.querySelector('.theme-switcher-wrapper');
  const themeDropdown = document.getElementById('theme-dropdown');

  // Close search results
  if (searchContainer && !searchContainer.contains(e.target)) {
    ui.hideSearchResults();
    if (popularSearches && !searchResults?.classList.contains('active')) {
      popularSearches.style.display = 'none';
    }
  }

  // Close theme dropdown
  if (themeSwitcher && !themeSwitcher.contains(e.target)) {
    if (themeDropdown) {
      themeDropdown.classList.remove('active');
    }
  }
}

/**
 * Handle location removal
 */
function handleRemoveLocation(e) {
  const { lat, lon } = e.detail;
  console.log('Remove location:', lat, lon);
  // Implement saved locations removal logic here if needed
}

/**
 * Show export panel
 */
function showExportPanel() {
  const exportPanel = document.getElementById('export-panel');
  if (exportPanel) {
    exportPanel.classList.remove('hidden');
  }
}

// Make export functions globally available
window.closeExportPanel = function() {
  const exportPanel = document.getElementById('export-panel');
  if (exportPanel) {
    exportPanel.classList.add('hidden');
  }
};

window.printWeather = function() {
  window.print();
};

window.exportAsImage = async function() {
  try {
    const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.min.js');
    const appElement = document.querySelector('.app');
    if (appElement) {
      const canvas = await html2canvas(appElement);
      const link = document.createElement('a');
      link.download = `weather-${state.currentLocation?.name || 'unknown'}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  } catch (error) {
    console.error('Export error:', error);
    ui.showError('Failed to export image');
  }
};

window.shareWeather = async function() {
  if (navigator.share && state.weatherData) {
    try {
      await navigator.share({
        title: `Weather in ${state.currentLocation?.name}`,
        text: `Current temperature: ${state.weatherData.current.temp}°${state.unit === 'metric' ? 'C' : 'F'}, ${state.weatherData.current.description}`,
        url: window.location.href
      });
    } catch (error) {
      console.log('Share cancelled');
    }
  } else {
    ui.showError('Sharing not supported');
  }
};

window.closeComparison = function() {
  const comparisonView = document.getElementById('comparison-view');
  if (comparisonView) {
    comparisonView.classList.add('hidden');
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
export { state, init, fetchWeather, performSearch };
export default { init, fetchWeather, performSearch };
