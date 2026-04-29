/**
 * firebaseService.ts
 * Menangani Google Sign-In via OAuth (kompatibel Expo Go)
 * dan registrasi Push Notification.
 */

import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Penting: tutup auth session window setelah selesai
WebBrowser.maybeCompleteAuthSession();

// Firebase project config dari google-services.json
const FIREBASE_CONFIG = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '585936435498-o42i1bvn57l7b3tmiu69epfp5p330nu0.apps.googleusercontent.com',
};

// ================================================
// GOOGLE SIGN-IN
// ================================================

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

function getGoogleRedirectUri(): string {
  const customRedirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (customRedirectUri) {
    return customRedirectUri;
  }

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    const owner = Constants.expoConfig?.owner?.trim();
    const slug = Constants.expoConfig?.slug?.trim();

    if (!owner || !slug) {
      throw new Error(
        'Google login di Expo Go butuh project owner Expo. Jalankan `npx expo login`, isi `owner` di app.json, lalu restart `npx expo start -c`. Jika tidak, gunakan development build.',
      );
    }

    if (owner.includes('@')) {
      throw new Error(
        'Field `expo.owner` harus username Expo, bukan email. Contoh benar: `owner: "danisugiarto"`.',
      );
    }

    return `https://auth.expo.io/@${owner}/${slug}`;
  }

  return AuthSession.makeRedirectUri({
    scheme: 'financialfredom',
    path: 'auth',
  });
}

function getGoogleAuthErrorMessage(
  errorCode: string | undefined,
  redirectUri: string,
): string {
  switch (errorCode) {
    case 'redirect_uri_mismatch':
      return `Redirect URI Google belum cocok. Daftarkan URI ini di Google Cloud/Firebase OAuth: ${redirectUri}`;
    case 'invalid_request':
      return `Request ke Google ditolak. Periksa Web Client ID dan redirect URI ini: ${redirectUri}`;
    case 'access_denied':
      return 'Akses Google ditolak. Coba pilih akun Google lagi.';
    default:
      return 'Google login gagal. Periksa konfigurasi OAuth Google Anda.';
  }
}

/**
 * Buka alur OAuth Google dan kembalikan ID Token Firebase.
 * Menggunakan expo-auth-session — kompatibel dengan Expo Go.
 */
export async function signInWithGoogle(): Promise<string> {
  const redirectUri = getGoogleRedirectUri();
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const request = new AuthSession.AuthRequest({
    clientId: FIREBASE_CONFIG.webClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    usePKCE: false,
    prompt: AuthSession.Prompt.SelectAccount,
    extraParams: {
      nonce: Math.random().toString(36).substring(2),
    },
  });

  let result: AuthSession.AuthSessionResult;

  if (isExpoGo) {
    const authUrl = await request.makeAuthUrlAsync(GOOGLE_DISCOVERY);
    const returnUrl = AuthSession.makeRedirectUri({
      scheme: 'financialfredom',
      path: 'auth',
    });
    const startUrl =
      `${redirectUri}/start?` +
      new URLSearchParams({
        authUrl,
        returnUrl,
      }).toString();

    const browserResult = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);
    if (browserResult.type !== 'success') {
      result = { type: browserResult.type };
    } else {
      result = request.parseReturnUrl(browserResult.url);
    }
  } else {
    result = await request.promptAsync(GOOGLE_DISCOVERY);
  }

  if (result.type === 'error') {
    const errorCode = result.params?.error || result.error?.code;
    throw new Error(getGoogleAuthErrorMessage(errorCode, redirectUri));
  }

  if (result.type !== 'success') {
    throw new Error(result.type === 'cancel' ? 'Login dibatalkan' : 'Google login gagal');
  }

  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error('Tidak mendapat ID token dari Google');
  }

  return idToken;
}

// ================================================
// PUSH NOTIFICATION
// ================================================

/**
 * Setup notifikasi: minta permission dan return Expo Push Token.
 * Token ini dikirim ke backend untuk menyimpan target notifikasi.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Notifikasi tidak bisa di web
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  // Konfigurasi perilaku notifikasi
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Minta permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('⚠️ Push notification permission denied');
    return null;
  }

  try {
    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      throw new Error('EAS projectId belum ada. Jalankan `eas init` atau isi EXPO_PUBLIC_EAS_PROJECT_ID.');
    }

    // Dapatkan Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const pushToken = tokenData.data;
    console.log('✅ Expo Push Token:', pushToken);
    return pushToken;
  } catch (error) {
    console.error('Gagal mendapat push token:', error);
    return null;
  }
}

/**
 * Setup listener notifikasi (untuk background/foreground).
 * Panggil sekali di root _layout.tsx atau App.tsx.
 */
export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const notifSub = onNotification
    ? Notifications.addNotificationReceivedListener(onNotification)
    : null;

  const respSub = onResponse
    ? Notifications.addNotificationResponseReceivedListener(onResponse)
    : null;

  // Return cleanup function
  return () => {
    notifSub?.remove();
    respSub?.remove();
  };
}
