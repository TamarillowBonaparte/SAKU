import apiClient, { tokenManager } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    firebase_uid: string;
    name: string;
    email: string;
    photo_url?: string;
    is_verified: boolean;
    created_at: string;
  };
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerifyRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

class AuthService {
  /**
   * Restore session dari AsyncStorage
   * Dipanggil saat app startup untuk memulihkan login session
   */
  async restoreSession(): Promise<AuthResponse | null> {
    try {
      const restoredToken = await tokenManager.restoreToken();
      if (!restoredToken) {
        return null;
      }

      // Get current user dari token
      const user = this.getCurrentUser();
      if (!user) {
        await tokenManager.clearToken();
        return null;
      }

      return {
        token: restoredToken,
        user,
      };
    } catch (error) {
      console.error('Session restore error:', error);
      return null;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Backend returns: { success, message, data: { user, token } }
      const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/login', credentials);
      const { token, user } = response.data.data;

      // Store token in memory dan AsyncStorage
      await tokenManager.setToken(token);

      return response.data.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Backend returns: { success, message, data: { user, token } }
      const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>('/auth/register', data);
      const { token } = response.data.data;

      // Store token in memory dan AsyncStorage
      await tokenManager.setToken(token);

      return response.data.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await tokenManager.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async requestOTP(data: OTPRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/request-otp', data);
      return response.data;
    } catch (error) {
      console.error('Request OTP error:', error);
      throw error;
    }
  }

  async verifyOTP(data: OTPVerifyRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/verify-otp', data);
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async googleLogin(googleAccessToken: string): Promise<AuthResponse> {
    try {
      // Backend returns: { success, message, data: { user, token } }
      const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>(
        '/auth/google-login',
        { id_token: googleAccessToken },
      );
      const { token: authToken } = response.data.data;

      // Store token in memory dan AsyncStorage
      await tokenManager.setToken(authToken);

      return response.data.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Get current user - decoded from stored token (no API call needed)
  getCurrentUser() {
    const token = tokenManager.getToken();
    if (!token) {
      return null;
    }
    try {
      // Decode JWT payload (base64 decode middle part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        email: payload.email,
        name: payload.name || '',
        firebase_uid: payload.firebase_uid || '',
        is_verified: true,
        created_at: '',
      };
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // Check if authenticated by checking if token exists
  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  }
}

export default new AuthService();
