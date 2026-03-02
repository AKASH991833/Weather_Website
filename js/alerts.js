/**
 * WeatherNow - Weather Alerts Module
 * 
 * Displays severe weather warnings and alerts
 * Features: Real-time alerts, visual warnings, auto-refresh
 */

import CONFIG from './config.js';

// Alert severity levels
const ALERT_SEVERITY = {
  EXTREME: { level: 4, color: 'alert-extreme', icon: '☠️', bg: 'linear-gradient(135deg, #7c2d12, #dc2626)' },
  SEVERE: { level: 3, color: 'alert-severe', icon: '⚠️', bg: 'linear-gradient(135deg, #dc2626, #ef4444)' },
  MODERATE: { level: 2, color: 'alert-moderate', icon: '⚡', bg: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  MINOR: { level: 1, color: 'alert-minor', icon: 'ℹ️', bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }
};

// Alert state
let currentAlerts = [];
let alertCheckInterval = null;
const ALERT_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Initialize weather alerts system
 */
export function initAlerts() {
  console.log('🌩️ Weather Alerts initialized');
  
  // Start periodic alert checking
  startAlertMonitoring();
  
  // Check alerts immediately
  checkForAlerts();
}

/**
 * Start periodic alert monitoring
 */
function startAlertMonitoring() {
  if (alertCheckInterval) {
    clearInterval(alertCheckInterval);
  }
  
  alertCheckInterval = setInterval(() => {
    checkForAlerts();
  }, ALERT_CHECK_INTERVAL);
}

/**
 * Stop alert monitoring
 */
export function stopAlertMonitoring() {
  if (alertCheckInterval) {
    clearInterval(alertCheckInterval);
    alertCheckInterval = null;
  }
}

/**
 * Check for weather alerts
 * Note: OneCall API 3.0 requires paid subscription. Using fallback.
 */
export async function checkForAlerts(lat, lon) {
  if (!lat || !lon) {
    console.log('⚠️ No coordinates provided for alerts check');
    return [];
  }
  
  try {
    // OneCall API 3.0 is paid-only, skipping alerts for free tier
    // In production, use backend proxy with paid API key
    console.log('ℹ️ Weather alerts require paid OneCall API subscription');
    
    // Return empty alerts (no error)
    currentAlerts = [];
    updateAlertsUI([]);
    
    return [];
  } catch (error) {
    console.log('⚠️ Alerts check skipped (free API tier)');
    return [];
  }
}

/**
 * Get severity level from sender name or event type
 */
function getSeverityLevel(senderName) {
  if (!senderName) return 1;
  
  const name = senderName.toLowerCase();
  
  if (name.includes('extreme') || name.includes('emergency')) return 4;
  if (name.includes('severe') || name.includes('warning')) return 3;
  if (name.includes('watch') || name.includes('advisory')) return 2;
  return 1;
}

/**
 * Update alerts UI
 */
function updateAlertsUI(alerts) {
  const alertsSection = document.getElementById('weather-alerts');
  const alertsContainer = document.getElementById('alerts-container');
  
  if (!alertsSection || !alertsContainer) {
    console.warn('⚠️ Alerts section not found in DOM');
    return;
  }
  
  // Clear previous alerts
  alertsContainer.innerHTML = '';
  
  if (!alerts || alerts.length === 0) {
    // No alerts - hide section
    alertsSection.classList.add('hidden');
    return;
  }
  
  // Show alerts section
  alertsSection.classList.remove('hidden');
  
  // Render each alert
  alerts.forEach((alert, index) => {
    const alertCard = createAlertCard(alert, index);
    alertsContainer.appendChild(alertCard);
  });
  
  // Animate alerts in
  setTimeout(() => {
    alertsSection.classList.add('active');
  }, 100);
}

/**
 * Create alert card element
 */
function createAlertCard(alert, index) {
  const card = document.createElement('div');
  card.className = 'alert-card';
  card.style.animationDelay = `${index * 0.1}s`;
  
  const severity = getAlertSeverity(alert);
  
  card.innerHTML = `
    <div class="alert-header" style="background: ${severity.bg}">
      <span class="alert-icon">${severity.icon}</span>
      <div class="alert-title">
        <strong>${escapeHtml(alert.event || 'Weather Alert')}</strong>
        <span class="alert-sender">${escapeHtml(alert.sender_name || 'Unknown')}</span>
      </div>
    </div>
    <div class="alert-body">
      <div class="alert-description">${escapeHtml(alert.description || 'No description available')}</div>
      <div class="alert-meta">
        <div class="alert-time">
          <span class="meta-label">Issued:</span>
          <span class="meta-value">${formatAlertTime(alert.start)}</span>
        </div>
        <div class="alert-time">
          <span class="meta-label">Expires:</span>
          <span class="meta-value">${formatAlertTime(alert.end)}</span>
        </div>
      </div>
    </div>
    ${alert.tags && alert.tags.length > 0 ? `
      <div class="alert-tags">
        ${alert.tags.map(tag => `<span class="alert-tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    ` : ''}
  `;
  
  return card;
}

/**
 * Get alert severity info
 */
function getAlertSeverity(alert) {
  const severity = getSeverityLevel(alert.sender_name);
  
  switch (severity) {
    case 4: return ALERT_SEVERITY.EXTREME;
    case 3: return ALERT_SEVERITY.SEVERE;
    case 2: return ALERT_SEVERITY.MODERATE;
    default: return ALERT_SEVERITY.MINOR;
  }
}

/**
 * Format alert timestamp
 */
function formatAlertTime(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show notification for severe alerts
 */
function showSevereAlertNotification(alerts) {
  // Import UI module if available
  const showNotification = async () => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('⚠️ Notifications not supported');
      return;
    }
    
    // Request permission if needed
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
      alerts.forEach(alert => {
        new Notification('⚠️ Severe Weather Alert', {
          body: `${alert.event}: ${alert.description?.substring(0, 100)}...`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          tag: `alert-${alert.event}`,
          requireInteraction: true
        });
      });
    }
  };
  
  showNotification();
}

/**
 * Get current alerts
 */
export function getCurrentAlerts() {
  return currentAlerts;
}

/**
 * Clear all alerts
 */
export function clearAlerts() {
  currentAlerts = [];
  updateAlertsUI([]);
}

/**
 * Get alert count
 */
export function getAlertCount() {
  return currentAlerts.length;
}

/**
 * Check if there are severe alerts
 */
export function hasSevereAlerts() {
  return currentAlerts.some(alert => getSeverityLevel(alert.sender_name) >= 3);
}

export default {
  initAlerts,
  checkForAlerts,
  stopAlertMonitoring,
  getCurrentAlerts,
  clearAlerts,
  getAlertCount,
  hasSevereAlerts
};
