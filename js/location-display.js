/**
 * WeatherNow - Location Display Module
 * 
 * Handles the location info card display with comprehensive location details.
 * Shows city, state, country, coordinates, timezone, and PIN code.
 */

import { COUNTRY_NAMES, COUNTRY_FLAGS } from './config.js';

const elements = {};

/**
 * Initialize location info card elements
 */
export function initLocationInfoCard() {
  elements.card = document.getElementById('location-info-card');
  elements.closeBtn = document.getElementById('close-location-card');
  elements.city = document.getElementById('location-city');
  elements.state = document.getElementById('location-state');
  elements.country = document.getElementById('location-country');
  elements.pincode = document.getElementById('location-pincode');
  elements.coords = document.getElementById('location-coords');
  elements.timezone = document.getElementById('location-timezone');

  // Setup close button
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', hideLocationInfoCard);
  }
}

/**
 * Show location information card with comprehensive details
 * @param {Object} location - Location data
 * @param {Object} weather - Optional weather data
 */
export function showLocationInfo(location, weather = null) {
  if (!elements.card || !location) {
    console.warn('Location card or location data missing');
    return;
  }

  // Update location details
  updateLocationDetails(location);

  // Update weather if available
  if (weather && weather.current) {
    updateWeatherDetails(weather);
  }

  // Show card with animation
  elements.card.style.display = 'block';
  elements.card.classList.add('slide-in');

  // Scroll into view smoothly
  setTimeout(() => {
    elements.card.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);

  // Remove animation class after animation completes
  setTimeout(() => {
    elements.card.classList.remove('slide-in');
  }, 500);
}

/**
 * Update location details in card
 */
function updateLocationDetails(location) {
  if (!location) return;

  // City/Village
  if (elements.city) {
    elements.city.textContent = location.name || '--';
  }

  // State/Province - Handle missing state data
  if (elements.state) {
    if (location.state && location.state.trim() !== '') {
      elements.state.textContent = location.state;
    } else {
      // Try to infer from location name or show alternative
      elements.state.textContent = 'Not available';
    }
  }

  // Country with flag emoji
  if (elements.country) {
    elements.country.textContent = getCountryWithFlag(location.country);
  }

  // PIN Code / ZIP
  if (elements.pincode) {
    if (location.zip && location.zip.trim() !== '') {
      elements.pincode.textContent = location.zip;
      elements.pincode.style.fontStyle = 'normal';
      elements.pincode.style.fontSize = '14px';
    } else {
      elements.pincode.textContent = 'Search by PIN code for exact value';
      elements.pincode.style.fontStyle = 'italic';
      elements.pincode.style.fontSize = '12px';
    }
  }

  // Coordinates with direction indicators
  if (elements.coords) {
    if (typeof location.lat === 'number' && typeof location.lon === 'number') {
      const latDir = location.lat >= 0 ? 'N' : 'S';
      const lonDir = location.lon >= 0 ? 'E' : 'W';
      elements.coords.textContent = `${Math.abs(location.lat).toFixed(4)}°${latDir}, ${Math.abs(location.lon).toFixed(4)}°${lonDir}`;
    } else {
      elements.coords.textContent = 'Not available';
    }
  }

  // Timezone - Calculate from longitude
  if (elements.timezone) {
    if (typeof location.lat === 'number' && typeof location.lon === 'number') {
      const timezone = calculateTimezone(location.lat, location.lon);
      elements.timezone.textContent = timezone;
    } else {
      elements.timezone.textContent = 'Not available';
    }
  }
}

/**
 * Update weather details in card (if available)
 */
function updateWeatherDetails(weather) {
  if (!weather || !weather.current) return;

  // Find weather elements in card if they exist
  const weatherTemp = document.getElementById('location-temperature');
  const weatherCondition = document.getElementById('location-condition');

  if (weatherTemp) {
    weatherTemp.textContent = `${weather.current.temp}°${weather.units === 'imperial' ? 'F' : 'C'}`;
  }

  if (weatherCondition) {
    const condition = weather.current.description || 'Unknown';
    const icon = weather.current.icon || '01d';
    weatherCondition.innerHTML = `
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${condition}" style="width: 40px; vertical-align: middle;">
      <span>${condition}</span>
    `;
  }
}

/**
 * Hide location information card
 */
export function hideLocationInfoCard() {
  if (!elements.card) return;

  elements.card.style.display = 'none';
  elements.card.classList.remove('slide-in');
}

/**
 * Get country name with flag emoji
 */
function getCountryWithFlag(countryCode) {
  if (!countryCode) return '--';

  const flag = COUNTRY_FLAGS[countryCode] || '';
  const name = COUNTRY_NAMES[countryCode] || countryCode;
  
  if (flag && name) {
    return `${flag} ${name}`;
  }
  return name;
}

/**
 * Calculate timezone from coordinates (approximate)
 */
function calculateTimezone(lat, lon) {
  // Calculate UTC offset from longitude
  const offset = lon / 15;
  const hours = Math.floor(Math.abs(offset));
  const minutes = Math.round((Math.abs(offset) - hours) * 60);
  
  const sign = offset >= 0 ? '+' : '-';
  const minutesStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
  
  return `UTC${sign}${hours}${minutesStr}`;
}

/**
 * Show loading state in location card
 */
export function showLocationLoading() {
  if (!elements.card) return;

  elements.card.innerHTML = `
    <div class="location-card-header">
      <h3 class="location-card-title">📍 Loading Location...</h3>
    </div>
    <div class="location-card-content">
      <div class="loading-skeleton">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  `;
  elements.card.style.display = 'block';
}

/**
 * Show error message in location card
 */
export function showLocationError(message) {
  if (!elements.card) return;

  elements.card.innerHTML = `
    <div class="location-card-header">
      <h3 class="location-card-title">⚠️ Error</h3>
    </div>
    <div class="location-card-content">
      <p style="color: var(--danger, #ef4444); text-align: center; padding: 20px;">${message}</p>
      <button onclick="document.getElementById('location-info-card').style.display='none'"
              style="margin: 15px auto; display: block; padding: 10px 20px; background: var(--primary, #6366f1); color: white; border: none; border-radius: 8px; cursor: pointer;">
        Close
      </button>
    </div>
  `;
  elements.card.style.display = 'block';
}

/**
 * Check if location card is visible
 */
export function isLocationCardVisible() {
  return elements.card && elements.card.style.display !== 'none';
}

/**
 * Update location card with PIN code (called after PIN code lookup)
 */
export function updatePincode(pincode) {
  if (elements.pincode && pincode) {
    elements.pincode.textContent = pincode;
    elements.pincode.style.fontStyle = 'normal';
    elements.pincode.style.fontSize = '14px';
  }
}

export default {
  initLocationInfoCard,
  showLocationInfo,
  hideLocationInfoCard,
  showLocationLoading,
  showLocationError,
  isLocationCardVisible,
  updatePincode
};
