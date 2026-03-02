/**
 * WeatherNow - Advanced Features Module
 * 
 * Features:
 * - Social sharing
 * - City comparison
 * - PDF export
 * - Multi-language support
 */

import CONFIG from './config.js';

// Multi-language translations
const translations = {
  en: {
    weatherNow: 'WeatherNow',
    search: 'Search city, coordinates, or postal code...',
    currentWeather: 'Current Weather',
    forecast: '7-Day Forecast',
    hourly: 'Next 24 Hours',
    airQuality: 'Air Quality',
    details: 'Weather Details',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    feelsLike: 'Feels Like',
    visibility: 'Visibility',
    pressure: 'Pressure',
    uvIndex: 'UV Index',
    precipitation: 'Precipitation',
    dewPoint: 'Dew Point',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    moonPhase: 'Moon Phase',
    loading: 'Loading weather...',
    error: 'Error loading data',
    share: 'Share Weather',
    compare: 'Compare Cities',
    export: 'Export',
    print: 'Print',
    saveAsImage: 'Save as Image',
    saveAsPDF: 'Save as PDF',
    language: 'Language'
  },
  es: {
    weatherNow: 'WeatherNow',
    search: 'Buscar ciudad, coordenadas o código postal...',
    currentWeather: 'Clima Actual',
    forecast: 'Pronóstico de 7 Días',
    hourly: 'Próximas 24 Horas',
    airQuality: 'Calidad del Aire',
    details: 'Detalles del Clima',
    humidity: 'Humedad',
    windSpeed: 'Velocidad del Viento',
    feelsLike: 'Sensación Térmica',
    visibility: 'Visibilidad',
    pressure: 'Presión',
    uvIndex: 'Índice UV',
    precipitation: 'Precipitación',
    dewPoint: 'Punto de Rocío',
    sunrise: 'Amanecer',
    sunset: 'Atardecer',
    moonPhase: 'Fase Lunar',
    loading: 'Cargando clima...',
    error: 'Error al cargar datos',
    share: 'Compartir Clima',
    compare: 'Comparar Ciudades',
    export: 'Exportar',
    print: 'Imprimir',
    saveAsImage: 'Guardar como Imagen',
    saveAsPDF: 'Guardar como PDF',
    language: 'Idioma'
  },
  fr: {
    weatherNow: 'WeatherNow',
    search: 'Rechercher ville, coordonnées ou code postal...',
    currentWeather: 'Météo Actuelle',
    forecast: 'Prévisions sur 7 Jours',
    hourly: 'Prochaines 24 Heures',
    airQuality: 'Qualité de l\'Air',
    details: 'Détails Météo',
    humidity: 'Humidité',
    windSpeed: 'Vitesse du Vent',
    feelsLike: 'Ressenti',
    visibility: 'Visibilité',
    pressure: 'Pression',
    uvIndex: 'Indice UV',
    precipitation: 'Précipitation',
    dewPoint: 'Point de Rosée',
    sunrise: 'Lever du Soleil',
    sunset: 'Coucher du Soleil',
    moonPhase: 'Phase Lunaire',
    loading: 'Chargement météo...',
    error: 'Erreur de chargement',
    share: 'Partager Météo',
    compare: 'Comparer Villes',
    export: 'Exporter',
    print: 'Imprimer',
    saveAsImage: 'Sauvegarder en Image',
    saveAsPDF: 'Sauvegarder en PDF',
    language: 'Langue'
  },
  de: {
    weatherNow: 'WeatherNow',
    search: 'Stadt, Koordinaten oder Postleitzahl suchen...',
    currentWeather: 'Aktuelles Wetter',
    forecast: '7-Tage Vorhersage',
    hourly: 'Nächste 24 Stunden',
    airQuality: 'Luftqualität',
    details: 'Wetterdetails',
    humidity: 'Luftfeuchtigkeit',
    windSpeed: 'Windgeschwindigkeit',
    feelsLike: 'Gefühlt',
    visibility: 'Sichtweite',
    pressure: 'Luftdruck',
    uvIndex: 'UV-Index',
    precipitation: 'Niederschlag',
    dewPoint: 'Taupunkt',
    sunrise: 'Sonnenaufgang',
    sunset: 'Sonnenuntergang',
    moonPhase: 'Mondphase',
    loading: 'Wetter wird geladen...',
    error: 'Fehler beim Laden',
    share: 'Wetter Teilen',
    compare: 'Städte Vergleichen',
    export: 'Exportieren',
    print: 'Drucken',
    saveAsImage: 'Als Bild Speichern',
    saveAsPDF: 'Als PDF Speichern',
    language: 'Sprache'
  },
  hi: {
    weatherNow: 'WeatherNow',
    search: 'शहर, निर्देशांक या पिन कोड खोजें...',
    currentWeather: 'वर्तमान मौसम',
    forecast: '7 दिन का पूर्वानुमान',
    hourly: 'अगले 24 घंटे',
    airQuality: 'वायु गुणवत्ता',
    details: 'मौसम विवरण',
    humidity: 'आर्द्रता',
    windSpeed: 'हवा की गति',
    feelsLike: 'महसूस होता है',
    visibility: 'दृश्यता',
    pressure: 'दबाव',
    uvIndex: 'UV इंडेक्स',
    precipitation: 'वर्षा',
    dewPoint: 'ओसांक',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    moonPhase: 'चंद्र चरण',
    loading: 'मौसम लोड हो रहा है...',
    error: 'डेटा लोड करने में त्रुटि',
    share: 'मौसम साझा करें',
    compare: 'शहरों की तुलना',
    export: 'निर्यात',
    print: 'प्रिंट',
    saveAsImage: 'छवि के रूप में सहेजें',
    saveAsPDF: 'PDF के रूप में सहेजें',
    language: 'भाषा'
  },
  zh: {
    weatherNow: 'WeatherNow',
    search: '搜索城市、坐标或邮政编码...',
    currentWeather: '当前天气',
    forecast: '7 天预报',
    hourly: '未来 24 小时',
    airQuality: '空气质量',
    details: '天气详情',
    humidity: '湿度',
    windSpeed: '风速',
    feelsLike: '体感温度',
    visibility: '能见度',
    pressure: '气压',
    uvIndex: '紫外线指数',
    precipitation: '降水量',
    dewPoint: '露点',
    sunrise: '日出',
    sunset: '日落',
    moonPhase: '月相',
    loading: '正在加载天气...',
    error: '加载数据错误',
    share: '分享天气',
    compare: '比较城市',
    export: '导出',
    print: '打印',
    saveAsImage: '保存为图片',
    saveAsPDF: '保存为 PDF',
    language: '语言'
  }
};

// Current language
let currentLanguage = 'en';

/**
 * Initialize advanced features
 */
export function initAdvancedFeatures() {
  console.log('🚀 Advanced Features initialized');
  
  // Load saved language
  loadLanguage();
  
  // Setup feature buttons
  setupFeatureButtons();
}

/**
 * Setup feature buttons
 */
function setupFeatureButtons() {
  // Social share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareWeather);
  }
  
  // Compare button (if exists)
  const compareBtn = document.getElementById('compare-btn');
  if (compareBtn) {
    compareBtn.addEventListener('click', showCityComparison);
  }
}

/**
 * Share weather on social media
 */
export async function shareWeather() {
  try {
    // Get current weather data from state or DOM
    const cityName = document.getElementById('city-name')?.textContent || 'Current Location';
    const temp = document.getElementById('current-temp')?.textContent || '--';
    const description = document.getElementById('weather-description')?.textContent || '--';
    
    const shareText = `🌤️ ${cityName}\n${description}\nTemperature: ${temp}°\n\nCheck live weather at:`;
    const shareUrl = window.location.href;
    
    // Check if Web Share API is supported
    if (navigator.share) {
      await navigator.share({
        title: 'WeatherNow - Current Weather',
        text: shareText,
        url: shareUrl
      });
    } else {
      // Fallback: Copy to clipboard
      const fullText = `${shareText}\n${shareUrl}`;
      await navigator.clipboard.writeText(fullText);
      
      // Show success message
      showShareSuccess();
    }
    
    console.log('✅ Weather shared successfully');
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('❌ Share failed:', error);
    }
  }
}

/**
 * Show share success message
 */
function showShareSuccess() {
  // Import UI if available
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.innerHTML = `
    <span class="toast-icon">✅</span>
    <span class="toast-message">Weather copied to clipboard!</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('active');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show city comparison UI
 */
export function showCityComparison() {
  const comparisonView = document.getElementById('comparison-view');
  
  if (!comparisonView) {
    console.warn('⚠️ Comparison view not found');
    return;
  }
  
  comparisonView.classList.add('active');
  
  // Get current city data
  const currentCity = {
    name: document.getElementById('city-name')?.textContent || 'City 1',
    temp: document.getElementById('current-temp')?.textContent || '--'
  };
  
  // Update comparison UI
  const city1Element = document.getElementById('compare-city-1');
  const temp1Element = document.getElementById('compare-temp-1');
  
  if (city1Element) city1Element.textContent = currentCity.name;
  if (temp1Element) temp1Element.textContent = `${currentCity.temp}°`;
  
  console.log('📊 Comparison view opened');
}

/**
 * Close comparison view
 */
export function closeComparison() {
  const comparisonView = document.getElementById('comparison-view');
  if (comparisonView) {
    comparisonView.classList.remove('active');
  }
}

/**
 * Export weather as PDF
 */
export async function exportAsPDF() {
  try {
    console.log('📄 Exporting as PDF...');
    
    // Check if html2canvas and jsPDF are available
    if (typeof html2canvas === 'undefined') {
      console.error('❌ html2canvas not loaded');
      alert('PDF export requires html2canvas library');
      return;
    }
    
    // Import jsPDF dynamically
    const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    
    // Capture weather content
    const weatherContent = document.querySelector('.hero') || document.body;
    
    const canvas = await html2canvas(weatherContent, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
    pdf.save('weather-now.pdf');
    
    console.log('✅ PDF exported successfully');
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    alert('Failed to export PDF. Please try again.');
  }
}

/**
 * Export weather as image
 */
export async function exportAsImage() {
  try {
    console.log('📷 Exporting as image...');
    
    if (typeof html2canvas === 'undefined') {
      console.error('❌ html2canvas not loaded');
      alert('Image export requires html2canvas library');
      return;
    }
    
    // Capture weather content
    const weatherContent = document.querySelector('.hero') || document.body;
    
    const canvas = await html2canvas(weatherContent, {
      scale: 2,
      backgroundColor: '#667eea',
      logging: false
    });
    
    // Download image
    const link = document.createElement('a');
    link.download = `weather-now-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('✅ Image exported successfully');
  } catch (error) {
    console.error('❌ Image export failed:', error);
    alert('Failed to export image. Please try again.');
  }
}

/**
 * Print weather
 */
export function printWeather() {
  console.log('🖨️ Printing weather...');
  window.print();
}

/**
 * Close export panel
 */
export function closeExportPanel() {
  const exportPanel = document.getElementById('export-panel');
  if (exportPanel) {
    exportPanel.classList.remove('active');
  }
}

/**
 * Show export panel
 */
export function showExportPanel() {
  const exportPanel = document.getElementById('export-panel');
  if (exportPanel) {
    exportPanel.classList.add('active');
  }
}

/**
 * Change language
 */
export function setLanguage(lang) {
  if (!translations[lang]) {
    console.error('❌ Language not supported:', lang);
    return;
  }
  
  currentLanguage = lang;
  localStorage.setItem('weathernow:language', lang);
  
  applyTranslations();
  
  console.log(`🌍 Language changed to: ${lang}`);
}

/**
 * Load saved language
 */
function loadLanguage() {
  const saved = localStorage.getItem('weathernow:language');
  if (saved && translations[saved]) {
    currentLanguage = saved;
    applyTranslations();
  }
}

/**
 * Apply translations to UI
 */
function applyTranslations() {
  const t = translations[currentLanguage];
  
  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (t[key]) {
      element.textContent = t[key];
    }
  });
  
  // Update search placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = t.search;
  }
  
  // Update document title
  document.title = `${t.weatherNow} - ${t.currentWeather}`;
}

/**
 * Get current language
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Get translation
 */
export function t(key) {
  return translations[currentLanguage][key] || key;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages() {
  return [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'zh', name: 'Chinese', native: '中文' }
  ];
}

// Expose functions globally
window.showExportPanel = showExportPanel;
window.closeExportPanel = closeExportPanel;
window.printWeather = printWeather;
window.exportAsImage = exportAsImage;
window.exportAsPDF = exportAsPDF;
window.closeComparison = closeComparison;

export default {
  initAdvancedFeatures,
  shareWeather,
  showCityComparison,
  closeComparison,
  exportAsPDF,
  exportAsImage,
  printWeather,
  showExportPanel,
  closeExportPanel,
  setLanguage,
  getCurrentLanguage,
  t,
  getSupportedLanguages
};
