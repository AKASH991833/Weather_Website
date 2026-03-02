/**
 * WeatherNow - Configuration File
 * GitHub Pages Compatible - Direct OpenWeather API Calls
 *
 * SETUP:
 * 1. Get free API key from https://openweathermap.org/api
 * 2. Replace 'YOUR_API_KEY_HERE' with your actual API key
 * 3. Deploy to GitHub Pages
 */

const CONFIG = {
  // OpenWeatherMap API Key - REPLACE WITH YOUR KEY
  // Get free key: https://openweathermap.org/api
  API_KEY: '82ccd04c1fea51e3ba067b31a39eab69',

  // API Endpoints - Direct OpenWeatherMap API (GitHub Pages compatible)
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEOCODING_URL: 'https://api.openweathermap.org/geo/1.0',
  AIR_POLLUTION_URL: 'https://api.openweathermap.org/data/2.5/air_pollution',

  // Units: 'metric' (Celsius) or 'imperial' (Fahrenheit)
  UNITS: 'metric',

  // Language code
  LANG: 'en',

  // App Settings
  DEBOUNCE_DELAY: 300,
  CACHE_DURATION: 10 * 60 * 1000,
  MAX_SEARCH_RESULTS: 5,

  // Default location (can be changed)
  DEFAULT_LAT: 51.5074,
  DEFAULT_LON: -0.1278,
  DEFAULT_CITY: 'London',

  // Rate limiting (requests per minute)
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
