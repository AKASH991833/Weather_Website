/**
 * WeatherNow - Enhanced Features Module
 * Export, Comparison, Keyboard Shortcuts, Weather Tips
 */

import { state } from './main.js';

// Export functions (global scope for onclick handlers)
window.exportAsPDF = function() {
  alert('PDF export: This feature requires html2pdf library. For now, use Print to PDF instead!');
  closeExportPanel();
};

window.exportAsImage = async function() {
  try {
    const appElement = document.querySelector('.app');
    const canvas = await html2canvas(appElement, {
      backgroundColor: '#1a1a2e',
      scale: 2
    });
    
    const link = document.createElement('a');
    link.download = `weather-${state.currentLocation.name}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    closeExportPanel();
  } catch (err) {
    console.error('Export failed:', err);
    alert('Failed to export. Please try screenshot instead.');
  }
};

window.shareWeather = async function() {
  if (navigator.share) {
    try {
      const shareData = {
        title: `Weather in ${state.currentLocation.name}`,
        text: `Current: ${state.weatherData?.current.temp}°C, ${state.weatherData?.current.description}`,
        url: window.location.href
      };
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  } else {
    // Fallback: copy to clipboard
    const text = `🌤️ Weather in ${state.currentLocation.name}\n` +
                 `Temperature: ${state.weatherData?.current.temp}°C\n` +
                 `Condition: ${state.weatherData?.current.description}\n` +
                 `Humidity: ${state.weatherData?.current.humidity}%\n` +
                 `Wind: ${state.weatherData?.current.windSpeed} km/h`;
    
    await navigator.clipboard.writeText(text);
    alert('Weather info copied to clipboard!');
  }
  closeExportPanel();
};

window.printWeather = function() {
  window.print();
  closeExportPanel();
};

window.closeExportPanel = function() {
  document.getElementById('export-panel')?.classList.remove('active');
};

window.closeComparison = function() {
  document.getElementById('comparison-view')?.classList.add('hidden');
};

// Add html2canvas dynamically when needed
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Weather Tips Generator
export function generateWeatherTips(weather) {
  if (!weather || !weather.current) return;

  const { temp, humidity, windSpeed, precipitation, uvIndex, description } = weather.current;

  // Clothing tip
  const clothingEl = document.getElementById('tip-clothing');
  if (clothingEl) {
    if (temp < 10) {
      clothingEl.textContent = 'Heavy jacket, layers';
    } else if (temp < 20) {
      clothingEl.textContent = 'Light jacket/sweater';
    } else if (temp < 30) {
      clothingEl.textContent = 'T-shirt, light clothes';
    } else {
      clothingEl.textContent = 'Light, breathable fabrics';
    }
  }

  // Outdoor activity tip
  const outdoorEl = document.getElementById('tip-outdoor');
  if (outdoorEl) {
    if (precipitation > 50 || (description && description.includes('rain'))) {
      outdoorEl.textContent = 'Not recommended';
    } else if (temp > 35 || uvIndex > 7) {
      outdoorEl.textContent = 'Avoid midday sun';
    } else {
      outdoorEl.textContent = 'Great day for outdoors!';
    }
  }

  // Sun protection tip
  const sunEl = document.getElementById('tip-sun');
  if (sunEl) {
    const uv = uvIndex || 5; // Default to moderate if not available
    if (uv <= 2) {
      sunEl.textContent = 'No protection needed';
    } else if (uv <= 5) {
      sunEl.textContent = 'Wear sunscreen SPF 30+';
    } else if (uv <= 7) {
      sunEl.textContent = 'Sunscreen + hat required';
    } else {
      sunEl.textContent = 'Avoid sun exposure';
    }
  }

  // Rain gear tip
  const rainEl = document.getElementById('tip-rain');
  if (rainEl) {
    const precip = precipitation || 0;
    if (precip > 60) {
      rainEl.textContent = 'Carry umbrella/raincoat';
    } else if (precip > 30) {
      rainEl.textContent = 'Keep umbrella handy';
    } else {
      rainEl.textContent = 'Not needed';
    }
  }
}

// UV Forecast Generator
export function generateUVForecast(daily) {
  const grid = document.getElementById('uv-forecast-grid');
  if (!grid || !daily) return;
  
  grid.innerHTML = '';
  
  const uvLevels = [
    { max: 2, label: 'Low', class: 'low' },
    { max: 5, label: 'Moderate', class: 'moderate' },
    { max: 7, label: 'High', class: 'high' },
    { max: 10, label: 'Very High', class: 'very-high' },
    { max: 11, label: 'Extreme', class: 'extreme' }
  ];
  
  // Generate 5-day UV forecast (simulated based on weather)
  for (let i = 0; i < Math.min(5, daily.length); i++) {
    const day = daily[i];
    // Simulate UV index based on weather description
    let uv = 5;
    if (day.description.toLowerCase().includes('clear') || day.description.toLowerCase().includes('sunny')) {
      uv = 7 + Math.floor(Math.random() * 4);
    } else if (day.description.toLowerCase().includes('cloud')) {
      uv = 3 + Math.floor(Math.random() * 3);
    } else if (day.description.toLowerCase().includes('rain')) {
      uv = 1 + Math.floor(Math.random() * 3);
    }
    
    const level = uvLevels.find(l => uv <= l.max) || uvLevels[uvLevels.length - 1];
    
    const uvDay = document.createElement('div');
    uvDay.className = 'uv-day';
    uvDay.innerHTML = `
      <div class="uv-day-name">${i === 0 ? 'Today' : formatDay(day.date)}</div>
      <div class="uv-value">${uv}</div>
      <div class="uv-level ${level.class}">${level.label}</div>
    `;
    grid.appendChild(uvDay);
  }
}

function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
}

// Sun Position Calculator
export function updateSunPosition(sunrise, sunset) {
  const now = new Date();
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  
  const totalDayLength = sunsetDate - sunriseDate;
  const elapsed = now - sunriseDate;
  const percentage = Math.max(0, Math.min(1, elapsed / totalDayLength));
  
  const sunPosEl = document.getElementById('current-sun-pos');
  if (sunPosEl) {
    // Calculate position along the arc
    const left = percentage * 100;
    const arcHeight = 100; // px
    const x = left;
    const y = Math.sin(percentage * Math.PI) * arcHeight;
    
    sunPosEl.style.left = `calc(${left}% - 20px)`;
    sunPosEl.style.top = `${-y}px`;
    
    // Update markers
    const sunriseMarker = document.getElementById('sunrise-marker');
    const sunsetMarker = document.getElementById('sunset-marker');
    if (sunriseMarker) sunriseMarker.textContent = formatTime(sunriseDate);
    if (sunsetMarker) sunsetMarker.textContent = formatTime(sunsetDate);
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Keyboard Shortcuts
export function setupKeyboardShortcuts(callbacks) {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    
    // Ctrl/Cmd + R: Refresh weather
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      callbacks?.onRefresh();
    }
    
    // Ctrl/Cmd + T: Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      callbacks?.onThemeToggle();
    }
    
    // Ctrl/Cmd + U: Toggle unit
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      callbacks?.onUnitToggle();
    }
    
    // Escape: Close panels
    if (e.key === 'Escape') {
      closeExportPanel();
      closeComparison();
      document.getElementById('search-input')?.blur();
    }
    
    // Alt + C: Compare cities
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      callbacks?.onCompare();
    }
    
    // Alt + E: Export
    if (e.altKey && e.key === 'e') {
      e.preventDefault();
      document.getElementById('export-panel')?.classList.add('active');
    }
  });
}

// Comparison Feature
export function showComparison(city1, city2) {
  const container = document.getElementById('comparison-view');
  if (!container) return;
  
  document.getElementById('compare-city-1').textContent = city1.name;
  document.getElementById('compare-temp-1').textContent = `${city1.temp}°`;
  document.getElementById('compare-city-2').textContent = city2.name;
  document.getElementById('compare-temp-2').textContent = `${city2.temp}°`;
  
  const diff = city1.temp - city2.temp;
  const diffEl = document.getElementById('compare-diff');
  
  if (diff > 0) {
    diffEl.textContent = `${city1.name} is ${diff}° hotter`;
    diffEl.className = 'comparison-diff hotter';
  } else if (diff < 0) {
    diffEl.textContent = `${city1.name} is ${Math.abs(diff)}° colder`;
    diffEl.className = 'comparison-diff colder';
  } else {
    diffEl.textContent = 'Same temperature!';
    diffEl.className = 'comparison-diff';
  }
  
  container.classList.remove('hidden');
}

// Alert System
export function showWeatherAlerts(alerts) {
  const container = document.getElementById('weather-alerts');
  const alertsContainer = document.getElementById('alerts-container');
  
  if (!container || !alertsContainer) return;
  
  if (!alerts || alerts.length === 0) {
    container.classList.add('hidden');
    return;
  }
  
  container.classList.remove('hidden');
  alertsContainer.innerHTML = '';
  
  alerts.forEach(alert => {
    const alertEl = document.createElement('div');
    alertEl.className = `alert-item ${alert.severity || 'warning'}`;
    alertEl.innerHTML = `
      <div class="alert-icon">${alert.icon || '⚠️'}</div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-description">${alert.description}</div>
        ${alert.time ? `<div class="alert-time">${alert.time}</div>` : ''}
      </div>
    `;
    alertsContainer.appendChild(alertEl);
  });
}

export default {
  generateWeatherTips,
  generateUVForecast,
  updateSunPosition,
  setupKeyboardShortcuts,
  showComparison,
  showWeatherAlerts,
  loadHtml2Canvas
};
