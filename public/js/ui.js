/**
 * WeatherNow - UI Module v4.0
 * Enhanced UI rendering with proper data binding and animations
 */

import { formatTimestamp, capitalizeFirst } from "./utils.js";

const ICON_BASE_URL = "https://openweathermap.org/img/wn";
const AQI_INFO = [
  {
    label: "Good",
    color: "#10b981",
    tip: "Air quality is satisfactory. Enjoy outdoor activities!",
  },
  {
    label: "Fair",
    color: "#84cc16",
    tip: "Air quality is acceptable for most people.",
  },
  {
    label: "Moderate",
    color: "#f59e0b",
    tip: "Sensitive individuals should limit prolonged outdoor exposure.",
  },
  {
    label: "Poor",
    color: "#f97316",
    tip: "Everyone may experience health effects. Limit outdoor activities.",
  },
  {
    label: "Very Poor",
    color: "#ef4444",
    tip: "Health alert! Everyone should avoid outdoor exertion.",
  },
];

let map = null;
let weatherChart = null;
let mapInitialized = false;

export const elements = {
  // Search & Input
  cityInput: null,
  searchBtn: null,
  voiceSearchBtn: null,
  locationBtn: null,
  favoriteBtn: null,
  themeToggle: null,

  // Status & Loading
  loading: null,
  loadingMessage: null,
  errorMessage: null,
  errorText: null,
  errorDismiss: null,
  errorRetry: null,

  // Weather Display
  weatherDisplay: null,
  cityName: null,
  currentDate: null,
  temperature: null,
  currentUnitLabel: null,
  weatherIcon: null,
  weatherDescription: null,
  weatherHighLow: null,
  feelsLikeBadge: null,
  humidityBadge: null,

  // Details
  windSpeed: null,
  visibility: null,
  pressure: null,
  sunrise: null,
  sunset: null,
  timezone: null,

  // Forecasts
  hourlyContainer: null,
  dailyContainer: null,

  // AQI
  aqiValue: null,
  aqiLabel: null,
  aqiHealthTip: null,

  // Status
  apiStatus: null,
  apiStatusWrapper: null,
  lastUpdated: null,

  // Favorites
  favoritesContainer: null,
  favoritesSection: null,
  autocompleteResults: null,

  // Units
  unitC: null,
  unitF: null,

  // Chart
  chartCanvas: null,
};

/**
 * Initialize all DOM element references
 */
export function initializeElements() {
  elements.cityInput = document.getElementById("city-input");
  elements.searchBtn = document.getElementById("search-btn");
  elements.voiceSearchBtn = document.getElementById("voice-search-btn");
  elements.locationBtn = document.getElementById("location-btn");
  elements.favoriteBtn = document.getElementById("favorite-btn");
  elements.themeToggle = document.getElementById("theme-toggle");

  elements.loading = document.getElementById("loading");
  elements.loadingMessage = document.getElementById("loading-message");
  elements.errorMessage = document.getElementById("error-message");
  elements.errorText = document.getElementById("error-text");
  elements.errorDismiss = document.getElementById("error-dismiss");
  elements.errorRetry = document.getElementById("error-retry");

  elements.weatherDisplay = document.getElementById("weather-display");
  elements.cityName = document.getElementById("city-name");
  elements.currentDate = document.getElementById("current-date");
  elements.temperature = document.getElementById("temperature");
  elements.currentUnitLabel = document.getElementById("current-unit");
  elements.weatherIcon = document.getElementById("weather-icon");
  elements.weatherDescription = document.getElementById("weather-description");
  elements.weatherHighLow = document.getElementById("weather-high-low");
  elements.feelsLikeBadge = document.getElementById("feels-like-badge");
  elements.humidityBadge = document.getElementById("humidity-badge");

  elements.windSpeed = document.getElementById("wind-speed");
  elements.visibility = document.getElementById("visibility");
  elements.pressure = document.getElementById("pressure");
  elements.sunrise = document.getElementById("sunrise");
  elements.sunset = document.getElementById("sunset");
  elements.timezone = document.getElementById("timezone");

  elements.hourlyContainer = document.getElementById("hourly-container");
  elements.dailyContainer = document.getElementById("daily-container");

  elements.aqiValue = document.getElementById("aqi-value");
  elements.aqiLabel = document.getElementById("aqi-label");
  elements.aqiHealthTip = document.getElementById("aqi-health-tip");

  elements.apiStatus = document.getElementById("api-status");
  elements.apiStatusWrapper = document.getElementById("api-status-wrapper");
  elements.lastUpdated = document.getElementById("last-updated");

  elements.favoritesContainer = document.getElementById("favorites-container");
  elements.favoritesSection = document.getElementById("favorites-section");
  elements.autocompleteResults = document.getElementById(
    "autocomplete-results",
  );

  elements.unitC = document.getElementById("unit-c");
  elements.unitF = document.getElementById("unit-f");

  elements.chartCanvas = document.getElementById("weather-chart");
}

/**
 * Show loading state with optional message
 */
export function showLoading(message = "Fetching weather data...") {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message;
  }
  elements.loading.classList.remove("hidden");
  if (elements.weatherDisplay) {
    elements.weatherDisplay.classList.add("hidden");
  }
  if (elements.errorMessage) {
    elements.errorMessage.classList.add("hidden");
  }
}

/**
 * Hide loading state
 */
export function hideLoading() {
  if (elements.loading) {
    elements.loading.classList.add("hidden");
  }
}

/**
 * Show error message with optional retry button
 */
let retryCallback = null;
let errorDismissTimeout = null;

export function showError(msg, onRetry = null) {
  // Clear any existing dismiss timeout
  if (errorDismissTimeout) clearTimeout(errorDismissTimeout);

  hideLoading();
  if (elements.errorText) {
    elements.errorText.textContent = msg;
  }
  if (elements.errorMessage) {
    elements.errorMessage.classList.remove("hidden");
  }

  // Setup retry button
  retryCallback = onRetry;
  if (elements.errorRetry) {
    if (onRetry) {
      elements.errorRetry.style.display = "flex";
      elements.errorRetry.onclick = () => {
        hideError();
        if (retryCallback) retryCallback();
      };
    } else {
      elements.errorRetry.style.display = "none";
    }
  }

  // Auto-dismiss after 15 seconds if no retry (increased from 8s)
  if (!onRetry) {
    errorDismissTimeout = setTimeout(() => {
      hideError();
      errorDismissTimeout = null;
    }, 15000);
  }
}

/**
 * Hide error message
 */
export function hideError() {
  // Clear dismiss timeout
  if (errorDismissTimeout) clearTimeout(errorDismissTimeout);
  errorDismissTimeout = null;

  if (elements.errorMessage) {
    elements.errorMessage.classList.add("hidden");
  }
  retryCallback = null;
}

/**
 * Display weather data on the UI
 */
export function displayWeather(weather, forecast, cityName, units) {
  if (!weather || !forecast) {
    showError("Invalid weather data received");
    return;
  }

  // Show/hide fallback warning
  const fallbackWarning = document.getElementById("fallback-warning");
  if (fallbackWarning) {
    if (weather._isFallback || forecast._isFallback) {
      fallbackWarning.classList.remove("hidden");
    } else {
      fallbackWarning.classList.add("hidden");
    }
  }

  // Update location and date
  if (elements.cityName) {
    elements.cityName.textContent = cityName;
  }
  if (elements.currentDate) {
    elements.currentDate.textContent = formatTimestamp(weather.dt, 0, "full");
  }

  // Update temperature
  if (
    elements.temperature &&
    weather.main &&
    typeof weather.main.temp === "number"
  ) {
    elements.temperature.textContent = Math.round(weather.main.temp);
  }

  // Update unit label
  if (elements.currentUnitLabel) {
    elements.currentUnitLabel.textContent = units === "metric" ? "°C" : "°F";
  }

  // Update weather icon and description
  if (weather.weather && weather.weather[0]) {
    const iconCode = weather.weather[0].icon;
    if (elements.weatherIcon) {
      elements.weatherIcon.src = `${ICON_BASE_URL}/${iconCode}@4x.png`;
      elements.weatherIcon.alt = weather.weather[0].description;
    }
    if (elements.weatherDescription) {
      elements.weatherDescription.textContent = capitalizeFirst(
        weather.weather[0].description,
      );
    }
  }

  // Update dynamic background based on weather
  if (weather.weather && weather.weather[0]) {
    updateDynamicBg(weather.weather[0].icon);
  }

  // Update high/low temperatures from forecast
  if (forecast.list && forecast.list.length > 0) {
    const todayForecast = forecast.list.slice(0, 8);
    const max = Math.max(...todayForecast.map((i) => i.main.temp_max));
    const min = Math.min(...todayForecast.map((i) => i.main.temp_min));
    if (elements.weatherHighLow) {
      elements.weatherHighLow.textContent = `H: ${Math.round(max)}° L: ${Math.round(min)}°`;
    }
  }

  // Update badges
  if (
    elements.feelsLikeBadge &&
    weather.main &&
    typeof weather.main.feels_like === "number"
  ) {
    elements.feelsLikeBadge.textContent = `Feels like: ${Math.round(weather.main.feels_like)}°`;
  }
  if (
    elements.humidityBadge &&
    weather.main &&
    typeof weather.main.humidity === "number"
  ) {
    elements.humidityBadge.textContent = `Humidity: ${weather.main.humidity}%`;
  }

  // Update details grid
  updateWeatherDetails(weather, units);

  // Render forecasts
  if (forecast.list) {
    renderHourly(forecast.list);
    renderDaily(forecast.list);
    renderChart(forecast.list, units);
  }

  // Update map
  if (weather.coord) {
    updateMap(weather.coord.lat, weather.coord.lon, cityName);
  }

  // Show weather display
  if (elements.weatherDisplay) {
    elements.weatherDisplay.classList.remove("hidden");
  }

  // Update last updated timestamp
  if (elements.lastUpdated) {
    elements.lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
  }

  // Hide loading state
  hideLoading();
}

/**
 * Update weather details grid
 */
function updateWeatherDetails(weather, units) {
  // Wind Speed
  // NOTE: OWM API returns m/s in metric, mph in imperial — do NOT double-convert
  if (elements.windSpeed && weather.wind) {
    const speed = weather.wind.speed;
    if (units === "metric") {
      // m/s → km/h
      elements.windSpeed.textContent = `${(speed * 3.6).toFixed(1)} km/h`;
    } else {
      // Already in mph for imperial units
      elements.windSpeed.textContent = `${speed.toFixed(1)} mph`;
    }
  }

  // Visibility — OWM always returns in meters, convert appropriately
  if (elements.visibility && typeof weather.visibility === "number") {
    if (units === "imperial") {
      elements.visibility.textContent = `${(weather.visibility / 1609.34).toFixed(1)} mi`;
    } else {
      elements.visibility.textContent = `${(weather.visibility / 1000).toFixed(1)} km`;
    }
  }

  // Pressure
  if (elements.pressure && weather.main && weather.main.pressure) {
    elements.pressure.textContent = `${weather.main.pressure} hPa`;
  }

  // Sunrise
  if (elements.sunrise && weather.sys && weather.sys.sunrise) {
    elements.sunrise.textContent = formatTimestamp(
      weather.sys.sunrise,
      0,
      "time",
    );
  }

  // Sunset
  if (elements.sunset && weather.sys && weather.sys.sunset) {
    elements.sunset.textContent = formatTimestamp(
      weather.sys.sunset,
      0,
      "time",
    );
  }

  // Timezone
  if (elements.timezone && typeof weather.timezone === "number") {
    const totalMinutes = Math.round(weather.timezone / 60);
    const sign = totalMinutes >= 0 ? "+" : "-";
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    elements.timezone.textContent =
      minutes > 0
        ? `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`
        : `UTC${sign}${hours}`;
  }
}

/**
 * Update dynamic background based on weather icon
 */
function updateDynamicBg(icon) {
  const body = document.body;
  body.className = "";

  if (icon.includes("01") || icon.includes("02")) {
    body.classList.add("weather-clear");
  } else if (icon.match(/03|04/)) {
    body.classList.add("weather-clouds");
  } else if (icon.match(/09|10|11/)) {
    body.classList.add("weather-rain");
  } else if (icon.includes("13")) {
    body.classList.add("weather-snow");
  } else if (icon.includes("50") || icon.match(/2[0-9]/)) {
    body.classList.add("weather-thunder");
  }
}

/**
 * Render hourly forecast cards
 */
function renderHourly(list) {
  if (!elements.hourlyContainer || !list || list.length === 0) return;

  elements.hourlyContainer.innerHTML = "";

  const hourlyData = list.slice(0, 24);

  hourlyData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "hourly-item";

    const time = formatTimestamp(item.dt, 0, "hour");
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;

    div.innerHTML = `
      <div class="time">${time}</div>
      <img src="${ICON_BASE_URL}/${iconCode}.png" alt="${item.weather[0].description}" width="40" height="40">
      <div class="temp">${temp}°</div>
    `;

    elements.hourlyContainer.appendChild(div);
  });
}

/**
 * Render daily forecast cards
 */
function renderDaily(list) {
  if (!elements.dailyContainer || !list || list.length === 0) return;

  elements.dailyContainer.innerHTML = "";

  // Group by day
  const days = {};
  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayKey = `${date.getUTCMonth()}-${date.getUTCDate()}`;
    if (!days[dayKey]) {
      days[dayKey] = {
        ...item,
        temps: [item.main.temp],
        date: date,
      };
    } else {
      days[dayKey].temps.push(item.main.temp);
    }
  });

  // Convert to array and get next 5 days (skip today)
  const dailyForecast = Object.values(days).slice(1, 6);

  dailyForecast.forEach((day) => {
    const div = document.createElement("div");
    div.className = "daily-item";

    const dayName = formatTimestamp(day.dt, 0, "day");
    const avgTemp = Math.round(
      day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
    );
    const iconCode = day.weather[0].icon;
    const description = day.weather[0].main;

    div.innerHTML = `
      <span class="day">${dayName}</span>
      <div class="weather-info">
        <img src="${ICON_BASE_URL}/${iconCode}.png" alt="${description}" width="35" height="35">
        <span class="condition">${description}</span>
      </div>
      <span class="temp">${avgTemp}°</span>
    `;

    elements.dailyContainer.appendChild(div);
  });
}

/**
 * Render temperature trend chart
 */
export function renderChart(list, units) {
  if (!elements.chartCanvas || !list || list.length === 0) return;

  const ctx = elements.chartCanvas.getContext("2d");
  const hourly = list.slice(0, 24);
  const labels = hourly.map((i) => formatTimestamp(i.dt, 0, "hour"));
  const temps = hourly.map((i) => Math.round(i.main.temp));

  // Destroy existing chart
  if (weatherChart) {
    weatherChart.destroy();
  }

  // Determine colors based on theme
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const textColor = isDark ? "#f8fafc" : "#1e293b";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  weatherChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Temperature",
          data: temps,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#6366f1",
          pointBorderColor: "#fff",
          pointBorderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark
            ? "rgba(30, 41, 59, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `Temperature: ${context.parsed.y}°${units === "metric" ? "C" : "F"}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: textColor,
            callback: function (value) {
              return value + "°";
            },
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
        },
      },
    },
  });
}

/**
 * Update chart colors when theme changes - optimized
 */
export function updateChartTheme(units) {
  if (weatherChart && elements.chartCanvas) {
    // Update chart colors without full re-render
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#f8fafc" : "#1e293b";
    const gridColor = isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";

    weatherChart.options.scales.y.ticks.color = textColor;
    weatherChart.options.scales.x.ticks.color = textColor;
    weatherChart.options.scales.y.grid.color = gridColor;
    weatherChart.options.scales.x.grid.color = gridColor;
    weatherChart.options.plugins.tooltip.backgroundColor = isDark
      ? "rgba(30, 41, 59, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
    weatherChart.options.plugins.tooltip.titleColor = textColor;
    weatherChart.options.plugins.tooltip.bodyColor = textColor;
    weatherChart.options.plugins.tooltip.borderColor = gridColor;

    weatherChart.update("none"); // Update without animation for faster response
  }
}

/**
 * Display Air Quality Index
 */
export function displayAQI(data) {
  if (!data || !data.list || data.list.length === 0) {
    // Hide or show "not available" message
    if (elements.aqiValue) elements.aqiValue.textContent = "--";
    if (elements.aqiLabel) elements.aqiLabel.textContent = "N/A";
    if (elements.aqiHealthTip)
      elements.aqiHealthTip.textContent =
        "Air quality data not available for this location";
    return;
  }

  const aqi = data.list[0];
  const aqiValue = aqi.main.aqi;
  const info = AQI_INFO[aqiValue - 1] || AQI_INFO[0];

  if (elements.aqiValue) {
    elements.aqiValue.textContent = aqiValue;
    elements.aqiValue.style.backgroundColor = info.color;
  }

  if (elements.aqiLabel) {
    elements.aqiLabel.textContent = info.label;
    elements.aqiLabel.style.color = info.color;
  }

  if (elements.aqiHealthTip) {
    elements.aqiHealthTip.textContent = info.tip;
  }
}

/**
 * Initialize and update weather map
 */
export function updateMap(lat, lon, cityName) {
  if (!lat || !lon) return;

  // Initialize map if not already done
  if (!mapInitialized) {
    map = L.map("weather-map").setView([lat, lon], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInitialized = true;
  }

  // Update view
  if (map) {
    map.setView([lat, lon], 12);

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new marker
    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`<strong>${cityName}</strong>`)
      .openPopup();

    // Fix map rendering using requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      map.invalidateSize(false);
    });
  }
}

/**
 * Toggle theme between dark and light
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);

  // Update theme toggle button
  if (elements.themeToggle) {
    const sunIcon = elements.themeToggle.querySelector(".sun-icon");
    const moonIcon = elements.themeToggle.querySelector(".moon-icon");

    if (sunIcon && moonIcon) {
      if (next === "dark") {
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
      } else {
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
      }
    }
  }

  // Re-render chart with new theme
  if (weatherChart) {
    const units = localStorage.getItem("units") || "metric";
    updateChartTheme(units);
  }
}

/**
 * Initialize theme from localStorage
 */
export function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);

  // Update theme toggle button icons
  if (elements.themeToggle) {
    const sunIcon = elements.themeToggle.querySelector(".sun-icon");
    const moonIcon = elements.themeToggle.querySelector(".moon-icon");

    if (sunIcon && moonIcon) {
      if (saved === "dark") {
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
      } else {
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
      }
    }
  }
}

/**
 * Update API status indicator
 */
export function updateApiStatus(isOnline) {
  if (elements.apiStatus) {
    elements.apiStatus.textContent = isOnline ? "Online" : "Offline";
  }

  if (elements.apiStatusWrapper) {
    elements.apiStatusWrapper.classList.remove("success", "error");
    if (isOnline) {
      elements.apiStatusWrapper.classList.add("success");
    } else {
      elements.apiStatusWrapper.classList.add("error");
    }
  }
}

/**
 * Update units toggle button state
 */
export function updateUnitsToggle(units) {
  if (elements.unitC && elements.unitF) {
    elements.unitC.classList.toggle("active", units === "metric");
    elements.unitF.classList.toggle("active", units === "imperial");
  }
}

/**
 * Render favorites list
 */
export function renderFavoritesList(favorites, onSelect) {
  if (!elements.favoritesContainer) return;

  elements.favoritesContainer.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    if (elements.favoritesSection) {
      elements.favoritesSection.classList.add("hidden");
    }
    return;
  }

  if (elements.favoritesSection) {
    elements.favoritesSection.classList.remove("hidden");
  }

  favorites.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "favorite-btn";
    btn.textContent = city;
    btn.onclick = () => onSelect(city);
    elements.favoritesContainer.appendChild(btn);
  });
}

/**
 * Update favorite button state
 */
export function updateFavoriteButton(isFavorite) {
  if (!elements.favoriteBtn) return;

  if (isFavorite) {
    elements.favoriteBtn.textContent = "⭐ Favorite";
    elements.favoriteBtn.classList.add("active");
  } else {
    elements.favoriteBtn.textContent = "☆ Add to Favorites";
    elements.favoriteBtn.classList.remove("active");
  }
  elements.favoriteBtn.classList.remove("hidden");
}

/**
 * Show autocomplete results
 */
export function showAutocomplete(results, onSelect) {
  if (!elements.autocompleteResults) return;

  if (!results || results.length === 0) {
    elements.autocompleteResults.classList.add("hidden");
    return;
  }

  elements.autocompleteResults.innerHTML = "";

  results.forEach((item) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";

    const locationName = `${item.name}, ${item.country || ""}`;
    div.textContent = locationName;

    div.onclick = () => {
      onSelect(item);
      elements.autocompleteResults.classList.add("hidden");
    };

    elements.autocompleteResults.appendChild(div);
  });

  elements.autocompleteResults.classList.remove("hidden");
}

/**
 * Hide autocomplete results
 */
export function hideAutocomplete() {
  if (elements.autocompleteResults) {
    elements.autocompleteResults.classList.add("hidden");
  }
}

/**
 * Set loading message
 */
export function setLoadingMessage(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message;
  }
}
