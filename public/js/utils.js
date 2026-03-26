/**
 * WeatherNow - Utility Functions v4.0
 */

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttle function to limit function execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format timestamp to readable date/time
 * @param {number} ts - Unix timestamp
 * @param {number} offset - Timezone offset
 * @param {string} type - Type of format ('time', 'hour', 'day', 'full')
 * @returns {string} Formatted date/time string
 */
export function formatTimestamp(ts, offset, type) {
  if (!ts) return '--';
  
  const date = new Date((ts + offset) * 1000);
  const options = { timeZone: 'UTC' };

  if (type === 'time') {
    return date.toLocaleTimeString('en-US', { 
      ...options, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  if (type === 'hour') {
    return date.toLocaleTimeString('en-US', { 
      ...options, 
      hour: 'numeric' 
    });
  }
  
  if (type === 'day') {
    const now = new Date();
    const inputDate = new Date(ts * 1000);
    const isToday = inputDate.getUTCDate() === now.getUTCDate() &&
                    inputDate.getUTCMonth() === now.getUTCMonth() &&
                    inputDate.getUTCFullYear() === now.getUTCFullYear();
    
    if (isToday) return 'Today';
    
    return date.toLocaleDateString('en-US', { 
      ...options, 
      weekday: 'short' 
    });
  }
  
  if (type === 'full') {
    return date.toLocaleDateString('en-US', { 
      ...options, 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  return date.toUTCString();
}

/**
 * Capitalize first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize each word in string
 * @param {string} str - Input string
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Safe object property access with path notation
 * @param {Object} obj - Object to access
 * @param {string} path - Dot/bracket notation path
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} Value at path or default
 */
export function safeGet(obj, path, defaultValue = null) {
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
    return defaultValue;
  }
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Format number with units
 * @param {number} num - Number to format
 * @param {string} unit - Unit to append
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
export function formatNumber(num, unit = '', decimals = 1) {
  if (num === null || num === undefined) return '--';
  return `${Number(num).toFixed(decimals)}${unit}`;
}

/**
 * Convert temperature between units
 * @param {number} temp - Temperature value
 * @param {string} from - From unit ('c' or 'f')
 * @param {string} to - To unit ('c' or 'f')
 * @returns {number} Converted temperature
 */
export function convertTemperature(temp, from, to) {
  if (from === to) return temp;
  
  if (from === 'c' && to === 'f') {
    return (temp * 9/5) + 32;
  }
  
  if (from === 'f' && to === 'c') {
    return (temp - 32) * 5/9;
  }
  
  return temp;
}

/**
 * Convert wind speed between units
 * @param {number} speed - Wind speed
 * @param {string} from - From unit ('m/s', 'km/h', 'mph', 'kn')
 * @param {string} to - To unit ('m/s', 'km/h', 'mph', 'kn')
 * @returns {number} Converted wind speed
 */
export function convertWindSpeed(speed, from, to) {
  if (from === to) return speed;
  
  // Convert to m/s first
  let inMetersPerSecond;
  switch (from) {
    case 'm/s': inMetersPerSecond = speed; break;
    case 'km/h': inMetersPerSecond = speed / 3.6; break;
    case 'mph': inMetersPerSecond = speed / 2.237; break;
    case 'kn': inMetersPerSecond = speed / 1.944; break;
    default: return speed;
  }
  
  // Convert from m/s to target
  switch (to) {
    case 'm/s': return inMetersPerSecond;
    case 'km/h': return inMetersPerSecond * 3.6;
    case 'mph': return inMetersPerSecond * 2.237;
    case 'kn': return inMetersPerSecond * 1.944;
    default: return speed;
  }
}

/**
 * Get weather condition class from icon code
 * @param {string} iconCode - OpenWeatherMap icon code
 * @returns {string} CSS class name
 */
export function getWeatherConditionClass(iconCode) {
  if (!iconCode) return '';
  
  if (iconCode.includes('01')) return 'weather-clear';
  if (iconCode.includes('02')) return 'weather-partly-cloudy';
  if (iconCode.match(/03|04/)) return 'weather-cloudy';
  if (iconCode.match(/09|10/)) return 'weather-rainy';
  if (iconCode.includes('11')) return 'weather-thunder';
  if (iconCode.includes('13')) return 'weather-snow';
  if (iconCode.includes('50')) return 'weather-fog';
  
  return '';
}

/**
 * Get emoji for weather condition
 * @param {string} condition - Weather condition
 * @returns {string} Emoji
 */
export function getWeatherEmoji(condition) {
  if (!condition) return '🌤️';
  
  const cond = condition.toLowerCase();
  
  if (cond.includes('clear')) return '☀️';
  if (cond.includes('cloud')) return '☁️';
  if (cond.includes('rain') || cond.includes('drizzle')) return '🌧️';
  if (cond.includes('thunder')) return '⛈️';
  if (cond.includes('snow')) return '❄️';
  if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) return '🌫️';
  
  return '🌤️';
}

/**
 * Calculate relative time from timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time string
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = now - (timestamp * 1000);
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Check if value is a valid number
 * @param {*} value - Value to check
 * @returns {boolean} True if valid number
 */
export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Round to specific decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
export function roundTo(num, decimals = 1) {
  if (!isValidNumber(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Sleep/delay utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Max retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
}

/**
 * Format a Date object to a short time string (e.g. "10:30 AM")
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return '--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a Date object to a long date string (e.g. "Thursday, March 26, 2026")
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date)) return '--';
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Convert wind degree to compass direction label
 * @param {number} deg - Wind degree (0-360)
 * @returns {string} compass label
 */
export function getWindDirection(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return '--';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.round(((deg % 360) / 22.5));
  return dirs[idx % 16];
}

