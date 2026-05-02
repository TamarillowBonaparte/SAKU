/**
 * Local IP Detection Utility
 *
 * Provides utilities for auto-detecting local machine IP address
 * Useful for development environments where backend runs on same network
 */

import * as Network from "expo-network";

/**
 * Get local IPv4 address from device
 *
 * @returns Promise<string | null> - Local IPv4 address or null if unable to detect
 */
export const getLocalIPAddress = async (): Promise<string | null> => {
  try {
    const ipAddress = await Network.getIpAddressAsync();
    console.log("✅ Local IP detected:", ipAddress);
    return ipAddress;
  } catch (error) {
    console.warn("⚠️ Failed to detect local IP:", error);
    return null;
  }
};

/**
 * Construct API URL with auto-detected local IP
 *
 * @param port - Backend server port (default: 8080)
 * @param protocol - http or https (default: http for local)
 * @returns Promise<string | null> - Full API URL or null if unable to detect IP
 */
export const getLocalAPIUrl = async (
  port: number = 8080,
  protocol: string = "http",
): Promise<string | null> => {
  const ip = await getLocalIPAddress();
  if (!ip) {
    console.warn("⚠️ Could not construct local API URL - IP detection failed");
    return null;
  }

  const apiUrl = `${protocol}://${ip}:${port}/api`;
  console.log("🌐 Local API URL:", apiUrl);
  return apiUrl;
};

/**
 * Build API configuration object for development
 * Automatically detects local IP and constructs API URL
 *
 * @returns Promise<{ baseURL: string; fallback: string }>
 */
export const buildDevelopmentApiConfig = async () => {
  const localUrl = await getLocalAPIUrl();

  return {
    baseURL: localUrl || "http://localhost:8080/api", // Fallback to localhost
    fallback: "http://localhost:8080/api",
    isLocalIP: !!localUrl,
  };
};

export default {
  getLocalIPAddress,
  getLocalAPIUrl,
  buildDevelopmentApiConfig,
};
