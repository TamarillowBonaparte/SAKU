/**
 * API Configuration Management
 *
 * This module provides a flexible, modular API configuration system that:
 * - Auto-detects local IP for development environments
 * - Supports environment-based overrides via .env
 * - Easily switchable for production/hosting
 * - Maintains configuration in one centralized place
 */

export type Environment = "development" | "staging" | "production";

interface ApiConfig {
  baseURL: string;
  timeout: number;
  environment: Environment;
}

/**
 * Get the current environment from .env or default to development
 */
const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_API_ENV || "development";
  return env as Environment;
};

/**
 * Get API base URL based on environment and configuration
 *
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL (direct override from .env)
 * 2. EXPO_PUBLIC_API_CUSTOM_URL (custom URL for any environment)
 * 3. Environment-based auto-detection (DEV: auto-local IP, PROD: fixed URL)
 */
const getApiBaseUrl = (): string => {
  // Priority 1: Direct override
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(
      "✅ Using EXPO_PUBLIC_API_URL:",
      process.env.EXPO_PUBLIC_API_URL,
    );
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 2: Custom URL override
  if (process.env.EXPO_PUBLIC_API_CUSTOM_URL) {
    console.log(
      "✅ Using EXPO_PUBLIC_API_CUSTOM_URL:",
      process.env.EXPO_PUBLIC_API_CUSTOM_URL,
    );
    return process.env.EXPO_PUBLIC_API_CUSTOM_URL;
  }

  // Priority 3: Environment-based defaults
  const environment = getEnvironment();

  switch (environment) {
    case "production":
      // For production, use a fixed domain or IP
      const prodUrl =
        process.env.EXPO_PUBLIC_API_PROD_URL ||
        "https://api.financialfreedom.com/api";
      console.log("📦 Production URL:", prodUrl);
      return prodUrl;

    case "staging":
      const stagingUrl =
        process.env.EXPO_PUBLIC_API_STAGING_URL ||
        "http://staging-api.financialfreedom.com:8080/api";
      console.log("🔄 Staging URL:", stagingUrl);
      return stagingUrl;

    case "development":
    default:
      // For development, use local IP
      // Default to localhost first, can be overridden by environment variable
      const devUrl =
        process.env.EXPO_PUBLIC_API_DEV_URL || "http://localhost:8080/api";
      console.log("🔧 Development URL:", devUrl);
      return devUrl;
  }
};

/**
 * Main API Configuration Object
 */
export const apiConfig: ApiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  environment: getEnvironment(),
};

/**
 * Utility function to update API configuration at runtime
 * Useful for switching environments or custom URLs without restarting
 */
export const updateApiConfig = (newBaseURL: string): void => {
  console.log("🔄 Updating API baseURL to:", newBaseURL);
  apiConfig.baseURL = newBaseURL;
};

/**
 * Utility function to get environment info for debugging
 */
export const getApiConfigInfo = () => {
  return {
    environment: apiConfig.environment,
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    isDevelopment: apiConfig.environment === "development",
    isProduction: apiConfig.environment === "production",
  };
};

export default apiConfig;
