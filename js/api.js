/**
 * WeatherNow - API Module
 * All Features: Weather, Forecast, AQI, Locations
 */

import CONFIG from './config.js';

const cache = new Map();

function isCacheValid(item) {
  return item && (Date.now() - item.timestamp) < CONFIG.CACHE_DURATION;
}

function getCache(key) {
  const item = cache.get(key);
  if (isCacheValid(item)) return item.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchAPI(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('Invalid API key');
    if (response.status === 404) throw new Error('Location not found');
    if (response.status === 429) throw new Error('Too many requests');
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const searchQuery = query.trim();
  
  // Try direct search first
  let results = await searchWithQuery(searchQuery);
  
  // If no results and query doesn't already have country, try adding India
  if (results.length === 0 && !searchQuery.toLowerCase().includes('india') && !searchQuery.toLowerCase().includes('in')) {
    results = await searchWithQuery(`${searchQuery}, IN`);
  }
  
  // If still no results, try with state names for India
  if (results.length === 0) {
    results = await searchWithIndianState(searchQuery);
  }
  
  return results;
}

async function searchWithQuery(query) {
  const cached = getCache(`geo:${query.toLowerCase()}`);
  if (cached) return cached;

  const url = `${CONFIG.GEOCODING_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`;
  try {
    const data = await fetchAPI(url);
    setCache(`geo:${query.toLowerCase()}`, data);
    return data || [];
  } catch (error) {
    console.warn('Search failed for:', query, error);
    return [];
  }
}

async function searchWithIndianState(stateQuery) {
  // Map of Indian states to major cities
  const indianStates = {
    'tamil nadu': 'Chennai, Tamil Nadu, IN',
    'maharashtra': 'Mumbai, Maharashtra, IN',
    'karnataka': 'Bangalore, Karnataka, IN',
    'delhi': 'Delhi, IN',
    'kerala': 'Thiruvananthapuram, Kerala, IN',
    'west bengal': 'Kolkata, West Bengal, IN',
    'gujarat': 'Ahmedabad, Gujarat, IN',
    'rajasthan': 'Jaipur, Rajasthan, IN',
    'punjab': 'Chandigarh, Punjab, IN',
    'haryana': 'Chandigarh, Haryana, IN',
    'uttar pradesh': 'Lucknow, Uttar Pradesh, IN',
    'madhya pradesh': 'Bhopal, Madhya Pradesh, IN',
    'telangana': 'Hyderabad, Telangana, IN',
    'andhra pradesh': 'Amaravati, Andhra Pradesh, IN',
    'bihar': 'Patna, Bihar, IN',
    'odisha': 'Bhubaneswar, Odisha, IN',
    'assam': 'Dispur, Assam, IN',
    'jharkhand': 'Ranchi, Jharkhand, IN',
    'chhattisgarh': 'Raipur, Chhattisgarh, IN',
    'uttarakhand': 'Dehradun, Uttarakhand, IN',
    'himachal pradesh': 'Shimla, Himachal Pradesh, IN',
    'goa': 'Panaji, Goa, IN',
    'jammu': 'Srinagar, Jammu and Kashmir, IN',
    'kashmir': 'Srinagar, Jammu and Kashmir, IN'
  };
  
  // Famous Indian cities
  const indianCities = {
    'mumbai': 'Mumbai, Maharashtra, IN',
    'delhi': 'Delhi, IN',
    'bangalore': 'Bangalore, Karnataka, IN',
    'bengaluru': 'Bangalore, Karnataka, IN',
    'chennai': 'Chennai, Tamil Nadu, IN',
    'kolkata': 'Kolkata, West Bengal, IN',
    'calcutta': 'Kolkata, West Bengal, IN',
    'hyderabad': 'Hyderabad, Telangana, IN',
    'ahmedabad': 'Ahmedabad, Gujarat, IN',
    'pune': 'Pune, Maharashtra, IN',
    'surat': 'Surat, Gujarat, IN',
    'jaipur': 'Jaipur, Rajasthan, IN',
    'lucknow': 'Lucknow, Uttar Pradesh, IN',
    'kanpur': 'Kanpur, Uttar Pradesh, IN',
    'nagpur': 'Nagpur, Maharashtra, IN',
    'indore': 'Indore, Madhya Pradesh, IN',
    'thane': 'Thane, Maharashtra, IN',
    'bhopal': 'Bhopal, Madhya Pradesh, IN',
    'visakhapatnam': 'Visakhapatnam, Andhra Pradesh, IN',
    'patna': 'Patna, Bihar, IN',
    'vadodara': 'Vadodara, Gujarat, IN',
    'ghaziabad': 'Ghaziabad, Uttar Pradesh, IN',
    'ludhiana': 'Ludhiana, Punjab, IN',
    'agra': 'Agra, Uttar Pradesh, IN',
    'nashik': 'Nashik, Maharashtra, IN',
    'faridabad': 'Faridabad, Haryana, IN',
    'meerut': 'Meerut, Uttar Pradesh, IN',
    'rajkot': 'Rajkot, Gujarat, IN',
    'varanasi': 'Varanasi, Uttar Pradesh, IN',
    'srinagar': 'Srinagar, Jammu and Kashmir, IN',
    'amritsar': 'Amritsar, Punjab, IN',
    'allahabad': 'Prayagraj, Uttar Pradesh, IN',
    'prayagraj': 'Prayagraj, Uttar Pradesh, IN',
    'ranchi': 'Ranchi, Jharkhand, IN',
    'howrah': 'Howrah, West Bengal, IN',
    'coimbatore': 'Coimbatore, Tamil Nadu, IN',
    'vijayawada': 'Vijayawada, Andhra Pradesh, IN',
    'kochi': 'Kochi, Kerala, IN',
    'cochin': 'Kochi, Kerala, IN',
    'madurai': 'Madurai, Tamil Nadu, IN',
    'chandigarh': 'Chandigarh, IN',
    'thiruvananthapuram': 'Thiruvananthapuram, Kerala, IN',
    'trivandrum': 'Thiruvananthapuram, Kerala, IN',
    'dehradun': 'Dehradun, Uttarakhand, IN',
    'shimla': 'Shimla, Himachal Pradesh, IN',
    'gangtok': 'Gangtok, Sikkim, IN',
    'guwahati': 'Guwahati, Assam, IN',
    'dispur': 'Dispur, Assam, IN',
    'imphal': 'Imphal, Manipur, IN',
    'shillong': 'Shillong, Meghalaya, IN',
    'aizawl': 'Aizawl, Mizoram, IN',
    'kohima': 'Kohima, Nagaland, IN',
    'itanagar': 'Itanagar, Arunachal Pradesh, IN',
    'agartala': 'Agartala, Tripura, IN',
    'port blair': 'Port Blair, Andaman and Nicobar, IN',
    'puducherry': 'Puducherry, IN',
    'pondicherry': 'Puducherry, IN',
    'leh': 'Leh, Ladakh, IN',
    'manali': 'Manali, Himachal Pradesh, IN',
    'darjeeling': 'Darjeeling, West Bengal, IN',
    'gangtok': 'Gangtok, Sikkim, IN',
    'nainital': 'Nainital, Uttarakhand, IN',
    'mussoorie': 'Mussoorie, Uttarakhand, IN',
    'ooty': 'Ooty, Tamil Nadu, IN',
    'ootacamund': 'Ooty, Tamil Nadu, IN',
    'kodaikanal': 'Kodaikanal, Tamil Nadu, IN',
    'munnar': 'Munnar, Kerala, IN',
    'alleppey': 'Alappuzha, Kerala, IN',
    'alappuzha': 'Alappuzha, Kerala, IN'
  };
  
  const lowerQuery = stateQuery.toLowerCase();
  
  // Check if query matches any Indian city
  if (indianCities[lowerQuery]) {
    return await searchWithQuery(indianCities[lowerQuery]);
  }
  
  // Check if query matches any Indian state
  for (const [state, city] of Object.entries(indianStates)) {
    if (lowerQuery.includes(state) || state.includes(lowerQuery)) {
      return await searchWithQuery(city);
    }
  }
  
  return [];
}

export async function getCurrentWeather(lat, lon, units = 'metric') {
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log('Weather cache HIT for:', cacheKey);
    return cached;
  }
  console.log('Weather cache MISS, fetching from API with units:', units);

  const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;
  console.log('API URL:', url);
  const data = await fetchAPI(url);
  setCache(cacheKey, data);
  console.log('Weather data received, temp:', data.main.temp);
  return data;
}

export async function getForecast(lat, lon, units = 'metric') {
  const cacheKey = `forecast:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log('Forecast cache HIT for:', cacheKey);
    return cached;
  }
  console.log('Forecast cache MISS, fetching from API with units:', units);

  const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${CONFIG.API_KEY}`;
  console.log('API URL:', url);
  const data = await fetchAPI(url);
  setCache(cacheKey, data);
  console.log('Forecast data received, first temp:', data.list[0].main.temp);
  return data;
}

export async function getAirQuality(lat, lon) {
  const cached = getCache(`aqi:${lat}:${lon}`);
  if (cached) return cached;

  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
  try {
    const data = await fetchAPI(url);
    setCache(`aqi:${lat}:${lon}`, data);
    return data;
  } catch (error) {
    console.warn('AQI not available:', error);
    return null;
  }
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        if (err.code === 1) reject(new Error('Location permission denied'));
        else reject(new Error('Unable to get location'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function formatWeatherData(current, forecast, aqi, cityName, currentUnit = 'metric') {
  // Daily forecast
  const dailyMap = {};
  forecast.list.forEach(item => {
    const dateKey = new Date(item.dt * 1000).toLocaleDateString();
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: item.dt * 1000,
        tempMax: item.main.temp,
        tempMin: item.main.temp_min,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        precipitation: item.pop ? Math.round(item.pop * 100) : 0
      };
    } else {
      if (item.main.temp > dailyMap[dateKey].tempMax) {
        dailyMap[dateKey].tempMax = item.main.temp;
        dailyMap[dateKey].precipitation = item.pop ? Math.round(item.pop * 100) : 0;
      }
      if (item.main.temp_min < dailyMap[dateKey].tempMin) {
        dailyMap[dateKey].tempMin = item.main.temp_min;
      }
    }
  });
  const daily = Object.values(dailyMap).slice(0, 7).map(d => ({
    ...d,
    tempMax: Math.round(d.tempMax),
    tempMin: Math.round(d.tempMin)
  }));

  // Hourly forecast (next 24 hours)
  const hourly = forecast.list.slice(0, 8).map(item => ({
    date: item.dt * 1000,
    temp: Math.round(item.main.temp),
    icon: item.weather[0].icon,
    precipitation: item.pop ? Math.round(item.pop * 100) : 0
  }));

  // AQI data
  let airQuality = null;
  if (aqi && aqi.list && aqi.list[0]) {
    const aqiData = aqi.list[0];
    airQuality = {
      aqi: aqiData.main.aqi,
      pm25: aqiData.components.pm2_5?.toFixed(1) || '--',
      pm10: aqiData.components.pm10?.toFixed(1) || '--',
      o3: aqiData.components.o3?.toFixed(1) || '--',
      no2: aqiData.components.no2?.toFixed(1) || '--'
    };
  }

  return {
    location: { name: cityName, lat: current.coord.lat, lon: current.coord.lon },
    current: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6),
      windDeg: current.wind.deg,
      visibility: Math.round((current.visibility || 10000) / 1000),
      pressure: current.main.pressure,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      iconId: current.weather[0].id,
      timestamp: current.dt * 1000,
      sunrise: current.sys.sunrise * 1000,
      sunset: current.sys.sunset * 1000,
      moonPhase: current.dt % 86400,
      dewPoint: current.main.temp !== undefined ? Math.round(current.main.temp - ((100 - current.main.humidity) / 5)) : '--',
      precipitation: hourly[0]?.precipitation || 0
    },
    daily,
    hourly,
    airQuality
  };
}

export function getAQICategory(aqi) {
  const categories = {
    1: { label: 'Good', color: 'aqi-good', health: 'Air quality is satisfactory. Perfect for outdoor activities!' },
    2: { label: 'Fair', color: 'aqi-moderate', health: 'Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.' },
    3: { label: 'Moderate', color: 'aqi-moderate', health: 'Members of sensitive groups may experience health effects. General public less likely to be affected.' },
    4: { label: 'Poor', color: 'aqi-unhealthy', health: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.' },
    5: { label: 'Very Poor', color: 'aqi-unhealthy', health: 'Health alert: everyone may experience more serious health effects. Avoid outdoor activities.' }
  };
  return categories[aqi] || categories[1];
}

export function initCacheCleanup() {
  setInterval(() => {
    for (const [key, value] of cache.entries()) {
      if (!isCacheValid(value)) cache.delete(key);
    }
  }, 5 * 60 * 1000);
}

// Clear weather/forecast cache (when unit changes)
export function clearWeatherCache() {
  for (const key of cache.keys()) {
    if (key.startsWith('weather:') || key.startsWith('forecast:')) {
      cache.delete(key);
    }
  }
}

// Saved Locations Management
export function saveLocation(location) {
  try {
    let locations = getSavedLocations();
    const exists = locations.find(l => l.lat === location.lat && l.lon === location.lon);
    if (!exists) {
      locations.push(location);
      localStorage.setItem('weathernow:savedLocations', JSON.stringify(locations));
    }
    return locations;
  } catch (err) {
    console.warn('Save location error:', err);
    return [];
  }
}

export function removeLocation(lat, lon) {
  try {
    let locations = getSavedLocations();
    locations = locations.filter(l => !(l.lat === lat && l.lon === lon));
    localStorage.setItem('weathernow:savedLocations', JSON.stringify(locations));
    return locations;
  } catch (err) {
    console.warn('Remove location error:', err);
    return [];
  }
}

export function getSavedLocations() {
  try {
    const saved = localStorage.getItem('weathernow:savedLocations');
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.warn('Get locations error:', err);
    return [];
  }
}

export function getCurrentTheme() {
  return localStorage.getItem('weathernow:theme') || 'light';
}

export function saveTheme(theme) {
  localStorage.setItem('weathernow:theme', theme);
}

export default {
  searchLocations,
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getCurrentLocation,
  formatWeatherData,
  getAQICategory,
  initCacheCleanup,
  clearWeatherCache,
  saveLocation,
  removeLocation,
  getSavedLocations,
  getCurrentTheme,
  saveTheme
};
