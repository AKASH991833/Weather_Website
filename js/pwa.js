/**
 * WeatherNow - PWA Module
 * Install prompt, offline detection, update notifications
 */

let deferredPrompt = null;
let swRegistration = null;

// Elements
let installContainer = null;
let installBtn = null;
let installDismiss = null;
let offlineIndicator = null;
let updateBtn = null;

export function initPWA() {
  createPWAElements();
  registerServiceWorker();
  setupInstallPrompt();
  setupOfflineDetection();
  checkForUpdates();
}

function createPWAElements() {
  // Install Prompt Banner
  installContainer = document.createElement('div');
  installContainer.id = 'install-prompt';
  installContainer.className = 'install-prompt';
  installContainer.innerHTML = `
    <div class="install-prompt-content">
      <div class="install-prompt-icon">🌤️</div>
      <div class="install-prompt-text">
        <strong>Install WeatherNow</strong>
        <span>Get quick access to weather updates</span>
      </div>
      <button class="install-btn">Install</button>
      <button class="install-dismiss">×</button>
    </div>
  `;
  document.body.appendChild(installContainer);

  installBtn = installContainer.querySelector('.install-btn');
  installDismiss = installContainer.querySelector('.install-dismiss');

  installBtn.addEventListener('click', installApp);
  installDismiss.addEventListener('click', dismissInstallPrompt);

  // Offline Indicator
  offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'offline-indicator';
  offlineIndicator.className = 'offline-indicator';
  offlineIndicator.innerHTML = `
    <span class="offline-icon">📡</span>
    <span class="offline-text">You're offline - Showing cached data</span>
  `;
  document.body.appendChild(offlineIndicator);

  // Update Available Button
  updateBtn = document.createElement('button');
  updateBtn.id = 'update-btn';
  updateBtn.className = 'update-btn';
  updateBtn.innerHTML = `
    <span class="update-icon">🔄</span>
    <span>Update Available</span>
  `;
  updateBtn.addEventListener('click', updateApp);
  document.body.appendChild(updateBtn);
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
    installContainer?.classList.remove('active');
    trackInstall();
  });
}

function showInstallPrompt() {
  const hasDismissed = localStorage.getItem('weathernow:install-dismissed');
  const dismissedAt = hasDismissed ? parseInt(hasDismissed) : 0;
  const daysToWait = 7;
  const msToWait = daysToWait * 24 * 60 * 60 * 1000;

  if (Date.now() - dismissedAt < msToWait) {
    return;
  }

  setTimeout(() => {
    installContainer?.classList.add('active');
  }, 5000); // Show after 5 seconds
}

function dismissInstallPrompt() {
  installContainer?.classList.remove('active');
  localStorage.setItem('weathernow:install-dismissed', Date.now().toString());
}

async function installApp() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log('[PWA] Install prompt outcome:', outcome);
  deferredPrompt = null;
  
  if (outcome === 'accepted') {
    installContainer?.classList.remove('active');
  }
}

function trackInstall() {
  // Analytics could go here
  console.log('[PWA] Installation tracked');
}

async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service Worker registered:', swRegistration.scope);

      // Check for updates
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateButton();
          }
        });
      });

    } catch (error) {
      console.error('[PWA] SW registration failed:', error);
    }
  }
}

function setupOfflineDetection() {
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      offlineIndicator?.classList.remove('active');
    } else {
      offlineIndicator?.classList.add('active');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
}

function checkForUpdates() {
  if (swRegistration) {
    swRegistration.update();
  }
}

function showUpdateButton() {
  updateBtn?.classList.add('active');
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    updateBtn?.classList.remove('active');
  }, 10000);
}

async function updateApp() {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function getInstallStatus() {
  return {
    isInstalled: isInstalled(),
    hasPrompt: deferredPrompt !== null,
    serviceWorkerActive: swRegistration?.active !== undefined
  };
}

export default {
  initPWA,
  isInstalled,
  getInstallStatus
};
