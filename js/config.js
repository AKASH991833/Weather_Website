/**
 * WeatherNow - Configuration File
 *
 * SECURITY: API Key is loaded from environment variable
 * DO NOT commit API key to version control!
 *
 * SETUP:
 * 1. Copy config.example.js to config.local.js
 * 2. Add your API key in config.local.js
 * 3. config.local.js is gitignored (safe)
 */

// Default configuration (safe to commit)
const DEFAULT_CONFIG = {
  // OpenWeatherMap API Key (placeholder - will be overridden)
  API_KEY: 'YOUR_API_KEY_HERE',

  // API Endpoints
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  ONE_CALL_URL: 'https://api.openweathermap.org/data/3.0/onecall',
  GEOCODING_URL: 'https://api.openweathermap.org/geo/1.0',
  AIR_POLLUTION_URL: 'https://api.openweathermap.org/data/2.5/air_pollution',
  
  // Backend Proxy Server (for secure API calls)
  // Note: Currently using direct API calls (free tier)
  // For production: Setup backend proxy for security
  API_BASE_URL: 'https://api.openweathermap.org',
  
  // Units: 'metric' (Celsius) or 'imperial' (Fahrenheit)
  UNITS: 'metric',

  // Language code
  LANG: 'en',

  // App Settings
  DEBOUNCE_DELAY: 300, // ms for search input debounce
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes cache
  MAX_SEARCH_RESULTS: 5,

  // Default location (London)
  DEFAULT_LAT: 51.5074,
  DEFAULT_LON: -0.1278,
  DEFAULT_CITY: 'London',

  // Rate limiting
  RATE_LIMIT: {
    WEATHER: 60,
    CURRENT_WEATHER: 60,
    FORECAST: 60,
    AIR_QUALITY: 60,
    GEOCODING: 60
  },

  // Error messages
  ERROR_MESSAGES: {
    API_KEY: 'Invalid API key. Please check your configuration.',
    NETWORK: 'Network error. Please check your internet connection.',
    NOT_FOUND: 'Location not found. Please try a different city.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.'
  }
};

// Try to load local config (with API key) if it exists
let CONFIG = { ...DEFAULT_CONFIG };

try {
  // Check if local config exists (it won't on GitHub, only in local dev)
  if (typeof window !== 'undefined') {
    // Browser environment - check for config.local.js
    // This will fail gracefully if file doesn't exist
    try {
      const localConfig = await import('./config.local.js');
      if (localConfig.default) {
        CONFIG = { ...DEFAULT_CONFIG, ...localConfig.default };
        console.log('✅ Loaded local configuration (API key from config.local.js)');
      }
    } catch (e) {
      // config.local.js doesn't exist or not needed
      console.log('ℹ️ Using default configuration (no config.local.js)');
    }
  }
} catch (error) {
  console.log('⚠️ Using default configuration');
}

// Export configuration
export default CONFIG;

// Country names mapping
export const COUNTRY_NAMES = {
  'IN': 'India',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'CN': 'China',
  'BR': 'Brazil',
  'RU': 'Russia',
  'IT': 'Italy',
  'ES': 'Spain',
  'MX': 'Mexico',
  'KR': 'South Korea',
  'ID': 'Indonesia',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AR': 'Argentina',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'EG': 'Egypt',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'NZ': 'New Zealand',
  'AE': 'United Arab Emirates',
  'PK': 'Pakistan',
  'BD': 'Bangladesh',
  'LK': 'Sri Lanka',
  'NP': 'Nepal'
};

// Country flags (emoji)
export const COUNTRY_FLAGS = {
  'IN': '🇮🇳',
  'US': '🇺🇸',
  'GB': '🇬🇧',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'JP': '🇯🇵',
  'CN': '🇨🇳',
  'BR': '🇧🇷',
  'RU': '🇷🇺',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'MX': '🇲🇽',
  'KR': '🇰🇷',
  'ID': '🇮🇩',
  'TR': '🇹🇷',
  'SA': '🇸🇦',
  'AR': '🇦🇷',
  'ZA': '🇿🇦',
  'NG': '🇳🇬',
  'EG': '🇪🇬',
  'TH': '🇹🇭',
  'VN': '🇻🇳',
  'PH': '🇵🇭',
  'MY': '🇲🇾',
  'SG': '🇸🇬',
  'NZ': '🇳🇿',
  'AE': '🇦🇪',
  'PK': '🇵🇰',
  'BD': '🇧🇩',
  'LK': '🇱🇰',
  'NP': '🇳🇵'
};

export default CONFIG;
