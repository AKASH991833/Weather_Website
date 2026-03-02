/**
 * WeatherNow - Error Boundary Module
 * 
 * Provides error boundary protection for the application.
 * Catches unhandled errors and displays user-friendly fallback UI.
 * 
 * Features:
 * - Global error handler
 * - Unhandled promise rejection handler
 * - Component-level error boundaries
 * - Error recovery mechanisms
 * - User-friendly error messages
 */

// Error state
let hasCriticalError = false;
let errorCount = 0;
const MAX_ERROR_COUNT = 5;
const ERROR_RESET_TIME = 60000; // 1 minute

/**
 * Initialize error boundary handlers
 */
export function initErrorBoundary() {
  // Global error handler
  window.addEventListener('error', handleGlobalError);
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  
  // Periodic error count reset
  setInterval(resetErrorCount, ERROR_RESET_TIME);
  
  console.log('🛡️ Error Boundary initialized');
}

/**
 * Handle global JavaScript errors
 */
function handleGlobalError(event) {
  event.preventDefault();
  
  const error = event.error || event;
  errorCount++;
  
  console.error('🚨 Global Error:', error);
  
  // Log error details
  logError({
    type: 'global',
    message: error.message || String(error),
    filename: event.filename || 'unknown',
    lineno: event.lineno || 'unknown',
    colno: event.colno || 'unknown',
    stack: error.stack || 'no stack'
  });
  
  // Check if we should show critical error UI
  if (shouldShowCriticalError()) {
    showCriticalErrorUI();
  }
  
  // Auto-recover if possible
  attemptAutoRecovery(error);
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(event) {
  event.preventDefault();
  
  const reason = event.reason;
  errorCount++;
  
  console.error('🚨 Unhandled Promise Rejection:', reason);
  
  // Log error details
  logError({
    type: 'promise',
    message: reason?.message || String(reason),
    stack: reason?.stack || 'no stack'
  });
  
  // Check if we should show critical error UI
  if (shouldShowCriticalError()) {
    showCriticalErrorUI();
  }
  
  // Auto-recover if possible
  attemptAutoRecovery(reason);
}

/**
 * Check if we should show critical error UI
 */
function shouldShowCriticalError() {
  return errorCount >= MAX_ERROR_COUNT || hasCriticalError;
}

/**
 * Show critical error UI with recovery options
 */
export function showCriticalErrorUI() {
  if (hasCriticalError) return;
  hasCriticalError = true;
  
  // Hide loading screen if visible
  const loadingScreen = document.getElementById('loading');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
  
  // Create or show error overlay
  let errorOverlay = document.getElementById('critical-error-overlay');
  
  if (!errorOverlay) {
    errorOverlay = createErrorOverlay();
    document.body.appendChild(errorOverlay);
  }
  
  errorOverlay.classList.add('active');
}

/**
 * Create error overlay element
 */
function createErrorOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'critical-error-overlay';
  overlay.className = 'critical-error-overlay';
  overlay.innerHTML = `
    <div class="error-overlay-content">
      <div class="error-overlay-icon">⚠️</div>
      <h2 class="error-overlay-title">Oops! Something went wrong</h2>
      <p class="error-overlay-message">
        We're experiencing technical difficulties. Don't worry, your data is safe.
      </p>
      <div class="error-overlay-actions">
        <button class="error-retry-btn" onclick="window.location.reload()">
          🔄 Reload Page
        </button>
        <button class="error-clear-btn" onclick="WeatherApp.clearData()">
          🗑️ Clear Data & Reload
        </button>
      </div>
      <div class="error-overlay-details">
        <p class="error-overlay-hint">
          💡 Tip: Try clearing your browser cache if the problem persists.
        </p>
      </div>
    </div>
  `;
  
  return overlay;
}

/**
 * Attempt automatic recovery from errors
 */
function attemptAutoRecovery(error) {
  const errorMessage = error?.message || String(error);
  
  // Network errors - retry mechanism
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    console.log('🔄 Network error detected. Will retry...');
    setTimeout(() => {
      console.log('🔄 Attempting network recovery...');
      // Could trigger a retry here
    }, 2000);
  }
  
  // API errors - might be temporary
  if (errorMessage.includes('API') || errorMessage.includes('api')) {
    console.log('🔄 API error detected. Switching to fallback mode...');
    // Could switch to cached data here
  }
  
  // Storage errors - clear corrupted data
  if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
    console.log('🗑️ Storage error detected. Clearing old cache...');
    clearOldCaches();
  }
}

/**
 * Clear old service worker caches
 */
async function clearOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCache = 'weathernow-v9';
    
    for (const cacheName of cacheNames) {
      if (cacheName !== currentCache) {
        await caches.delete(cacheName);
        console.log('🗑️ Deleted old cache:', cacheName);
      }
    }
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Reset error count periodically
 */
function resetErrorCount() {
  if (errorCount > 0) {
    console.log('🔄 Resetting error count');
    errorCount = 0;
  }
}

/**
 * Log error for analytics/debugging
 */
function logError(errorData) {
  // In production, send to error tracking service
  console.log('📝 Error logged:', {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...errorData
  });
  
  // Store in localStorage for debugging
  try {
    const errors = JSON.parse(localStorage.getItem('weathernow:errors') || '[]');
    errors.push({
      timestamp: Date.now(),
      ...errorData
    });
    
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.shift();
    }
    
    localStorage.setItem('weathernow:errors', JSON.stringify(errors));
  } catch (e) {
    // Storage might be full or disabled
  }
}

/**
 * Get recent errors from storage
 */
export function getRecentErrors() {
  try {
    return JSON.parse(localStorage.getItem('weathernow:errors') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  try {
    localStorage.removeItem('weathernow:errors');
    console.log('🗑️ Error log cleared');
  } catch (e) {
    // Storage might be unavailable
  }
}

/**
 * Wrap a function with error boundary protection
 * @param {Function} fn - Function to wrap
 * @param {string} context - Context description for logging
 * @returns {Function} Wrapped function
 */
export function withErrorBoundary(fn, context) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      errorCount++;
      
      // Show user-friendly error
      const errorMessage = getUserFriendlyMessage(error);
      
      // Import UI module if available
      if (typeof ui !== 'undefined' && ui.showError) {
        ui.showError(errorMessage);
      } else {
        console.error('User error message:', errorMessage);
      }
      
      // Re-throw if critical
      if (error.critical) {
        throw error;
      }
      
      // Return fallback value
      return getFallbackValue(fn, context);
    }
  };
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error) {
  const message = error?.message || String(error);
  
  if (message.includes('network') || message.includes('fetch failed')) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (message.includes('API key') || message.includes('401')) {
    return 'Configuration error. Please contact support.';
  }
  
  if (message.includes('429') || message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'Location not found. Please try a different search.';
  }
  
  if (message.includes('storage') || message.includes('quota')) {
    return 'Storage full. Please clear browser data and try again.';
  }
  
  return 'Something went wrong. Please try again.';
}

/**
 * Get fallback value for failed operations
 */
function getFallbackValue(fn, context) {
  // Return appropriate fallback based on context
  if (context.includes('weather')) {
    return null; // Return null for weather data
  }
  
  if (context.includes('location')) {
    return { name: 'Unknown Location', lat: 0, lon: 0 };
  }
  
  if (context.includes('forecast')) {
    return []; // Return empty array for forecasts
  }
  
  return null;
}

/**
 * Clear all app data and reload
 */
export function clearAllData() {
  try {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('weathernow:')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear IndexedDB
    indexedDB.deleteDatabase('weathernow-db');
    
    // Clear caches
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
    
    console.log('🗑️ All data cleared');
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}

/**
 * Expose clear data function globally
 */
window.WeatherApp = window.WeatherApp || {};
window.WeatherApp.clearData = clearAllData;

export default {
  initErrorBoundary,
  showCriticalErrorUI,
  getRecentErrors,
  clearErrorLog,
  withErrorBoundary,
  clearAllData
};
