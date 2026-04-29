import apiClient from '@/services/api';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
const OTP_DURATION = 120; // 2 menit dalam detik

type Step = 'form' | 'otp';

export default function ResetPasswordScreen() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Flow state
  const [step, setStep] = useState<Step>('form');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCheckMessage, setOtpCheckMessage] = useState('');
  const [otpCheckSuccess, setOtpCheckSuccess] = useState(false);

  // Loading state
  const [sendingToken, setSendingToken] = useState(false);
  const [checkingOtp, setCheckingOtp] = useState(false);
  const [saving, setSaving] = useState(false);

  // Countdown state
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation for OTP verified
  const successAnim = useRef(new Animated.Value(0)).current;

  // ─── Countdown logic ─────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(OTP_DURATION);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Validasi ─────────────────────────────────────────────────────────
  const passwordsMatch = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;
  const canSendToken =
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    passwordsMatch &&
    !sendingToken;

  const canResend = countdown === 0 && !sendingToken;
  const canSave = otpVerified && !saving;

  // ─── Send Token ────────────────────────────────────────────────────────
  const handleSendToken = async (isResend = false) => {
    if ((!isResend && !canSendToken) || (isResend && !canResend)) return;

    setSendingToken(true);
    try {
      await apiClient.post('/auth/reset-send-otp', { email: email.trim() });

      // Reset OTP verification state setiap kirim ulang
      setOtp('');
      setOtpVerified(false);
      setOtpCheckMessage('');
      setOtpCheckSuccess(false);

      startCountdown();
      setStep('otp');

      if (isResend) {
        Alert.alert('Token Dikirim', 'Token lama hangus. Token baru telah dikirim ke email Anda.');
      } else {
        Alert.alert('Token Dikirim', 'Token reset password telah dikirim ke email Anda. Berlaku 2 menit.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Gagal mengirim token. Pastikan email terdaftar.';
      Alert.alert('Gagal', msg);
    } finally {
      setSendingToken(false);
    }
  };

  // ─── Check OTP ────────────────────────────────────────────────────────
  const handleCheckOtp = async () => {
    if (otp.length !== 6 || checkingOtp) return;

    setCheckingOtp(true);
    setOtpCheckMessage('');
    setOtpCheckSuccess(false);

    try {
      await apiClient.post('/auth/verify-reset-otp', {
        email: email.trim(),
        code: otp,
      });

      setOtpVerified(true);
      setOtpCheckSuccess(true);
      setOtpCheckMessage('✓ Token valid! Anda dapat menyimpan kata sandi baru.');

      // Animate success
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Token salah atau sudah kadaluarsa.';
      setOtpVerified(false);
      setOtpCheckSuccess(false);
      setOtpCheckMessage(`✗ ${msg}`);
    } finally {
      setCheckingOtp(false);
    }
  };

  // ─── Save Password ─────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!canSave) return;

    if (!passwordsMatch) {
      Alert.alert('Perhatian', 'Kata sandi dan konfirmasi tidak cocok.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/auth/reset-password-by-email', {
        email: email.trim(),
        password,
      });

      Alert.alert(
        'Berhasil! 🎉',
        'Kata sandi Anda telah berhasil diperbarui. Silakan login dengan kata sandi baru Anda.',
        [{ text: 'Login', onPress: () => router.replace('/login') }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Gagal menyimpan kata sandi.';
      Alert.alert('Gagal', msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fb" />

      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* TITLE */}
        <Text style={styles.pageTitle}>Reset Password</Text>
        <Text style={styles.pageDesc}>
          Isi email dan kata sandi baru, lalu klik <Text style={{ fontWeight: '800', color: '#2563eb' }}>Send Token</Text> untuk memulai.
        </Text>

        {/* ICON */}
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="lock-reset" size={34} color="#ffffff" />
        </View>

        {/* EMAIL */}
        <View style={styles.section}>
          <Text style={styles.label}>Email Terdaftar</Text>

          <View style={styles.row}>
            <TextInput
              value={email}
              onChangeText={text => {
                setEmail(text);
                // Reset flow jika email berubah
                if (step === 'otp') {
                  setStep('form');
                  setOtpVerified(false);
                  setOtpCheckMessage('');
                  setOtp('');
                }
              }}
              placeholder="Masukkan Email"
              placeholderTextColor="#8b8f97"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { flex: 1 }]}
              editable={!sendingToken && !saving}
            />

            <TouchableOpacity
              style={[
                styles.primaryButtonSmall,
                !canSendToken && styles.disabledButton,
              ]}
              onPress={() => handleSendToken(false)}
              disabled={!canSendToken || sendingToken}
            >
              {sendingToken ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonSmallText}>Send Token</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Proteksi: info jika password belum diisi */}
          {!passwordsMatch && email.length > 0 && (
            <Text style={styles.warningText}>
              ⚠ Isi kata sandi baru terlebih dahulu sebelum mengirim token
            </Text>
          )}
        </View>

        {/* PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>Kata Sandi Baru</Text>
          <View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 karakter"
              placeholderTextColor="#8b8f97"
              secureTextEntry={!showPassword}
              style={[
                styles.input,
                password.length >= 6 && confirmPassword.length >= 6 && passwordsMatch
                  ? styles.inputValid
                  : password.length > 0 && password.length < 6
                  ? styles.inputError
                  : null,
              ]}
              editable={!saving}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#737686"
              />
            </TouchableOpacity>
          </View>
          {password.length > 0 && password.length < 6 && (
            <Text style={styles.errorText}>Minimal 6 karakter</Text>
          )}
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>Konfirmasi Kata Sandi Baru</Text>
          <View>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi kata sandi"
              placeholderTextColor="#8b8f97"
              secureTextEntry={!showConfirm}
              style={[
                styles.input,
                confirmPassword.length > 0 && password !== confirmPassword
                  ? styles.inputError
                  : confirmPassword.length > 0 && passwordsMatch
                  ? styles.inputValid
                  : null,
              ]}
              editable={!saving}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <MaterialCommunityIcons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#737686"
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={styles.errorText}>Kata sandi tidak cocok</Text>
          )}
          {confirmPassword.length > 0 && passwordsMatch && (
            <Text style={styles.successText}>✓ Kata sandi cocok</Text>
          )}
        </View>

        {/* OTP SECTION - shown after token sent */}
        {step === 'otp' && (
          <View style={styles.section}>
            <View style={styles.otpLabelRow}>
              <Text style={styles.label}>Kode Token</Text>
              {countdown > 0 && (
                <View style={[styles.countdownBadge, countdown <= 30 && styles.countdownUrgent]}>
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={13}
                    color={countdown <= 30 ? '#ef4444' : '#2563eb'}
                  />
                  <Text style={[styles.countdownText, countdown <= 30 && styles.countdownTextUrgent]}>
                    {formatCountdown(countdown)}
                  </Text>
                </View>
              )}
              {countdown === 0 && (
                <View style={styles.expiredBadge}>
                  <Text style={styles.expiredText}>Token Kadaluarsa</Text>
                </View>
              )}
            </View>

            <View style={styles.row}>
              <TextInput
                value={otp}
                onChangeText={text => {
                  setOtp(text);
                  // Reset verifikasi jika OTP diubah
                  if (otpVerified) {
                    setOtpVerified(false);
                    setOtpCheckMessage('');
                    setOtpCheckSuccess(false);
                    successAnim.setValue(0);
                  }
                }}
                maxLength={6}
                keyboardType="number-pad"
                placeholder="123456"
                placeholderTextColor="#8b8f97"
                style={[
                  styles.input,
                  styles.otpInput,
                  { flex: 1 },
                  otpCheckSuccess ? styles.inputValid : otpCheckMessage && !otpCheckSuccess ? styles.inputError : null,
                ]}
                editable={!checkingOtp && !otpVerified}
              />

              <TouchableOpacity
                style={[
                  styles.checkButton,
                  otpVerified && styles.checkButtonSuccess,
                  (otp.length !== 6 || checkingOtp) && styles.disabledButton,
                ]}
                onPress={handleCheckOtp}
                disabled={otp.length !== 6 || checkingOtp || otpVerified}
              >
                {checkingOtp ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : otpVerified ? (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#16a34a" />
                ) : (
                  <Text style={styles.checkText}>Check</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OTP check feedback */}
            {otpCheckMessage !== '' && (
              <Animated.View
                style={[
                  styles.otpFeedback,
                  otpCheckSuccess ? styles.otpFeedbackSuccess : styles.otpFeedbackError,
                  { opacity: otpCheckSuccess ? successAnim : 1 },
                ]}
              >
                <Text style={[styles.otpFeedbackText, otpCheckSuccess ? styles.otpFeedbackTextSuccess : styles.otpFeedbackTextError]}>
                  {otpCheckMessage}
                </Text>
              </Animated.View>
            )}

            {/* Kirim ulang */}
            <Text style={styles.smallText}>
              Tidak menerima kode?{' '}
              <Text
                style={[styles.linkText, !canResend && styles.linkTextDisabled]}
                onPress={() => canResend && handleSendToken(true)}
              >
                {canResend
                  ? 'Kirim Ulang Token'
                  : `Kirim ulang dalam ${formatCountdown(countdown)}`}
              </Text>
            </Text>
          </View>
        )}

        {/* SECURITY INFO */}
        <View style={styles.tipCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Tips Keamanan</Text>
            <Text style={styles.tipDesc}>
              Gunakan kombinasi huruf besar, kecil, angka dan simbol agar kata sandi lebih aman.
            </Text>
          </View>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* BOTTOM BUTTON */}
      <View style={styles.bottomWrap}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSavePassword}
          disabled={!canSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.saveText}>Simpan Kata Sandi</Text>
              <MaterialCommunityIcons
                name={otpVerified ? 'shield-check' : 'shield-lock-outline'}
                size={22}
                color="#ffffff"
              />
            </>
          )}
        </TouchableOpacity>
        {!otpVerified && (
          <Text style={styles.saveCaptionText}>
            {step === 'form' ? 'Kirim token dan verifikasi dulu sebelum menyimpan' : 'Verifikasi token terlebih dahulu'}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#191c1e',
    marginBottom: 8,
  },

  pageDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#434655',
    marginBottom: 24,
  },

  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    alignSelf: 'center',
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  section: {
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#434655',
    marginBottom: 10,
  },

  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  countdownUrgent: {
    backgroundColor: '#fee2e2',
  },

  countdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    fontVariant: ['tabular-nums'],
  },

  countdownTextUrgent: {
    color: '#ef4444',
  },

  expiredBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  expiredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  input: {
    backgroundColor: '#e0e3e5',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: '#191c1e',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  inputValid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },

  inputError: {
    backgroundColor: '#fff5f5',
    borderColor: '#ef4444',
  },

  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },

  primaryButtonSmall: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonSmallText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  checkButton: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkButtonSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#16a34a',
  },

  checkText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.4,
  },

  otpInput: {
    textAlign: 'center',
    letterSpacing: 6,
    fontWeight: '800',
  },

  otpFeedback: {
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },

  otpFeedbackSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  otpFeedbackError: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  otpFeedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },

  otpFeedbackTextSuccess: {
    color: '#16a34a',
  },

  otpFeedbackTextError: {
    color: '#ef4444',
  },

  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },

  successText: {
    marginTop: 6,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },

  smallText: {
    marginTop: 10,
    fontSize: 12,
    color: '#737686',
  },

  linkText: {
    color: '#2563eb',
    fontWeight: '700',
  },

  linkTextDisabled: {
    color: '#9ca3af',
  },

  tipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#eef4ff',
    padding: 16,
    borderRadius: 20,
    marginTop: 10,
  },

  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 4,
  },

  tipDesc: {
    fontSize: 12,
    color: '#434655',
    lineHeight: 18,
  },

  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(247,249,251,0.97)',
    gap: 6,
  },

  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    elevation: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    elevation: 0,
    shadowOpacity: 0,
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  saveCaptionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  bgTop: {
    position: 'absolute',
    top: 60,
    right: -90,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.05)',
  },

  bgBottom: {
    position: 'absolute',
    bottom: 100,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(0,110,45,0.05)',
  },
});