/**
 * WeatherNow - Advanced Weather Animations Module
 * Pro-level realistic weather effects
 */

class WeatherAnimations {
  constructor() {
    this.elements = {
      rainContainer: document.getElementById('rain-container'),
      snowContainer: document.getElementById('snow-container'),
      fogContainer: document.getElementById('fog-container'),
      windParticles: document.getElementById('wind-particles'),
      sunRays: document.getElementById('sun-rays'),
      cloudsContainer: document.getElementById('clouds-container'),
      dustParticles: document.getElementById('dust-particles'),
      heatWaves: document.getElementById('heat-waves'),
      aurora: document.getElementById('aurora'),
      shootingStars: document.getElementById('shooting-stars'),
      lightningFlash: document.getElementById('lightning-flash'),
      lightningBolt: document.getElementById('lightning-bolt'),
      weatherBg: document.getElementById('weather-bg')
    };
    
    this.activeAnimations = new Set();
    this.isNight = false;
  }

  // Initialize all animations based on weather
  init(weatherData) {
    this.isNight = this.checkIfNight(weatherData?.current?.timestamp);
    this.updateAnimations(weatherData);
  }

  checkIfNight(timestamp) {
    if (!timestamp) return false;
    const hour = new Date(timestamp).getHours();
    return hour < 6 || hour > 18;
  }

  // Main update function
  updateAnimations(weatherData) {
    if (!weatherData || !weatherData.current) return;

    const { iconId, description } = weatherData.current;
    const desc = description.toLowerCase();

    // Clear all animations first
    this.clearAllAnimations();

    // Determine weather type and apply animations
    if (this.isThunderstorm(iconId, desc)) {
      this.startThunderstorm();
    } else if (this.isRain(iconId, desc)) {
      this.startRain(this.getRainIntensity(desc));
    } else if (this.isSnow(iconId, desc)) {
      this.startSnow(this.getSnowIntensity(desc));
    } else if (this.isFog(desc)) {
      this.startFog();
    } else if (this.isWindy(weatherData.current.windSpeed)) {
      this.startWind();
    } else if (this.isClear(iconId, desc)) {
      if (this.isNight) {
        this.startClearNight();
      } else {
        this.startSunny();
      }
    } else if (this.isCloudy(iconId, desc)) {
      this.startCloudy();
    }

    // Add weather-specific background
    this.updateWeatherBackground(iconId, desc);
  }

  // Weather Type Checkers
  isThunderstorm(iconId, desc) {
    return (iconId >= 200 && iconId < 300) || 
           desc.includes('thunder') || 
           desc.includes('storm');
  }

  isRain(iconId, desc) {
    return (iconId >= 300 && iconId < 600) || 
           desc.includes('rain') || 
           desc.includes('drizzle');
  }

  isSnow(iconId, desc) {
    return (iconId >= 600 && iconId < 700) || 
           desc.includes('snow');
  }

  isFog(desc) {
    return desc.includes('fog') || desc.includes('mist') || desc.includes('haze');
  }

  isWindy(windSpeed) {
    return windSpeed > 20; // km/h
  }

  isClear(iconId, desc) {
    return iconId === 800 || desc.includes('clear');
  }

  isCloudy(iconId, desc) {
    return (iconId >= 801 && iconId <= 804) || 
           desc.includes('cloud');
  }

  // Intensity Getters
  getRainIntensity(desc) {
    if (desc.includes('heavy') || desc.includes('shower')) return 'heavy';
    if (desc.includes('light') || desc.includes('drizzle')) return 'light';
    return 'normal';
  }

  getSnowIntensity(desc) {
    if (desc.includes('heavy')) return 'heavy';
    if (desc.includes('light')) return 'light';
    return 'normal';
  }

  // Clear all animations
  clearAllAnimations() {
    this.stopRain();
    this.stopSnow();
    this.stopFog();
    this.stopWind();
    this.stopSunRays();
    this.stopClouds();
    this.stopDust();
    this.stopHeatWaves();
    this.stopAurora();
    this.stopShootingStars();
    this.stopLightning();
    
    // Reset background
    if (this.elements.weatherBg) {
      this.elements.weatherBg.className = 'weather-bg';
    }
  }

  // ============================================
  // Thunderstorm Animation
  // ============================================
  startThunderstorm() {
    if (this.elements.weatherBg) {
      this.elements.weatherBg.classList.add('stormy');
    }
    
    // Start rain
    this.startRain('heavy');
    
    // Start lightning
    this.startLightning();
    
    // Add wind
    this.startWind('storm');
  }

  startLightning() {
    if (this.elements.lightningFlash) {
      this.elements.lightningFlash.style.display = 'block';
    }
    if (this.elements.lightningBolt) {
      this.elements.lightningBolt.style.display = 'block';
    }
    this.activeAnimations.add('lightning');
  }

  stopLightning() {
    if (this.elements.lightningFlash) {
      this.elements.lightningFlash.style.display = 'none';
    }
    if (this.elements.lightningBolt) {
      this.elements.lightningBolt.style.display = 'none';
    }
    this.activeAnimations.delete('lightning');
  }

  // ============================================
  // Rain Animation
  // ============================================
  startRain(intensity = 'normal') {
    if (!this.elements.rainContainer) return;
    
    this.elements.rainContainer.innerHTML = '';
    this.elements.rainContainer.style.display = 'block';
    
    const count = intensity === 'heavy' ? 100 : intensity === 'light' ? 30 : 60;
    
    for (let i = 0; i < count; i++) {
      this.createRaindrop(intensity);
    }
    
    // Add splashes for heavy rain
    if (intensity === 'heavy') {
      this.createRainSplashes();
    }
    
    this.activeAnimations.add('rain');
  }

  createRaindrop(intensity) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    
    if (intensity === 'heavy') {
      drop.classList.add('raindrop-heavy');
    } else if (intensity === 'light') {
      drop.classList.add('raindrop-light');
    }
    
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDelay = Math.random() * 2 + 's';
    drop.style.animationDuration = (0.5 + Math.random() * 0.3) + 's';
    
    this.elements.rainContainer.appendChild(drop);
  }

  createRainSplashes() {
    const splashCount = 20;
    for (let i = 0; i < splashCount; i++) {
      const splash = document.createElement('div');
      splash.className = 'rain-splash';
      splash.style.left = Math.random() * 100 + '%';
      splash.style.animationDelay = Math.random() * 2 + 's';
      this.elements.rainContainer.appendChild(splash);
    }
  }

  stopRain() {
    if (this.elements.rainContainer) {
      this.elements.rainContainer.innerHTML = '';
      this.elements.rainContainer.style.display = 'none';
    }
    this.activeAnimations.delete('rain');
  }

  // ============================================
  // Snow Animation
  // ============================================
  startSnow(intensity = 'normal') {
    if (!this.elements.snowContainer) return;
    
    this.elements.snowContainer.innerHTML = '';
    this.elements.snowContainer.style.display = 'block';
    
    const count = intensity === 'heavy' ? 80 : intensity === 'light' ? 30 : 50;
    const flakes = ['❄', '❅', '❆', '•'];
    
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      
      if (intensity === 'heavy') {
        flake.classList.add('snowflake-heavy');
      } else if (intensity === 'light') {
        flake.classList.add('snowflake-light');
      }
      
      flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDelay = Math.random() * 5 + 's';
      flake.style.animationDuration = (3 + Math.random() * 5) + 's';
      flake.style.fontSize = (0.8 + Math.random() * 1.2) + 'em';
      
      this.elements.snowContainer.appendChild(flake);
    }
    
    this.activeAnimations.add('snow');
  }

  stopSnow() {
    if (this.elements.snowContainer) {
      this.elements.snowContainer.innerHTML = '';
      this.elements.snowContainer.style.display = 'none';
    }
    this.activeAnimations.delete('snow');
  }

  // ============================================
  // Fog Animation
  // ============================================
  startFog() {
    if (!this.elements.fogContainer) return;
    
    this.elements.fogContainer.style.display = 'block';
    
    // Add fog particles
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      this.createFogParticle();
    }
    
    if (this.elements.weatherBg) {
      this.elements.weatherBg.classList.add('foggy');
    }
    
    this.activeAnimations.add('fog');
  }

  createFogParticle() {
    const particle = document.createElement('div');
    particle.className = 'fog-particle';
    const size = 50 + Math.random() * 100;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    
    this.elements.fogContainer.appendChild(particle);
  }

  stopFog() {
    if (this.elements.fogContainer) {
      this.elements.fogContainer.style.display = 'none';
      this.elements.fogContainer.innerHTML = `
        <div class="fog-layer"></div>
        <div class="fog-layer"></div>
        <div class="fog-layer"></div>
      `;
    }
    this.activeAnimations.delete('fog');
  }

  // ============================================
  // Wind Animation
  // ============================================
  startWind(type = 'normal') {
    if (!this.elements.windParticles) return;
    
    this.elements.windParticles.innerHTML = '';
    this.elements.windParticles.style.display = 'block';
    
    // Add wind lines
    const lineCount = type === 'storm' ? 30 : 15;
    for (let i = 0; i < lineCount; i++) {
      this.createWindLine();
    }
    
    // Add leaves/particles
    const leafCount = type === 'storm' ? 20 : 10;
    for (let i = 0; i < leafCount; i++) {
      this.createWindLeaf();
    }
    
    this.activeAnimations.add('wind');
  }

  createWindLine() {
    const line = document.createElement('div');
    line.className = 'wind-line';
    line.style.top = Math.random() * 100 + '%';
    line.style.width = (100 + Math.random() * 200) + 'px';
    line.style.animationDelay = Math.random() * 3 + 's';
    line.style.animationDuration = (1 + Math.random() * 2) + 's';
    
    this.elements.windParticles.appendChild(line);
  }

  createWindLeaf() {
    const leaf = document.createElement('div');
    leaf.className = 'wind-leaf';
    leaf.textContent = ['🍃', '🍂', '🍁', '🌿'][Math.floor(Math.random() * 4)];
    leaf.style.top = Math.random() * 100 + '%';
    leaf.style.animationDelay = Math.random() * 5 + 's';
    leaf.style.animationDuration = (3 + Math.random() * 4) + 's';
    
    this.elements.windParticles.appendChild(leaf);
  }

  stopWind() {
    if (this.elements.windParticles) {
      this.elements.windParticles.innerHTML = '';
      this.elements.windParticles.style.display = 'none';
    }
    this.activeAnimations.delete('wind');
  }

  // ============================================
  // Sunny Animation
  // ============================================
  startSunny() {
    if (!this.elements.sunRays) return;
    
    this.elements.sunRays.style.display = 'block';
    this.elements.sunRays.innerHTML = '<div class="sun-glow"></div>';
    
    // Add sun rays
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      this.createSunRay(i);
    }
    
    // Add dust particles
    this.startDust();
    
    if (this.elements.weatherBg) {
      this.elements.weatherBg.classList.add('sunny');
    }
    
    this.activeAnimations.add('sun');
  }

  createSunRay(index) {
    const ray = document.createElement('div');
    ray.className = 'sun-ray';
    ray.style.transform = `rotate(${index * 30}deg)`;
    ray.style.animationDelay = (index * 0.5) + 's';
    
    this.elements.sunRays.appendChild(ray);
  }

  stopSunRays() {
    if (this.elements.sunRays) {
      this.elements.sunRays.innerHTML = '';
      this.elements.sunRays.style.display = 'none';
    }
    this.activeAnimations.delete('sun');
  }

  // ============================================
  // Clear Night Animation
  // ============================================
  startClearNight() {
    // Add aurora
    this.startAurora();
    
    // Add shooting stars
    this.startShootingStars();
    
    if (this.elements.weatherBg) {
      this.elements.weatherBg.classList.add('clear-night');
    }
    
    this.activeAnimations.add('night');
  }

  startAurora() {
    if (this.elements.aurora) {
      this.elements.aurora.style.display = 'block';
    }
    this.activeAnimations.add('aurora');
  }

  stopAurora() {
    if (this.elements.aurora) {
      this.elements.aurora.style.display = 'none';
    }
    this.activeAnimations.delete('aurora');
  }

  startShootingStars() {
    if (!this.elements.shootingStars) return;
    
    this.elements.shootingStars.innerHTML = '';
    this.elements.shootingStars.style.display = 'block';
    
    // Create shooting star every 3-6 seconds
    const createShootingStar = () => {
      if (!this.activeAnimations.has('night')) return;
      
      const star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.top = Math.random() * 30 + '%';
      star.style.left = (80 + Math.random() * 20) + '%';
      
      this.elements.shootingStars.appendChild(star);
      
      // Remove after animation
      setTimeout(() => star.remove(), 3000);
      
      // Schedule next
      setTimeout(createShootingStar, 3000 + Math.random() * 3000);
    };
    
    createShootingStar();
    this.activeAnimations.add('night');
  }

  stopShootingStars() {
    if (this.elements.shootingStars) {
      this.elements.shootingStars.innerHTML = '';
      this.elements.shootingStars.style.display = 'none';
    }
    this.activeAnimations.delete('night');
  }

  // ============================================
  // Cloudy Animation
  // ============================================
  startCloudy() {
    if (!this.elements.cloudsContainer) return;
    
    this.elements.cloudsContainer.innerHTML = '';
    this.elements.cloudsContainer.style.display = 'block';
    
    // Add fluffy clouds
    const cloudCount = 8;
    for (let i = 0; i < cloudCount; i++) {
      this.createFluffyCloud();
    }
    
    if (this.elements.weatherBg) {
      this.elements.weatherBg.classList.add('cloudy');
    }
    
    this.activeAnimations.add('clouds');
  }

  createFluffyCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.textContent = '☁️';
    cloud.style.top = Math.random() * 60 + '%';
    cloud.style.fontSize = (80 + Math.random() * 60) + 'px';
    cloud.style.animationDelay = Math.random() * 10 + 's';
    cloud.style.animationDuration = (25 + Math.random() * 20) + 's';
    
    if (Math.random() > 0.5) {
      cloud.classList.add('cloud-fast');
    } else {
      cloud.classList.add('cloud-slow');
    }
    
    this.elements.cloudsContainer.appendChild(cloud);
  }

  stopClouds() {
    if (this.elements.cloudsContainer) {
      this.elements.cloudsContainer.innerHTML = '';
      this.elements.cloudsContainer.style.display = 'none';
    }
    this.activeAnimations.delete('clouds');
  }

  // ============================================
  // Dust Particles (Clear Weather)
  // ============================================
  startDust() {
    if (!this.elements.dustParticles) return;
    
    this.elements.dustParticles.innerHTML = '';
    this.elements.dustParticles.style.display = 'block';
    
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      this.createDustParticle();
    }
    
    this.activeAnimations.add('dust');
  }

  createDustParticle() {
    const particle = document.createElement('div');
    particle.className = 'dust';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.animationDuration = (5 + Math.random() * 5) + 's';
    
    this.elements.dustParticles.appendChild(particle);
  }

  stopDust() {
    if (this.elements.dustParticles) {
      this.elements.dustParticles.innerHTML = '';
      this.elements.dustParticles.style.display = 'none';
    }
    this.activeAnimations.delete('dust');
  }

  // ============================================
  // Heat Waves (Hot Weather)
  // ============================================
  startHeatWaves() {
    if (!this.elements.heatWaves) return;
    
    this.elements.heatWaves.innerHTML = '';
    this.elements.heatWaves.style.display = 'block';
    
    const waveCount = 5;
    for (let i = 0; i < waveCount; i++) {
      this.createHeatWave(i);
    }
    
    this.activeAnimations.add('heat');
  }

  createHeatWave(index) {
    const wave = document.createElement('div');
    wave.className = 'heat-wave';
    wave.style.top = (index * 20) + '%';
    wave.style.animationDelay = (index * 0.4) + 's';
    
    this.elements.heatWaves.appendChild(wave);
  }

  stopHeatWaves() {
    if (this.elements.heatWaves) {
      this.elements.heatWaves.innerHTML = '';
      this.elements.heatWaves.style.display = 'none';
    }
    this.activeAnimations.delete('heat');
  }

  // ============================================
  // Weather Background Updates
  // ============================================
  updateWeatherBackground(iconId, description) {
    if (!this.elements.weatherBg) return;

    const desc = description.toLowerCase();

    // Reset classes
    this.elements.weatherBg.className = 'weather-bg';

    // Rain
    if (iconId >= 200 && iconId < 600 || desc.includes('rain') || desc.includes('drizzle')) {
      this.elements.weatherBg.classList.add('rainy');
    }
    // Snow
    else if (iconId >= 600 && iconId < 700 || desc.includes('snow')) {
      this.elements.weatherBg.classList.add('snowy');
    }
    // Thunderstorm
    else if (iconId >= 200 && iconId < 300 || desc.includes('thunder') || desc.includes('storm')) {
      this.elements.weatherBg.classList.add('stormy');
    }
    // Clear
    else if (iconId === 800 || desc.includes('clear')) {
      this.elements.weatherBg.classList.add(this.isNight ? 'clear-night' : 'sunny');
    }
    // Clouds
    else {
      this.elements.weatherBg.classList.add('cloudy');
    }
  }
}

// Export singleton instance
const weatherAnimations = new WeatherAnimations();
export default weatherAnimations;
