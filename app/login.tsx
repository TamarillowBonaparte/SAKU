import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import logo from '../assets/images//Logo/Saku Logo HD.png';
import google from '../assets/images/google.png';

const PRIMARY = '#004ac6';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Email dan password harus diisi');
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      setLocalError(errorMessage);
      Alert.alert('Login Gagal', errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.message || 'Google login gagal. Coba lagi.';
      // Jangan tampilkan error jika user sengaja cancel
      if (!msg.includes('dibatalkan') && !msg.includes('cancel')) {
        setLocalError(msg);
        Alert.alert('Google Login Gagal', msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Image source={logo} style={styles.appLogo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            Silakan masuk ke akun SAKU Anda untuk mengelola keuangan dengan mudah dan efisien.
          </Text>
        </View>

        <View style={styles.form}>
          {localError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{localError}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>

            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6b7280" />
              <TextInput
                placeholder="nama@email.com"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TouchableOpacity onPress={() => router.push('./reset_password')}>
                <Text style={styles.forgot}>Lupa Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6b7280" />

              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.loginText}>Masuk</Text>
                <LogIn size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>ATAU MASUK DENGAN</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity 
          style={[styles.googleBtn, (isLoading || googleLoading) && styles.loginBtnDisabled]} 
          disabled={isLoading || googleLoading}
          onPress={handleGoogleLogin}
        >
          {googleLoading ? (
            <ActivityIndicator color="#5f6368" size="small" />
          ) : (
            <>
              <Image
                source={google}
                style={styles.googleLogo}
              />
              <Text style={styles.googleText}>Lanjutkan dengan Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun?</Text>

          <TouchableOpacity onPress={() => router.push('/register')} disabled={isLoading}>
            <Text style={styles.signup}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },

  hero: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 35,
  },

  logoBox: {
    width: 82,
    height: 82,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  appLogo: {
    width: 56,
    height: 56,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  form: {
    gap: 18,
  },

  fieldGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  forgot: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 13,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    gap: 10,
  },

  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },

  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },

  loginBtn: {
    marginTop: 10,
    height: 56,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  loginBtnDisabled: {
    opacity: 0.6,
  },

  loginText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 34,
    gap: 10,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },

  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },

  googleBtn: {
    height: 54,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  googleLogo: {
    width: 20,
    height: 20,
  },

  googleText: {
    color: '#3c4043',
    fontWeight: '600',
    fontSize: 15,
  },

  footer: {
    marginTop: 45,
    alignItems: 'center',
  },

  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },

  signup: {
    marginTop: 10,
    color: PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
});