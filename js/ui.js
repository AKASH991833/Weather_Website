/**
 * WeatherNow - UI Module
 * 
 * Handles all UI updates, rendering, and user interactions.
 * Features: Theme toggling, weather display, forecasts, graphs, and loading states.
 */

import { COUNTRY_NAMES, COUNTRY_FLAGS } from './config.js';

const elements = {};
let tempChart = null;
let focusedResultIndex = -1;

export function initElements() {
  elements.loading = document.getElementById('loading');
  elements.errorToast = document.getElementById('error-toast');
  elements.errorMessage = elements.errorToast?.querySelector('.toast-message');
  elements.errorDismiss = elements.errorToast?.querySelector('.toast-close');
  elements.searchInput = document.getElementById('search-input');
  elements.searchResults = document.getElementById('search-results');
  elements.locationBtn = document.getElementById('location-btn');
  elements.themeToggle = document.getElementById('theme-toggle');
  elements.unitToggle = document.getElementById('unit-toggle');
  elements.locationsBtn = document.getElementById('locations-btn');
  elements.locationsDropdown = document.getElementById('locations-dropdown');
  elements.savedLocationsList = document.getElementById('saved-locations-list');
  elements.savedCount = document.getElementById('saved-count');
  
  // Location Info Card elements
  elements.locationInfoCard = document.getElementById('location-info-card');
  elements.locationCity = document.getElementById('location-city');
  elements.locationState = document.getElementById('location-state');
  elements.locationCountry = document.getElementById('location-country');
  elements.locationPincode = document.getElementById('location-pincode');
  elements.locationCoords = document.getElementById('location-coords');
  elements.locationTimezone = document.getElementById('location-timezone');
  elements.closeLocationCard = document.getElementById('close-location-card');
  
  elements.cityName = document.getElementById('city-name');
  elements.currentDate = document.getElementById('current-date');
  elements.currentTemp = document.getElementById('current-temp');
  elements.weatherIcon = document.getElementById('weather-icon');
  elements.weatherDescription = document.getElementById('weather-description');
  elements.badgeWeather = document.getElementById('badge-weather');
  elements.badgeFeels = document.getElementById('badge-feels');
  elements.humidity = document.getElementById('humidity');
  elements.windSpeed = document.getElementById('wind-speed');
  elements.windDirectionText = document.getElementById('wind-direction-text');
  elements.compassArrow = document.getElementById('compass-arrow');
  elements.feelsLike = document.getElementById('feels-like');
  elements.visibility = document.getElementById('visibility');
  elements.pressure = document.getElementById('pressure');
  elements.uvIndex = document.getElementById('uv-index');
  elements.precipitation = document.getElementById('precipitation');
  elements.dewPoint = document.getElementById('dew-point');
  elements.sunrise = document.getElementById('sunrise');
  elements.sunset = document.getElementById('sunset');
  elements.moonPhase = document.getElementById('moon-phase');
  elements.forecastGrid = document.getElementById('forecast-grid');
  elements.hourlyGrid = document.getElementById('hourly-grid');
  elements.aqiSection = document.getElementById('aqi-section');
  elements.aqiValue = document.getElementById('aqi-value');
  elements.aqiLabel = document.getElementById('aqi-label');
  elements.pm25 = document.getElementById('pm25');
  elements.pm10 = document.getElementById('pm10');
  elements.o3 = document.getElementById('o3');
  elements.no2 = document.getElementById('no2');
  elements.aqiHealth = document.getElementById('aqi-health');
  elements.weatherBg = document.getElementById('weather-bg');
  elements.rainContainer = document.getElementById('rain-container');
  elements.snowContainer = document.getElementById('snow-container');
  elements.sunRays = document.getElementById('sun-rays');
  elements.cloudsContainer = document.getElementById('clouds-container');
  elements.refreshBtn = document.getElementById('refresh-btn');
  elements.exportBtn = document.getElementById('export-btn');
}

export function hideLoading() {
  if (elements.loading) {
    elements.loading.classList.add('hidden');
    setTimeout(() => elements.loading.remove(), 300);
  }
}

export function showLoading(message = 'Loading...') {
  if (!elements.loading) return;
  
  // Show loading screen with custom message
  elements.loading.classList.remove('hidden');
  const loadingText = elements.loading.querySelector('p');
  if (loadingText) {
    loadingText.textContent = message;
  }
}

export function showError(message, duration = 5000) {
  if (!elements.errorToast || !elements.errorMessage) return;
  elements.errorMessage.textContent = message;
  elements.errorToast.classList.add('active');
  if (duration > 0) setTimeout(() => hideError(), duration);
}

export function hideError() {
  if (elements.errorToast) elements.errorToast.classList.remove('active');
}

export function updateCurrentWeather(weather) {
  if (!weather || !weather.current) return;

  const { location, current } = weather;

  if (elements.cityName) {
    elements.cityName.innerHTML = `<span class="pin">📍</span><span class="name-text">${location.name || 'Unknown'}</span>`;
  }
  
  if (elements.currentDate) {
    elements.currentDate.textContent = formatDate(current.timestamp);
  }

  if (elements.currentTemp) {
    elements.currentTemp.textContent = current.temp;
  }

  if (elements.weatherIcon && current.icon) {
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
    elements.weatherIcon.alt = current.description;
  }

  if (elements.weatherDescription) {
    elements.weatherDescription.textContent = current.description;
  }

  if (elements.badgeWeather) elements.badgeWeather.textContent = current.description;
  if (elements.badgeFeels) elements.badgeFeels.textContent = `Feels like ${current.feelsLike}°`;

  if (elements.humidity) elements.humidity.textContent = `${current.humidity}%`;
  if (elements.windSpeed) elements.windSpeed.textContent = `${current.windSpeed} km/h`;
  if (elements.feelsLike) elements.feelsLike.textContent = `${current.feelsLike}°`;
  if (elements.visibility) elements.visibility.textContent = `${current.visibility} km`;
  if (elements.pressure) elements.pressure.textContent = `${current.pressure} hPa`;
  if (elements.uvIndex) elements.uvIndex.textContent = current.uvIndex || '--';
  if (elements.precipitation) elements.precipitation.textContent = `${current.precipitation}%`;
  if (elements.dewPoint) elements.dewPoint.textContent = `${current.dewPoint}°`;

  // Update dynamic background
  updateWeatherBackground(current.iconId, current.description);
}

export function updateWeatherBackground(iconId, description) {
  if (!elements.weatherBg) return;

  // Reset all effects
  elements.weatherBg.className = 'weather-bg';
  elements.rainContainer?.classList.remove('active');
  elements.snowContainer?.classList.remove('active');
  elements.sunRays?.classList.remove('active');

  const desc = description.toLowerCase();

  // Rain
  if (iconId >= 200 && iconId < 600 || desc.includes('rain') || desc.includes('drizzle')) {
    elements.weatherBg.classList.add('rainy');
    elements.rainContainer?.classList.add('active');
    createRain();
  }
  // Snow
  else if (iconId >= 600 && iconId < 700 || desc.includes('snow')) {
    elements.weatherBg.classList.add('snowy');
    elements.snowContainer?.classList.add('active');
    createSnow();
  }
  // Thunderstorm
  else if (iconId >= 200 && iconId < 300 || desc.includes('thunder') || desc.includes('storm')) {
    elements.weatherBg.classList.add('stormy');
  }
  // Clear
  else if (iconId === 800 || desc.includes('clear')) {
    elements.weatherBg.classList.add('sunny');
    elements.sunRays?.classList.add('active');
  }
  // Clouds
  else {
    elements.weatherBg.classList.add('cloudy');
  }
}

function createRain() {
  if (!elements.rainContainer) return;
  elements.rainContainer.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDelay = Math.random() * 2 + 's';
    drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
    elements.rainContainer.appendChild(drop);
  }
}

function createSnow() {
  if (!elements.snowContainer) return;
  elements.snowContainer.innerHTML = '';
  const flakes = ['❄', '❅', '❆', '•'];
  for (let i = 0; i < 40; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
    flake.style.left = Math.random() * 100 + '%';
    flake.style.animationDelay = Math.random() * 5 + 's';
    flake.style.animationDuration = (3 + Math.random() * 5) + 's';
    flake.style.fontSize = (0.5 + Math.random() * 1) + 'em';
    elements.snowContainer.appendChild(flake);
  }
}

export function updateAirQuality(airQuality) {
  if (!elements.aqiSection) return;
  
  // Hide AQI section if no data
  if (!airQuality) {
    elements.aqiSection.style.display = 'none';
    return;
  }

  elements.aqiSection.style.display = 'block';
  elements.aqiSection.className = 'aqi-section';

  const category = getAQICategoryClass(airQuality.aqi);
  elements.aqiSection.classList.add(category.color);

  if (elements.aqiValue) elements.aqiValue.textContent = airQuality.aqi;
  if (elements.aqiLabel) elements.aqiLabel.textContent = category.label;
  if (elements.pm25) elements.pm25.textContent = airQuality.pm25;
  if (elements.pm10) elements.pm10.textContent = airQuality.pm10;
  if (elements.o3) elements.o3.textContent = airQuality.o3;
  if (elements.no2) elements.no2.textContent = airQuality.no2;
  if (elements.aqiHealth) elements.aqiHealth.textContent = category.health;
}

function getAQICategoryClass(aqi) {
  const categories = {
    1: { label: 'Good', color: 'aqi-good', health: 'Air quality is satisfactory. Perfect for outdoor activities!' },
    2: { label: 'Fair', color: 'aqi-moderate', health: 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion.' },
    3: { label: 'Moderate', color: 'aqi-moderate', health: 'Sensitive groups may experience health effects.' },
    4: { label: 'Poor', color: 'aqi-unhealthy', health: 'Everyone may experience health effects. Limit outdoor activities.' },
    5: { label: 'Very Poor', color: 'aqi-unhealthy', health: 'Health alert! Avoid outdoor activities.' }
  };
  return categories[aqi] || categories[1];
}

export function updateSunTimes(weather) {
  if (!weather || !weather.current) return;

  if (elements.sunrise && weather.current.sunrise) {
    elements.sunrise.textContent = formatTime(weather.current.sunrise);
  }
  if (elements.sunset && weather.current.sunset) {
    elements.sunset.textContent = formatTime(weather.current.sunset);
  }
  if (elements.moonPhase) {
    const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                    'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const phaseIndex = Math.round((weather.current.moonPhase || 0) / 8 * 8) % 8;
    elements.moonPhase.textContent = phases[phaseIndex];
  }
}

export function renderForecast(daily) {
  if (!elements.forecastGrid || !daily || daily.length === 0) return;
  elements.forecastGrid.innerHTML = '';

  daily.forEach((day, index) => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <p class="forecast-day">${index === 0 ? 'Today' : formatDay(day.date)}</p>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.icon}.png" alt="">
      <p class="forecast-temp">${day.tempMax}°</p>
      <p class="forecast-temp-low">${day.tempMin}°</p>
    `;
    elements.forecastGrid.appendChild(card);
  });
}

export function renderHourly(hourly) {
  if (!elements.hourlyGrid || !hourly || hourly.length === 0) return;
  elements.hourlyGrid.innerHTML = '';

  hourly.forEach(hour => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    card.innerHTML = `
      <p class="hourly-time">${formatHour(hour.date)}</p>
      <img class="hourly-icon" src="https://openweathermap.org/img/wn/${hour.icon}.png" alt="">
      <p class="hourly-temp">${hour.temp}°</p>
    `;
    elements.hourlyGrid.appendChild(card);
  });
}

export function renderTemperatureGraph(hourly) {
  const ctx = document.getElementById('temp-graph');
  if (!ctx) return;

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Temperature graph will be skipped.');
    ctx.parentElement.innerHTML = '<p class="chart-error">Temperature trend visualization is unavailable offline.</p>';
    return;
  }

  if (tempChart) {
    tempChart.destroy();
  }

  const labels = hourly.map(h => formatHour(h.date));
  const temps = hourly.map(h => h.temp);

  const isDark = document.body.classList.contains('theme-dark');
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature (°)',
        data: temps,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: gridColor },
          ticks: { color: textColor, callback: v => v + '°' }
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        }
      }
    }
  });
}

export function showSearchLoading(isLoading) {
  const loadingEl = document.getElementById('search-loading');
  const searchIcon = document.querySelector('.search-icon');
  
  if (loadingEl) {
    loadingEl.style.display = isLoading ? 'flex' : 'none';
  }
  if (searchIcon) {
    searchIcon.style.opacity = isLoading ? '0' : '0.6';
  }
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.setAttribute('aria-busy', isLoading.toString());
  }
}

export function showSearchResults(results, query) {
  if (!elements.searchResults || !elements.searchInput) return;
  elements.searchResults.innerHTML = '';
  focusedResultIndex = -1; // Reset focus

  if (!results || results.length === 0) {
    // Show "no results" message
    const li = document.createElement('li');
    li.className = 'no-results';
    li.innerHTML = `🔍 No locations found for "<strong>${escapeHtml(query)}</strong>"<br><small>Try checking spelling or search with coordinates</small>`;
    elements.searchResults.appendChild(li);
    elements.searchResults.classList.add('active');
    return;
  }

  // Show results in dropdown
  results.forEach(result => {
    const li = document.createElement('li');
    const displayName = getDisplayNameForResult(result);

    li.setAttribute('role', 'option');
    li.setAttribute('data-lat', result.lat);
    li.setAttribute('data-lon', result.lon);
    li.setAttribute('data-name', result.name);
    li.setAttribute('data-state', result.state || '');
    li.setAttribute('data-country', result.country || '');
    li.setAttribute('data-zip', result.zip || '');
    li.className = 'search-result-item';

    // Create rich result display
    li.innerHTML = createSearchResultHTML(result, query);

    li.addEventListener('click', () => {
      const clickedName = li.getAttribute('data-name');
      const clickedState = li.getAttribute('data-state');
      const clickedCountry = li.getAttribute('data-country');
      const clickedLat = parseFloat(li.getAttribute('data-lat'));
      const clickedLon = parseFloat(li.getAttribute('data-lon'));
      const clickedZip = li.getAttribute('data-zip');

      elements.searchInput.value = getDisplayNameForResult(result);
      hideSearchResults();

      const event = new CustomEvent('locationSelected', {
        detail: { 
          lat: clickedLat, 
          lon: clickedLon, 
          name: clickedName,
          state: clickedState,
          country: clickedCountry,
          zip: clickedZip
        }
      });
      document.dispatchEvent(event);
    });

    elements.searchResults.appendChild(li);
  });

  elements.searchResults.classList.add('active');
}

/**
 * Get display name for search result
 */
function getDisplayNameForResult(result) {
  const parts = [result.name];
  
  if (result.state && result.state.toLowerCase() !== result.name.toLowerCase()) {
    parts.push(result.state);
  }
  
  if (result.country) {
    parts.push(result.country);
  }
  
  return parts.join(', ');
}

/**
 * Create rich HTML for search result
 */
function createSearchResultHTML(result, query) {
  const flag = result.countryFlag || COUNTRY_FLAGS[result.country] || '';
  const countryName = result.countryName || COUNTRY_NAMES[result.country] || result.country || '';

  let html = `<div class="result-content">`;

  // Flag icon
  if (flag) {
    html += `<span class="result-flag">${flag}</span>`;
  } else {
    html += `<span class="result-flag">📍</span>`;
  }

  // Main info
  html += `<div class="result-info">`;
  html += `<div class="result-name">${highlightMatch(result.name, query)}</div>`;

  // Secondary info (state, country)
  const secondaryParts = [];
  if (result.state && result.state.toLowerCase() !== result.name.toLowerCase()) {
    secondaryParts.push(result.state);
  }
  if (countryName) {
    secondaryParts.push(countryName);
  }

  if (secondaryParts.length > 0) {
    html += `<div class="result-secondary">${secondaryParts.join(', ')}</div>`;
  }

  // Coordinates with correct direction indicators
  if (typeof result.lat === 'number' && typeof result.lon === 'number') {
    const latDir = result.lat >= 0 ? 'N' : 'S';
    const lonDir = result.lon >= 0 ? 'E' : 'W';
    html += `<div class="result-coords">${Math.abs(result.lat).toFixed(2)}°${latDir}, ${Math.abs(result.lon).toFixed(2)}°${lonDir}</div>`;
  }

  html += `</div>`; // Close result-info

  // ZIP code if available
  if (result.zip) {
    html += `<span class="result-zip">📮 ${result.zip}</span>`;
  }

  html += `</div>`; // Close result-content

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function hideSearchResults() {
  if (elements.searchResults) {
    elements.searchResults.classList.remove('active');
    elements.searchResults.innerHTML = '';
  }
}

export function updateUnitToggle(unit) {
  if (!elements.unitToggle) return;
  const celsius = elements.unitToggle.querySelector('.unit-c');
  const fahrenheit = elements.unitToggle.querySelector('.unit-f');
  if (unit === 'metric') {
    celsius?.classList.add('active');
    fahrenheit?.classList.remove('active');
  } else {
    celsius?.classList.remove('active');
    fahrenheit?.classList.add('active');
  }
}

export function updateSavedLocations(locations, currentLat, currentLon) {
  if (!elements.savedLocationsList || !elements.savedCount) return;

  elements.savedCount.textContent = locations.length;

  if (locations.length === 0) {
    elements.savedLocationsList.innerHTML = '<li class="empty-locations">No saved locations</li>';
    return;
  }

  elements.savedLocationsList.innerHTML = '';
  locations.forEach(loc => {
    const li = document.createElement('li');
    const isCurrent = loc.lat === currentLat && loc.lon === currentLon;
    li.innerHTML = `
      <span class="location-name">${isCurrent ? '📍 ' : ''}${loc.name}</span>
      <button class="remove-btn" data-lat="${loc.lat}" data-lon="${loc.lon}">×</button>
    `;
    
    li.querySelector('.location-name').addEventListener('click', () => {
      const event = new CustomEvent('locationSelected', {
        detail: { lat: loc.lat, lon: loc.lon, name: loc.name }
      });
      document.dispatchEvent(event);
      elements.locationsDropdown?.classList.remove('active');
    });

    li.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const event = new CustomEvent('removeLocation', {
        detail: { lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) }
      });
      document.dispatchEvent(event);
    });

    elements.savedLocationsList.appendChild(li);
  });
}

export function toggleLocationsDropdown() {
  if (elements.locationsDropdown) {
    elements.locationsDropdown.classList.toggle('active');
  }
}

export function hideLocationsDropdown() {
  if (elements.locationsDropdown) {
    elements.locationsDropdown.classList.remove('active');
  }
}

export function setTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatHour(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric' });
}

export function formatLocationName(result) {
  // Format location name for display with country flag
  if (!result || !result.name) return '';
  
  const parts = [result.name];
  
  if (result.state && result.state.toLowerCase() !== result.name.toLowerCase()) {
    parts.push(result.state);
  }
  
  if (result.country) {
    const flag = COUNTRY_FLAGS[result.country] || '';
    const countryName = COUNTRY_NAMES[result.country] || result.country;
    if (flag) {
      parts.push(`${flag} ${countryName}`);
    } else {
      parts.push(countryName);
    }
  }
  
  return parts.join(', ');
}

function highlightMatch(text, query) {
  if (!query) return text;
  const escapedQuery = escapeRegex(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function setupEventListeners(callbacks) {
  if (elements.errorDismiss) {
    elements.errorDismiss.addEventListener('click', () => hideError());
  }

  if (elements.locationBtn) {
    elements.locationBtn.addEventListener('click', () => callbacks.onLocation?.());
  }

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', () => callbacks.onThemeToggle?.());
  }

  if (elements.unitToggle) {
    elements.unitToggle.addEventListener('click', () => callbacks.onUnitToggle?.());
  }

  if (elements.locationsBtn) {
    elements.locationsBtn.addEventListener('click', () => {
      callbacks.onLocationsToggle?.();
    });
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => callbacks.onSearch?.(e.target.value));

    // Handle Enter, Escape, and Arrow keys
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        callbacks.onSearchEnter?.();
      }
      if (e.key === 'Escape') {
        hideSearchResults();
        elements.searchInput.blur();
      }
      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleSearchResultNavigation(e.key);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!elements.searchInput?.contains(e.target)) hideSearchResults();
    if (!elements.locationsBtn?.contains(e.target) && !elements.locationsDropdown?.contains(e.target)) {
      hideLocationsDropdown();
    }
  });
}

// Track currently focused search result
// focusedResultIndex is already declared at the top of the module

function handleSearchResultNavigation(direction) {
  if (!elements.searchResults) return;
  
  const results = elements.searchResults.querySelectorAll('li.search-result-item');
  if (results.length === 0) return;
  
  if (direction === 'ArrowDown') {
    focusedResultIndex = Math.min(focusedResultIndex + 1, results.length - 1);
  } else if (direction === 'ArrowUp') {
    focusedResultIndex = Math.max(focusedResultIndex - 1, -1);
  }
  
  // Remove focus from all
  results.forEach(r => r.classList.remove('focused'));
  
  // Add focus to current
  if (focusedResultIndex >= 0 && results[focusedResultIndex]) {
    results[focusedResultIndex].classList.add('focused');
    results[focusedResultIndex].scrollIntoView({ block: 'nearest' });
  }
}

// Handle Enter key on focused result
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && focusedResultIndex >= 0) {
    const focused = elements.searchResults?.querySelector('li.focused');
    if (focused) {
      e.preventDefault();
      focused.click();
    }
  }
});

// Reset focus when results change
const originalShowResults = showSearchResults;
// This will be called automatically when showSearchResults is called

export function setSearchValue(value) {
  if (elements.searchInput) elements.searchInput.value = value;
}

export function getSearchValue() {
  return elements.searchInput?.value || '';
}

/**
 * Show Location Info Card with detailed information
 */
export function showLocationInfoCard(location) {
  if (!elements.locationInfoCard) return;

  // Update location details
  if (elements.locationCity) {
    elements.locationCity.textContent = location.name || '--';
  }
  if (elements.locationState) {
    elements.locationState.textContent = location.state || 'Not available';
  }
  if (elements.locationCountry) {
    const flag = COUNTRY_FLAGS[location.country] || '';
    const name = COUNTRY_NAMES[location.country] || location.country || '';
    if (flag && name) {
      elements.locationCountry.textContent = `${flag} ${name}`;
    } else if (name) {
      elements.locationCountry.textContent = name;
    } else {
      elements.locationCountry.textContent = '--';
    }
  }
  if (elements.locationPincode) {
    if (location.zip) {
      elements.locationPincode.textContent = location.zip;
      elements.locationPincode.style.fontStyle = 'normal';
      elements.locationPincode.style.fontSize = '14px';
    } else {
      elements.locationPincode.textContent = 'Search by PIN code for exact value';
      elements.locationPincode.style.fontStyle = 'italic';
      elements.locationPincode.style.fontSize = '12px';
    }
  }
  if (elements.locationCoords) {
    if (typeof location.lat === 'number' && typeof location.lon === 'number') {
      const latDir = location.lat >= 0 ? 'N' : 'S';
      const lonDir = location.lon >= 0 ? 'E' : 'W';
      elements.locationCoords.textContent = `${Math.abs(location.lat).toFixed(4)}°${latDir}, ${Math.abs(location.lon).toFixed(4)}°${lonDir}`;
    } else {
      elements.locationCoords.textContent = 'Not available';
    }
  }
  if (elements.locationTimezone) {
    if (typeof location.lat === 'number' && typeof location.lon === 'number') {
      const offset = location.lon / 15;
      const hours = Math.floor(Math.abs(offset));
      const minutes = Math.round((Math.abs(offset) - hours) * 60);
      const sign = offset >= 0 ? '+' : '-';
      const minutesStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
      elements.locationTimezone.textContent = `UTC${sign}${hours}${minutesStr}`;
    } else {
      elements.locationTimezone.textContent = 'Not available';
    }
  }

  // Show card with animation
  elements.locationInfoCard.style.display = 'block';
  elements.locationInfoCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Hide Location Info Card
 */
export function hideLocationInfoCard() {
  if (elements.locationInfoCard) {
    elements.locationInfoCard.style.display = 'none';
  }
}

/**
 * Setup Location Info Card close button
 */
export function setupLocationInfoCard() {
  if (elements.closeLocationCard) {
    elements.closeLocationCard.addEventListener('click', () => {
      hideLocationInfoCard();
    });
  }
}

export default {
  initElements,
  hideLoading,
  showLoading,
  showError,
  hideError,
  updateCurrentWeather,
  updateWeatherBackground,
  updateAirQuality,
  updateSunTimes,
  renderForecast,
  renderHourly,
  renderTemperatureGraph,
  showSearchResults,
  hideSearchResults,
  showSearchLoading,
  updateUnitToggle,
  updateSavedLocations,
  toggleLocationsDropdown,
  hideLocationsDropdown,
  setTheme,
  formatDate,
  formatTime,
  formatDay,
  formatHour,
  formatLocationName,
  setupEventListeners,
  setSearchValue,
  getSearchValue,
  showLocationInfoCard,
  hideLocationInfoCard,
  setupLocationInfoCard
};
