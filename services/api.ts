import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';
import apiConfig from '../config/apiConfig';

// API Base URL is now managed by config/apiConfig.ts
// This provides automatic IP detection, environment-based config, and easy switching for production
const API_BASE_URL = apiConfig.baseURL;

const TOKEN_KEY = 'auth_token';
const LAST_ACTIVITY_KEY = 'last_activity';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Token manager dengan AsyncStorage persistence
export const tokenManager = {
  token: null as string | null,

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await this.updateLastActivity();
    console.log('✅ Token set dan disimpan ke AsyncStorage');
  },

  getToken() {
    return this.token;
  },

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    console.log('❌ Token cleared dari memory dan storage');
  },

  async restoreToken(): Promise<string | null> {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      
      if (!storedToken) {
        return null;
      }

      // Check if session expired due to inactivity
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity);
        const currentTime = Date.now();
        const timeDifference = currentTime - lastActivityTime;

        if (timeDifference > INACTIVITY_TIMEOUT) {
          console.log('⏰ Session expired due to inactivity');
          await this.clearToken();
          return null;
        }
      }

      this.token = storedToken;
      await this.updateLastActivity();
      console.log('✅ Token restored dari AsyncStorage');
      return storedToken;
    } catch (error) {
      console.error('Error restoring token:', error);
      return null;
    }
  },

  async updateLastActivity() {
    try {
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  },

  async checkAndClearInactiveSession(): Promise<boolean> {
    try {
      if (!this.token) return false;

      const lastActivity = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      if (!lastActivity) return false;

      const lastActivityTime = parseInt(lastActivity);
      const currentTime = Date.now();
      const timeDifference = currentTime - lastActivityTime;

      if (timeDifference > INACTIVITY_TIMEOUT) {
        console.log('⏰ Session expired due to inactivity - clearing token');
        await this.clearToken();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking inactivity:', error);
      return false;
    }
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and track activity
apiClient.interceptors.request.use(
  async (config) => {
    // Check if session expired due to inactivity before making request
    const isExpired = await tokenManager.checkAndClearInactiveSession();
    if (isExpired) {
      // Session expired - return error to be handled by AuthContext
      return Promise.reject(new Error('Session expired due to inactivity'));
    }

    // Update last activity
    await tokenManager.updateLastActivity();

    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear from memory
      tokenManager.clearToken();
      // App will redirect to login automatically via AuthContext
    }
    return Promise.reject(error);
  }
);

// ===== Auth API Functions =====

export const registerUser = async (name: string, email: string, password: string, otp: string) => {
  const response = await apiClient.post('/auth/register', { name, email, password, otp });
  return response.data;
};

export const registerSendOTP = async (email: string) => {
  const response = await apiClient.post('/auth/register-send-otp', { email });
  return response.data;
};

export default apiClient;
