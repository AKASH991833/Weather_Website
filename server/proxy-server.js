/**
 * WeatherNow - Backend Proxy Server v2.0
 *
 * Secure API proxy to hide OpenWeatherMap API key
 * Features: Rate limiting, caching, input validation, request logging, error handling
 *
 * SETUP:
 * 1. npm install
 * 2. Create .env file with OPENWEATHER_API_KEY
 * 3. npm start
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  fetchWithTimeout,
  createResponse,
  validateCoordinates,
  validateCity,
  validateLimit,
  safeGet,
  getFallbackWeather,
  getFallbackForecast,
  handleAPIError,
} from "./api-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - server/.env takes priority, then root .env
dotenv.config({ path: join(__dirname, ".env") });
dotenv.config(); // fallback: load root .env for any vars not already set

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// ENVIRONMENT DEBUG LOGGING
// ============================================

/**
 * Mask sensitive values for logging
 * Shows first 4 and last 4 characters, masks the middle
 */
function maskSensitiveValue(value, visibleChars = 4) {
  if (!value) return "NOT_SET";
  if (value.length <= visibleChars * 2) return "***";
  return `${value.substring(0, visibleChars)}...${value.substring(value.length - visibleChars)}`;
}

/**
 * Debug environment variables on startup
 */
function debugEnvironmentVariables() {
  console.log("");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║        🔧 Environment Variables Debug          ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("");

  // Detect environment
  const nodeEnv = process.env.NODE_ENV || "development";
  const isRender =
    process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;
  const isProduction = nodeEnv === "production";

  console.log(`🌍 NODE_ENV: ${nodeEnv}`);
  console.log(
    `🖥️  Platform: ${isRender ? "Render" : isProduction ? "Production" : "Local"}`,
  );
  console.log(
    `📁 .env loaded: ${process.env.OPENWEATHER_API_KEY ? "Yes" : "No (using system env vars)"}`,
  );
  console.log("");

  // Log environment variables (masked for security)
  console.log("Configured Variables:");
  console.log(
    `  • OPENWEATHER_API_KEY: ${maskSensitiveValue(process.env.OPENWEATHER_API_KEY)}`,
  );
  console.log(`  • PORT: ${process.env.PORT || "3001 (default)"}`);
  console.log(`  • CACHE_TTL: ${process.env.CACHE_TTL || "600 (default)"}`);
  console.log(
    `  • RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS || "900000 (default)"}`,
  );
  console.log(
    `  • RATE_LIMIT_MAX_REQUESTS: ${process.env.RATE_LIMIT_MAX_REQUESTS || "100 (default)"}`,
  );
  console.log(
    `  • CORS_ALLOWED_ORIGINS: ${process.env.CORS_ALLOWED_ORIGINS || "default (localhost + Render)"}`,
  );
  console.log("");

  // Validate critical variables
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("❌ CRITICAL ERROR: OPENWEATHER_API_KEY is not set!");
    console.error("   Please ensure:");
    console.error("   1. .env file exists in the root directory");
    console.error("   2. .env contains: OPENWEATHER_API_KEY=your_api_key");
    console.error(
      "   3. On Render: Add OPENWEATHER_API_KEY in environment variables",
    );
    console.error("");
    process.exit(1);
  }

  // Validate API key format (OpenWeatherMap keys are typically 32 characters)
  if (apiKey.length < 10) {
    console.error("⚠️  WARNING: API key seems too short, might be invalid");
  } else {
    console.log("✅ API Key validation: PASSED");
  }

  console.log("");
}

// Run environment debug
debugEnvironmentVariables();

// ============================================
// CONFIGURATION
// ============================================

// Cache configuration with maxKeys to prevent memory overflow
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 600; // 10 minutes default
const CACHE_MAX_KEYS = 1000; // Prevent memory overflow
const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 120,
  maxKeys: CACHE_MAX_KEYS,
  useClones: true,
});

// API Key from environment variable ONLY - never hardcoded
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "https://maps.googleapis.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.tile.openstreetmap.org",
          "https://openweathermap.org",
          "https://*.tile.thunderforest.com",
          "https://*.openstreetmap.org",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        connectSrc: [
          "'self'",
          "https://api.openweathermap.org",
          "https://nominatim.openstreetmap.org",
          "https://*.tile.openstreetmap.org",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

// Performance: Gzip compression
app.use(compression());

// Request logging with morgan
const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(
  morgan(logFormat, {
    skip: (req, res) => {
      return (
        process.env.NODE_ENV === "production" && req.path === "/api/health"
      );
    },
  }),
);

// CORS Configuration
const parseCorsOrigins = () => {
  const origins = process.env.CORS_ALLOWED_ORIGINS;
  if (!origins) {
    return [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8000",
      "http://localhost:5500",
      "https://*.onrender.com", // Allow Render previews
    ];
  }
  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Serve static files from public folder with caching
// Disable cache in development for easier debugging
const isDev = process.env.NODE_ENV === "development";
app.use(
  express.static("public", {
    maxAge: isDev ? "0" : "1h",
    setHeaders: (res, path) => {
      if (isDev) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      } else if (/\.[0-9a-f]{8}\./.test(path)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (path.endsWith(".css") || path.endsWith(".js")) {
        res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache
      }
    },
  }),
);

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(self), microphone=()");
  next();
});

// Rate limiting with configurable values - optimized for development
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200; // Increased for testing

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please wait before making more requests.",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
});

// Apply rate limiting to API routes
app.use("/api/", limiter);

// Add rate limit headers to all responses
app.use((req, res, next) => {
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
  res.setHeader("X-RateLimit-Window", `${RATE_LIMIT_WINDOW_MS / 1000}s`);
  next();
});

// Request timeout handling
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    console.warn(`⏱️ Request timeout: ${req.method} ${req.path}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: "REQUEST_TIMEOUT",
        message: "Request timed out. Please try again.",
      });
    }
  });
  next();
});

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cache: {
        keys: cache.keys().length,
        maxKeys: CACHE_MAX_KEYS,
        hitRate:
          cache.getStats().hits /
          (cache.getStats().hits + cache.getStats().misses || 1),
      },
      environment: process.env.NODE_ENV || "development",
    },
  });
});

/**
 * Weather endpoint with comprehensive validation and retry logic
 */
app.get("/api/weather", async (req, res) => {
  const startTime = Date.now();
  const { lat, lon, units = "metric", lang = "en" } = req.query;

  try {
    // Validate coordinates
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            coordValidation.error,
            coordValidation.message,
          ),
        );
    }

    const { lat: latNum, lon: lonNum } = coordValidation;

    // Validate units
    const validUnits = ["metric", "imperial", "standard"];
    const selectedUnits = validUnits.includes(units) ? units : "metric";

    // Check cache
    const cacheKey = `weather:${latNum}:${lonNum}:${selectedUnits}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      const duration = Date.now() - startTime;
      console.log(`📦 Cache hit for weather data (${duration}ms)`);
      return res.json(createResponse(true, cached, null, "Cached response"));
    }

    // Fetch from OpenWeatherMap with retry and timeout - optimized
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${API_KEY}&units=${selectedUnits}&lang=${lang}`;

    console.log(`🌐 Fetching weather from API: ${latNum}, ${lonNum}`);

    const result = await fetchWithTimeout(url, {}, 5000, 1, 500);
    const data = result.data;

    // Validate API response structure
    const requiredFields = ["coord", "main", "weather", "name"];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field in API response: ${field}`);
        throw new Error(`Weather data is incomplete. Missing: ${field}`);
      }
    }

    // Cache the response
    cache.set(cacheKey, data);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Weather data fetched and cached for: ${data.name} (${duration}ms)`,
    );

    res.json(createResponse(true, data));
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = handleAPIError(error, "Weather");

    console.error(`❌ Weather API error (${duration}ms):`, errorInfo);

    // Try to return cached data if available
    const cacheKey = `weather:${lat || "unknown"}:${lon || "unknown"}:${req.query.units || "metric"}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`📦 Returning stale cache data due to error`);
      return res.json(
        createResponse(
          true,
          cached,
          null,
          "Stale cache data (API temporarily unavailable)",
        ),
      );
    }

    // Return fallback data for non-auth errors with visible indication
    if (errorInfo.type !== "AUTH") {
      const fallback = getFallbackWeather(
        parseFloat(lat) || 0,
        parseFloat(lon) || 0,
        req.query.units || "metric",
      );
      console.log(`🔄 Returning fallback weather data`);
      // Add a warning flag to indicate this is estimated data
      fallback._isFallback = true;
      return res.json(
        createResponse(
          true,
          fallback,
          null,
          "Using estimated data (API temporarily unavailable)",
        ),
      );
    }

    // For auth errors, return the actual error
    res
      .status(errorInfo.status)
      .json(createResponse(false, null, errorInfo.code, errorInfo.message));
  }
});

/**
 * 5-Day / 3-Hour Forecast endpoint with retry logic
 */
app.get("/api/forecast", async (req, res) => {
  const startTime = Date.now();
  const { lat, lon, units = "metric", lang = "en" } = req.query;

  try {
    // Validate coordinates
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            coordValidation.error,
            coordValidation.message,
          ),
        );
    }

    const { lat: latNum, lon: lonNum } = coordValidation;

    // Check cache
    const cacheKey = `forecast:${latNum}:${lonNum}:${units}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`📦 Cache hit for forecast data`);
      return res.json(createResponse(true, cached));
    }

    // Fetch from OpenWeatherMap with retry - optimized
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lonNum}&appid=${API_KEY}&units=${units}&lang=${lang}`;
    console.log(`🌐 Fetching forecast from API: ${latNum}, ${lonNum}`);

    const result = await fetchWithTimeout(url, {}, 5000, 1, 500);
    const data = result.data;

    // Cache the response (30 min for forecast)
    cache.set(cacheKey, data, 1800);

    const duration = Date.now() - startTime;
    console.log(`✅ Forecast data fetched and cached (${duration}ms)`);

    res.json(createResponse(true, data));
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = handleAPIError(error, "Forecast");

    console.error(`❌ Forecast API error (${duration}ms):`, errorInfo);

    // Try to return cached data
    const cacheKey = `forecast:${lat || "unknown"}:${lon || "unknown"}:${units || "metric"}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`📦 Returning stale cache data for forecast`);
      return res.json(
        createResponse(
          true,
          cached,
          null,
          "Stale cache data (API temporarily unavailable)",
        ),
      );
    }

    // Return fallback data for non-auth errors with visible indication
    if (errorInfo.type !== "AUTH") {
      const fallback = getFallbackForecast(
        parseFloat(lat) || 0,
        parseFloat(lon) || 0,
        req.query.units || "metric",
      );
      console.log(`🔄 Returning fallback forecast data`);
      // Add a warning flag to indicate this is estimated data
      fallback._isFallback = true;
      return res.json(
        createResponse(
          true,
          fallback,
          null,
          "Using estimated data (API temporarily unavailable)",
        ),
      );
    }

    res
      .status(errorInfo.status)
      .json(createResponse(false, null, errorInfo.code, errorInfo.message));
  }
});

/**
 * Geocoding endpoint with retry logic
 */
app.get("/api/geo", async (req, res) => {
  try {
    const { q, limit } = req.query;

    // Validate city name
    const cityValidation = validateCity(q);
    if (!cityValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            cityValidation.error,
            cityValidation.message,
          ),
        );
    }

    const { city } = cityValidation;

    // Validate and limit
    const safeLimit = validateLimit(limit, 10, 5);

    // Check cache
    const cacheKey = `geo:${city}:${safeLimit}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("📦 Cache hit for geocoding");
      return res.json(createResponse(true, cached));
    }

    // Fetch from OpenWeatherMap with retry
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=${safeLimit}&appid=${API_KEY}`;

    console.log("🌐 Fetching geocoding from API");

    const result = await fetchWithTimeout(url, {}, 10000, 2, 1000);
    const data = result.data;

    // Cache the response
    cache.set(cacheKey, data);

    console.log("✅ Geocoding data fetched and cached");

    res.json(createResponse(true, data));
  } catch (error) {
    const errorInfo = handleAPIError(error, "Geocoding");
    console.error("❌ Geocoding API error:", errorInfo);

    // For AUTH errors (invalid API key), signal the frontend so it can show the right message
    if (errorInfo.type === "AUTH") {
      return res.json(
        createResponse(
          true,
          [],
          "API_KEY_INVALID",
          "Invalid API key — geocoding unavailable",
        ),
      );
    }

    // For other errors (network, timeout), return empty array but flag the failure
    res.json(
      createResponse(
        true,
        [],
        "SERVICE_UNAVAILABLE",
        "Geocoding service temporarily unavailable",
      ),
    );
  }
});

/**
 * Reverse geocoding endpoint with retry logic
 */
app.get("/api/reverse-geo", async (req, res) => {
  try {
    const { lat, lon, limit } = req.query;

    // Validate coordinates
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            coordValidation.error,
            coordValidation.message,
          ),
        );
    }

    const { lat: latNum, lon: lonNum } = coordValidation;
    const safeLimit = validateLimit(limit, 5, 1);

    // Check cache
    const cacheKey = `reverse:${latNum}:${lonNum}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("📦 Cache hit for reverse geocoding");
      return res.json(createResponse(true, cached));
    }

    // Fetch from OpenWeatherMap with retry
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latNum}&lon=${lonNum}&limit=${safeLimit}&appid=${API_KEY}`;

    console.log("🌐 Fetching reverse geocoding from API");

    const result = await fetchWithTimeout(url, {}, 10000, 2, 1000);
    const data = result.data;

    // Cache the response
    const locationData = Array.isArray(data) ? data[0] : data;
    cache.set(cacheKey, locationData);

    console.log("✅ Reverse geocoding data fetched and cached");

    res.json(createResponse(true, locationData));
  } catch (error) {
    const errorInfo = handleAPIError(error, "Reverse Geocoding");
    console.error("❌ Reverse geocoding API error:", errorInfo);

    // Return minimal location data for non-auth errors
    if (errorInfo.type !== "AUTH") {
      return res.json(
        createResponse(
          true,
          {
            name: "Current Location",
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            country: "Unknown",
          },
          null,
          "Using approximate location (reverse geocoding unavailable)",
        ),
      );
    }

    res
      .status(errorInfo.status)
      .json(createResponse(false, null, errorInfo.code, errorInfo.message));
  }
});

/**
 * ZIP / Postal Code geocoding endpoint
 * Supports: Indian PIN codes (6-digit), UK postcodes, US ZIP codes, etc.
 * Query: ?zip=400001&country=IN  (country is optional, defaults to auto-detect)
 */
app.get("/api/geo-zip", async (req, res) => {
  try {
    const { zip, country } = req.query;

    if (!zip || String(zip).trim().length < 3) {
      return res.status(400).json(
        createResponse(false, null, "INVALID_ZIP", "Postal/ZIP code must be at least 3 characters")
      );
    }

    const cleanZip = String(zip).trim().toUpperCase().replace(/\s+/g, "");

    // Build candidate query strings — try with country first, then without
    const candidates = country
      ? [`${cleanZip},${String(country).trim().toUpperCase()}`, cleanZip]
      : [cleanZip];

    const cacheKey = `zip:${cleanZip}:${country || "auto"}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log("📦 Cache hit for ZIP geocoding");
      return res.json(createResponse(true, cached));
    }

    let zipResult = null;
    for (const candidate of candidates) {
      try {
        const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(candidate)}&appid=${API_KEY}`;
        console.log(`🌐 ZIP geocoding attempt: ${candidate}`);
        const result = await fetchWithTimeout(url, {}, 8000, 1, 500);
        if (result?.data?.lat && result?.data?.lon) {
          zipResult = result.data;
          break;
        }
      } catch (e) {
        console.warn(`⚠️ ZIP attempt failed for ${candidate}:`, e.message);
      }
    }

    // If ZIP lookup succeeded, return normalised result matching direct geo format
    if (zipResult) {
      const normalised = [{
        name:    zipResult.name || cleanZip,
        lat:     zipResult.lat,
        lon:     zipResult.lon,
        country: zipResult.country || (country || ""),
        state:   zipResult.state  || "",
        zip:     cleanZip,
      }];
      cache.set(cacheKey, normalised);
      console.log(`✅ ZIP geocoding resolved: ${normalised[0].name}`);
      return res.json(createResponse(true, normalised));
    }

    // Fallback: try direct geocoding with the raw ZIP as a query (some cities match)
    console.log("🔄 Falling back to direct geo for ZIP:", cleanZip);
    const directUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanZip)}&limit=5&appid=${API_KEY}`;
    const directResult = await fetchWithTimeout(directUrl, {}, 8000, 1, 500).catch(() => null);
    if (directResult?.data?.length > 0) {
      cache.set(cacheKey, directResult.data);
      return res.json(createResponse(true, directResult.data));
    }

    // Nothing found
    return res.json(createResponse(true, [], "NOT_FOUND", `No location found for postal code: ${cleanZip}`));

  } catch (error) {
    const errorInfo = handleAPIError(error, "ZIP Geocoding");
    console.error("❌ ZIP geocoding error:", errorInfo);
    res.json(createResponse(true, [], "SERVICE_UNAVAILABLE", "Postal code lookup temporarily unavailable"));
  }
});

/**
 * Multi-search endpoint — tries city name + ZIP together smartly
 * Query: ?q=400001 or ?q=London or ?q=London,UK
 */
app.get("/api/smart-geo", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.status(400).json(createResponse(false, null, "INVALID_QUERY", "Query too short"));
    }

    const query = String(q).trim();
    const cacheKey = `smartgeo:${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(createResponse(true, cached));

    // Detect postal code pattern
    const isPostal =
      /^\d{4,6}$/.test(query) ||                          // Pure numeric (IN, DE, FR, etc.)
      /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i.test(query) || // UK postcode
      /^\d{5}(-\d{4})?$/.test(query) ||                  // US ZIP
      /^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i.test(query);        // Canada FSA

    let results = [];

    if (isPostal) {
      // Extract optional country hint from "400001,IN" or "400001 IN" patterns
      const parts = query.split(/[,\s]+/);
      const zipPart = parts[0];
      const countryPart = parts[1] || "";

      // Try ZIP endpoint directly
      const zipUrl = countryPart
        ? `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zipPart + "," + countryPart.toUpperCase())}&appid=${API_KEY}`
        : `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zipPart)}&appid=${API_KEY}`;

      try {
        const r = await fetchWithTimeout(zipUrl, {}, 8000, 1, 500);
        if (r?.data?.lat) {
          results = [{
            name:    r.data.name || zipPart,
            lat:     r.data.lat,
            lon:     r.data.lon,
            country: r.data.country || countryPart,
            state:   r.data.state || "",
            zip:     zipPart,
          }];
        }
      } catch (e) { /* continue to fallback */ }

      // Fallback: direct geo
      if (results.length === 0) {
        const dUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const d = await fetchWithTimeout(dUrl, {}, 8000, 1, 500).catch(() => null);
        if (d?.data?.length > 0) results = d.data;
      }
    } else {
      // Regular city/country name search
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=8&appid=${API_KEY}`;
      const r = await fetchWithTimeout(url, {}, 10000, 2, 1000).catch(() => null);
      if (r?.data?.length > 0) results = r.data;
    }

    if (results.length > 0) cache.set(cacheKey, results);
    return res.json(createResponse(true, results));

  } catch (error) {
    const errorInfo = handleAPIError(error, "Smart Geo");
    console.error("❌ Smart geo error:", errorInfo);
    if (errorInfo.type === "AUTH") {
      return res.json(createResponse(true, [], "API_KEY_INVALID", "Invalid API key"));
    }
    res.json(createResponse(true, [], "SERVICE_UNAVAILABLE", "Search temporarily unavailable"));
  }
});

/**
 * Air pollution endpoint with validation and retry logic
 */
app.get("/api/air-pollution", async (req, res) => {
  const startTime = Date.now();
  const { lat, lon } = req.query;

  try {
    // Validate coordinates
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            coordValidation.error,
            coordValidation.message,
          ),
        );
    }

    const { lat: latNum, lon: lonNum } = coordValidation;

    // Check cache
    const cacheKey = `air:${latNum}:${lonNum}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      const duration = Date.now() - startTime;
      console.log(`📦 Cache hit for air quality (${duration}ms)`);
      return res.json(createResponse(true, cached));
    }

    // Fetch from OpenWeatherMap with retry
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latNum}&lon=${lonNum}&appid=${API_KEY}`;

    console.log("🌐 Fetching air quality from API");

    const result = await fetchWithTimeout(url, {}, 10000, 2, 1000);
    const data = result.data;

    // Validate response structure
    if (!data || !data.list || !Array.isArray(data.list)) {
      throw new Error("Invalid air quality data received");
    }

    // Cache the response
    cache.set(cacheKey, data);

    const duration = Date.now() - startTime;
    console.log(`✅ Air quality data fetched and cached (${duration}ms)`);

    res.json(createResponse(true, data));
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = handleAPIError(error, "Air Quality");

    console.error(`❌ Air quality API error (${duration}ms):`, errorInfo);

    // Return empty AQI data gracefully (AQI is optional)
    res.json(
      createResponse(
        true,
        {
          list: [
            {
              main: { aqi: 3 }, // Default to moderate
              components: {
                co: 233.75,
                no: 0.01,
                no2: 5.49,
                o3: 68.66,
                so2: 0.64,
                pm2_5: 10,
                pm10: 15,
                nh3: 0.5,
              },
            },
          ],
        },
        null,
        "Using estimated air quality data",
      ),
    );
  }
});

/**
 * Weather alerts endpoint
 * Note: OneCall 3.0 requires Pay-as-you-go plan. Returns empty alerts for free tier.
 */
app.get("/api/alerts", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // Validate coordinates
    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.valid) {
      return res
        .status(400)
        .json(
          createResponse(
            false,
            null,
            coordValidation.error,
            coordValidation.message,
          ),
        );
    }

    const { lat: latNum, lon: lonNum } = coordValidation;

    // Check cache
    const cacheKey = `alerts:${latNum}:${lonNum}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("📦 Cache hit for weather alerts");
      return res.json(createResponse(true, cached));
    }

    // Fetch from OpenWeatherMap OneCall API (includes alerts)
    // Note: OneCall 3.0 requires Pay-as-you-go plan with credit card
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latNum}&lon=${lonNum}&exclude=minutely,hourly,daily&appid=${API_KEY}&alerts`;

    console.log("🌐 Fetching weather alerts from API");

    const response = await fetch(url);

    // Handle 401/403 errors (Free tier doesn't have access to OneCall 3.0)
    if (response.status === 401 || response.status === 403) {
      console.log(
        "⚠️  OneCall 3.0 not available (Free tier). Returning empty alerts.",
      );
      const emptyAlerts = { alerts: [], count: 0, hasAlerts: false };
      cache.set(cacheKey, emptyAlerts, 300);
      return res.json(
        createResponse(
          true,
          emptyAlerts,
          null,
          "Weather alerts unavailable on free tier",
        ),
      );
    }

    if (!response.ok) {
      throw new Error(`Alerts API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract only alerts
    const alerts = safeGet(data, "alerts", []);

    // Cache the response (shorter cache for alerts - 5 minutes)
    cache.set(cacheKey, alerts, 300);

    console.log(`✅ Weather alerts fetched: ${alerts.length} alerts`);

    res.json(
      createResponse(true, {
        alerts: alerts,
        count: alerts.length,
        hasAlerts: alerts.length > 0,
      }),
    );
  } catch (error) {
    console.error("❌ Weather alerts API error:", error.message);

    // Return empty alerts gracefully (alerts are optional)
    const emptyAlerts = { alerts: [], count: 0, hasAlerts: false };
    res.json(
      createResponse(
        true,
        emptyAlerts,
        null,
        "Weather alerts temporarily unavailable",
      ),
    );
  }
});

/**
 * Clear cache endpoint (admin)
 */
app.post("/api/cache/clear", (req, res) => {
  const { key } = req.body;

  if (key) {
    const deleted = cache.del(key);
    console.log(`🗑️ Cache key cleared: ${key} (deleted: ${deleted})`);
    res.json(createResponse(true, null, null, `Cache key "${key}" cleared`));
  } else {
    const stats = cache.flushAll();
    console.log("🗑️ All cache cleared");
    res.json(
      createResponse(true, { flushed: stats }, null, "All cache cleared"),
    );
  }
});

/**
 * Cache stats endpoint
 */
app.get("/api/cache/stats", (req, res) => {
  const stats = cache.getStats();
  res.json(
    createResponse(true, {
      keys: cache.keys(),
      count: cache.keys().length,
      maxKeys: CACHE_MAX_KEYS,
      stats: stats,
      hitRate: stats.hits / (stats.hits + stats.misses || 1),
    }),
  );
});

// ============================================
// ROUTES
// ============================================

// Root route - Serve welcome page
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "..", "public", "index.html"));
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === "development";

  res
    .status(err.status || 500)
    .json(
      createResponse(
        false,
        null,
        err.code || "INTERNAL_ERROR",
        isDev ? err.message : "An unexpected error occurred",
      ),
    );
});

// 404 handler - Serve index.html for SPA routes, JSON for API
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    res
      .status(404)
      .json(
        createResponse(
          false,
          null,
          "NOT_FOUND",
          `Endpoint ${req.method} ${req.path} not found`,
        ),
      );
  } else {
    res.sendFile(join(__dirname, "..", "public", "index.html"));
  }
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║     🌤️  WeatherNow Proxy Server v2.0  🌤️     ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("");
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
  console.log(`📊 Cache TTL: ${CACHE_TTL}s (max ${CACHE_MAX_KEYS} keys)`);
  console.log(
    `🔒 Rate limit: ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s`,
  );
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");
  console.log("  GET  /                      - Weather App (Frontend)");
  console.log("  GET  /api/health            - Server health check");
  console.log("  GET  /api/weather?lat=&lon= - Current weather");
  console.log("  GET  /api/forecast?lat=&lon= - 5-day/3-hour forecast");
  console.log("  GET  /api/geo?q=            - Geocoding");
  console.log("  GET  /api/reverse-geo?lat=&lon= - Reverse geocoding");
  console.log("  GET  /api/air-pollution?lat=&lon= - Air quality index");
  console.log("  GET  /api/alerts?lat=&lon=  - Weather alerts");
  console.log("  GET  /api/cache/stats       - Cache statistics");
  console.log("  POST /api/cache/clear       - Clear cache");
  console.log("");
  console.log("Static files served from: /public");
  console.log("");
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("✅ HTTP server closed");
    cache.flushAll();
    console.log("✅ Cache cleared");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      "❌ Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});
