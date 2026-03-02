/**
 * WeatherNow - Push Notifications Module
 * 
 * Features:
 * - Daily forecast notifications
 * - Severe weather alerts
 * - Morning briefing
 * - Evening summary
 * - Customizable notification settings
 */

import CONFIG from './config.js';

// Notification state
let notificationPermission = 'default';
let dailyNotificationTimer = null;
let notificationSettings = {
  enabled: true,
  dailyForecast: true,
  severeAlerts: true,
  morningBriefing: true,
  eveningSummary: false,
  dailyTime: '08:00' // Default 8 AM
};

const SETTINGS_KEY = 'weathernow:notificationSettings';

/**
 * Initialize push notifications
 */
export async function initNotifications() {
  console.log('🔔 Initializing Push Notifications...');
  
  // Load saved settings
  loadSettings();
  
  // Request permission
  await requestPermission();
  
  // Setup daily notifications
  if (notificationSettings.enabled && notificationSettings.dailyForecast) {
    scheduleDailyNotification();
  }
  
  // Listen for visibility change to check notifications
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  console.log('🔔 Push Notifications initialized');
}

/**
 * Request notification permission
 */
export async function requestPermission() {
  if (!('Notification' in window)) {
    console.log('❌ Notifications not supported');
    notificationPermission = 'denied';
    return false;
  }
  
  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return true;
  }
  
  if (Notification.permission === 'denied') {
    notificationPermission = 'denied';
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      showWelcomeNotification();
    } else {
      console.log('⚠️ Notification permission denied');
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Show welcome notification
 */
function showWelcomeNotification() {
  showNotification({
    title: '🌤️ WeatherNow Installed!',
    body: 'You\'ll now receive weather updates and severe weather alerts.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100],
    tag: 'welcome',
    requireInteraction: false
  });
}

/**
 * Show weather notification
 */
export function showWeatherNotification(weatherData) {
  if (!weatherData || notificationPermission !== 'granted') return;
  
  const { location, current } = weatherData;
  
  showNotification({
    title: `🌤️ ${location.name || 'Current Weather'}`,
    body: `${current.description}, ${current.temp}°${CONFIG.UNITS === 'metric' ? 'C' : 'F'} • Feels like ${current.feelsLike}°`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100],
    tag: 'weather-update',
    data: {
      url: '/',
      lat: location.lat,
      lon: location.lon
    }
  });
}

/**
 * Show severe weather alert notification
 */
export function showSevereAlertNotification(alert) {
  if (notificationPermission !== 'granted') return;
  
  showNotification({
    title: `⚠️ ${alert.event || 'Severe Weather Alert'}`,
    body: alert.description?.substring(0, 200) || 'Severe weather warning in your area',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: `alert-${alert.event}`,
    requireInteraction: true,
    priority: 'high',
    data: {
      url: '/',
      alert: alert
    }
  });
}

/**
 * Show daily forecast notification
 */
export function showDailyForecastNotification(weatherData) {
  if (!weatherData || notificationPermission !== 'granted') return;
  
  const { location, daily } = weatherData;
  
  if (!daily || daily.length === 0) return;
  
  const today = daily[0];
  const tempUnit = CONFIG.UNITS === 'metric' ? '°C' : '°F';
  
  showNotification({
    title: `📅 Today's Forecast - ${location.name || 'Your Location'}`,
    body: `${today.description} • High: ${today.tempMax}${tempUnit} • Low: ${today.tempMin}${tempUnit}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100],
    tag: 'daily-forecast',
    data: {
      url: '/'
    }
  });
}

/**
 * Show morning briefing notification
 */
export function showMorningBriefing(weatherData) {
  if (!weatherData || notificationPermission !== 'granted') return;
  
  const { location, current, daily } = weatherData;
  
  let message = `Good morning! ☀️ Current: ${current.temp}°`;
  
  if (daily && daily.length > 0) {
    const today = daily[0];
    message += ` • High: ${today.tempMax}° • Low: ${today.tempMin}°`;
  }
  
  if (current.humidity) {
    message += ` • Humidity: ${current.humidity}%`;
  }
  
  showNotification({
    title: `🌅 Morning Briefing - ${location.name || 'Your Location'}`,
    body: message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100],
    tag: 'morning-briefing',
    data: {
      url: '/'
    }
  });
}

/**
 * Show generic notification
 */
export async function showNotification(options) {
  if (notificationPermission !== 'granted') {
    console.log('⚠️ Notification permission not granted');
    return;
  }
  
  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      badge: options.badge,
      vibrate: options.vibrate,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      priority: options.priority || 'normal',
      data: options.data || {},
      silent: options.silent || false,
      actions: options.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
    
    // Handle notification click
    notification.addEventListener('click', (event) => {
      event.target.close();
      
      if (options.data?.url) {
        window.open(options.data.url, '_blank');
      }
    });
    
    // Auto-close after 10 seconds for non-critical notifications
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }
    
    console.log('🔔 Notification shown:', options.title);
    
    return notification;
  } catch (error) {
    console.error('❌ Failed to show notification:', error);
  }
}

/**
 * Schedule daily notification
 */
function scheduleDailyNotification() {
  if (dailyNotificationTimer) {
    clearInterval(dailyNotificationTimer);
  }
  
  // Parse time
  const [hours, minutes] = notificationSettings.dailyTime.split(':').map(Number);
  
  // Calculate next occurrence
  const now = new Date();
  const nextNotification = new Date();
  nextNotification.setHours(hours, minutes, 0, 0);
  
  if (nextNotification <= now) {
    nextNotification.setDate(nextNotification.getDate() + 1);
  }
  
  const delay = nextNotification.getTime() - now.getTime();
  
  console.log(`⏰ Next daily notification in ${Math.round(delay / 60000)} minutes`);
  
  // Schedule first notification
  setTimeout(() => {
    triggerDailyNotification();
    
    // Then schedule daily
    dailyNotificationTimer = setInterval(triggerDailyNotification, 24 * 60 * 60 * 1000);
  }, delay);
}

/**
 * Trigger daily notification
 */
async function triggerDailyNotification() {
  console.log('🔔 Triggering daily notification...');
  
  // Get current weather data
  try {
    // This would ideally fetch fresh data
    // For now, we'll just show a generic notification
    showNotification({
      title: '🌤️ Daily Weather Update',
      body: 'Check out today\'s weather forecast!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'daily-reminder',
      data: {
        url: '/'
      }
    });
  } catch (error) {
    console.error('❌ Failed to trigger daily notification:', error);
  }
}

/**
 * Handle visibility change
 */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // Check for new notifications when tab becomes visible
    console.log('👀 Tab visible, checking for notifications...');
  }
}

/**
 * Load notification settings
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('❌ Failed to load notification settings:', error);
  }
}

/**
 * Save notification settings
 */
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(notificationSettings));
    console.log('💾 Notification settings saved');
  } catch (error) {
    console.error('❌ Failed to save notification settings:', error);
  }
}

/**
 * Update notification settings
 */
export function updateSettings(newSettings) {
  notificationSettings = { ...notificationSettings, ...newSettings };
  saveSettings();
  
  // Re-schedule if daily time changed
  if (newSettings.dailyTime) {
    scheduleDailyNotification();
  }
  
  // Clear timer if disabled
  if (!notificationSettings.enabled) {
    if (dailyNotificationTimer) {
      clearInterval(dailyNotificationTimer);
      dailyNotificationTimer = null;
    }
  }
  
  console.log('⚙️ Notification settings updated:', notificationSettings);
}

/**
 * Get notification settings
 */
export function getSettings() {
  return { ...notificationSettings };
}

/**
 * Get notification permission status
 */
export function getPermissionStatus() {
  return notificationPermission;
}

/**
 * Check if notifications are supported
 */
export function isSupported() {
  return 'Notification' in window;
}

/**
 * Check if notifications are enabled
 */
export function isEnabled() {
  return notificationPermission === 'granted' && notificationSettings.enabled;
}

/**
 * Unsubscribe from notifications
 */
export function unsubscribe() {
  if (dailyNotificationTimer) {
    clearInterval(dailyNotificationTimer);
    dailyNotificationTimer = null;
  }
  
  notificationSettings.enabled = false;
  saveSettings();
  
  console.log('🔕 Unsubscribed from notifications');
}

export default {
  initNotifications,
  requestPermission,
  showWeatherNotification,
  showSevereAlertNotification,
  showDailyForecastNotification,
  showMorningBriefing,
  showNotification,
  updateSettings,
  getSettings,
  getPermissionStatus,
  isSupported,
  isEnabled,
  unsubscribe
};
