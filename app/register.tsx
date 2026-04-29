import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { registerUser, registerSendOTP } from "../services/api";

const RESEND_COOLDOWN = 20; // detik

const Register = () => {
  const router = useRouter();

  // ─── Form fields ───────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ─── Loading / Status ─────────────────────────────────────────
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);

  // ─── Countdown resend (20 detik) ───────────────────────────────
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────
  const startResendCountdown = () => {
    setResendCountdown(RESEND_COOLDOWN);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkPasswordMatch = (pwd: string, confirmPwd: string) => {
    if (confirmPwd && pwd !== confirmPwd) {
      setPasswordError("Password tidak sama");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    checkPasswordMatch(password, text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    checkPasswordMatch(text, confirmPassword);
  };

  // ─── Kirim OTP ──────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Harap masukkan email terlebih dahulu");
      return;
    }
    
    // Validasi format email dasar
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Error", "Format email tidak valid");
      return;
    }

    setLoadingSendOtp(true);
    try {
      await registerSendOTP(email);
      startResendCountdown();
      Alert.alert("OTP Terkirim", `Kode OTP telah dikirim ke ${email}. Masa berlaku 1 menit.`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Gagal mengirim OTP";
      Alert.alert("Error", message);
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // ─── Daftar Akun ────────────────────────────────────────────────
  const handleRegister = async () => {
    if (passwordError || !email || !password || !confirmPassword || !name || !otp) return;
    
    setLoadingRegister(true);
    try {
      // API register langsung memverifikasi OTP + mengaktifkan akun
      await registerUser(name, email, password, otp);
      
      Alert.alert(
        "Akun Aktif! 🎉",
        "Pendaftaran berhasil! Akun Anda langsung aktif dan siap digunakan.",
        [{ text: "Masuk Sekarang", onPress: () => router.replace("/login") }]
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Pendaftaran gagal";
      Alert.alert("Gagal Daftar", message);
    } finally {
      setLoadingRegister(false);
    }
  };

  const isFormValid =
    !passwordError && !!name && !!email && !!password && !!confirmPassword && password === confirmPassword && !!otp;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Title */}
      <Text style={styles.title}>Mulai Langkah Baru</Text>
      <Text style={styles.subtitle}>
        Kelola keuangan anda dengan baik, dengan masuk menjadi bagian dari SAKU!
      </Text>

      {/* Nama Lengkap */}
      <Text style={styles.label}>Nama Lengkap</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan nama lengkap"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      {/* Email + Tombol Kirim OTP */}
      <Text style={styles.label}>Email</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Masukkan email aktif"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={[styles.otpBtn, (resendCountdown > 0 || loadingSendOtp) ? styles.otpBtnDisabled : null]}
          onPress={handleSendOTP}
          disabled={resendCountdown > 0 || loadingSendOtp}
        >
          {loadingSendOtp ? (
             <ActivityIndicator color="#2563eb" size="small" />
          ) : (
            <Text style={[styles.otpText, (resendCountdown > 0) ? styles.otpTextDisabled : null]}>
              {resendCountdown > 0 ? `Tunggu ${resendCountdown}s` : "Kirim OTP"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ marginBottom: 10 }} />

      {/* Kode OTP */}
      <Text style={styles.label}>Kode OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="000000"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
      />

      {/* Kata Sandi */}
      <Text style={styles.label}>Kata Sandi</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Buat kata sandi"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={handlePasswordChange}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showBtn}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginBottom: 10 }} />

      {/* Konfirmasi Password */}
      <Text style={styles.label}>Konfirmasi Password</Text>
      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Ulangi password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={handleConfirmPasswordChange}
      />
      {passwordError ? (
        <Text style={styles.errorText}>{passwordError}</Text>
      ) : null}

      {/* Button Daftar */}
      <TouchableOpacity
        style={[
          styles.button,
          (!isFormValid || loadingRegister) ? styles.buttonDisabled : null,
        ]}
        disabled={!isFormValid || loadingRegister}
        onPress={handleRegister}
      >
        {loadingRegister ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Daftar Sekarang</Text>
        )}
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Sudah punya akun? <Text style={styles.link} onPress={() => router.replace("/login")}>Masuk</Text>
      </Text>
    </ScrollView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
    color: "#111",
  },
  subtitle: {
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  inputError: {
    borderWidth: 2,
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  otpBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  otpBtnDisabled: {
    borderColor: "#9ca3af",
    backgroundColor: "#f3f4f6",
  },
  otpText: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  otpTextDisabled: {
    color: "#9ca3af",
  },
  showBtn: {
    marginLeft: 10,
    color: "#2563eb",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  link: {
    color: "#2563eb",
    fontWeight: "bold",
  },
});