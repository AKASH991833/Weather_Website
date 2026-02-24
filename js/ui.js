/**
 * WeatherNow - UI Module
 * All Features: Theme, AQI, Graph, Locations
 */

const elements = {};
let tempChart = null;

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
  elements.cityName = document.getElementById('city-name');
  elements.currentDate = document.getElementById('current-date');
  elements.currentTemp = document.getElementById('current-temp');
  elements.weatherIcon = document.getElementById('weather-icon');
  elements.weatherDescription = document.getElementById('weather-description');
  elements.badgeWeather = document.getElementById('badge-weather');
  elements.badgeFeels = document.getElementById('badge-feels');
  elements.humidity = document.getElementById('humidity');
  elements.windSpeed = document.getElementById('wind-speed');
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
}

export function hideLoading() {
  if (elements.loading) {
    elements.loading.classList.add('hidden');
    setTimeout(() => elements.loading.remove(), 300);
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
  if (!elements.aqiSection || !airQuality) {
    if (elements.aqiSection) elements.aqiSection.style.display = 'none';
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

export function showSearchResults(results, query) {
  if (!elements.searchResults || !elements.searchInput) return;
  elements.searchResults.innerHTML = '';

  if (!results || results.length === 0) {
    hideSearchResults();
    return;
  }

  results.forEach(result => {
    const li = document.createElement('li');
    li.setAttribute('data-lat', result.lat);
    li.setAttribute('data-lon', result.lon);
    li.setAttribute('data-name', result.name);

    const displayName = formatLocationName(result);
    li.innerHTML = highlightMatch(displayName, query);

    li.addEventListener('click', () => {
      elements.searchInput.value = displayName;
      hideSearchResults();
      const event = new CustomEvent('locationSelected', {
        detail: { lat: result.lat, lon: result.lon, name: displayName }
      });
      document.dispatchEvent(event);
    });

    elements.searchResults.appendChild(li);
  });

  elements.searchResults.classList.add('active');
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
  const parts = [result.name];
  if (result.state) parts.push(result.state);
  if (result.country) parts.push(result.country);
  return parts.filter(Boolean).join(', ');
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
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
    
    // Handle Enter key - search like Google
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        callbacks.onSearchEnter?.();
      }
      if (e.key === 'Escape') {
        hideSearchResults();
        elements.searchInput.blur();
      }
    });
    
    elements.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideSearchResults();
        elements.searchInput.blur();
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

export function setSearchValue(value) {
  if (elements.searchInput) elements.searchInput.value = value;
}

export function getSearchValue() {
  return elements.searchInput?.value || '';
}

export default {
  initElements,
  hideLoading,
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
  getSearchValue
};
