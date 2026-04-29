import { Platform } from 'react-native';
import apiClient from './api';

class NotificationService {
  async registerPushToken(token: string): Promise<void> {
    await apiClient.post('/notifications/register-token', {
      token,
      platform: Platform.OS,
    });
  }
}

export default new NotificationService();

