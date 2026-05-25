import { useAuth } from "@/context/AuthContext";
import { ACCENT_COLORS, useAppTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Edit3,
  Languages,
  LogOut,
  Moon,
  Palette,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULT_AVATAR = "https://i.pravatar.cc/300?img=15";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { accentColor, setAccentColor } = useAppTheme();

  const [darkMode, setDarkMode] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedColor, setSelectedColor] = useState(accentColor);

  const avatarStorageKey = useMemo(
    () => `profile_avatar_${user?.id ?? "guest"}`,
    [user?.id]
  );

  const fallbackAvatarUri = user?.photo_url || DEFAULT_AVATAR;
  const displayAvatarUri = avatarUri || fallbackAvatarUri;
  const displayName = user?.name || "Pengguna SAKU";
  const displayEmail = user?.email || "email@belum-terdaftar.com";

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(avatarStorageKey).then((stored) => {
      if (isMounted) setAvatarUri(stored || fallbackAvatarUri);
    }).catch(() => {
      if (isMounted) setAvatarUri(fallbackAvatarUri);
    });
    return () => { isMounted = false; };
  }, [avatarStorageKey, fallbackAvatarUri]);

  // Keep local selectedColor in sync if accentColor changes externally
  useEffect(() => {
    setSelectedColor(accentColor);
  }, [accentColor]);

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Izin Ditolak", "Aplikasi membutuhkan izin galeri untuk mengganti foto profil.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      await AsyncStorage.setItem(avatarStorageKey, selectedUri);
    } catch {
      Alert.alert("Gagal", "Foto profil belum berhasil diganti. Coba lagi.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveColor = async () => {
    await setAccentColor(selectedColor);
    Alert.alert("Tersimpan", "Warna aksen berhasil diperbarui!");
  };

  const handleLogout = () => {
    Alert.alert("Keluar Sesi", "Yakin ingin keluar dari akun ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await logout();
            router.replace("/login");
          } catch {
            Alert.alert("Gagal", "Logout gagal. Silakan coba lagi.");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fb" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayAvatarUri }} style={[styles.avatar, { borderColor: accentColor }]} />
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: accentColor }]}
              onPress={handlePickImage}
              disabled={isPickingImage}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Edit3 size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        {/* Settings */}
        <View style={styles.list}>
          <View style={styles.card}>
            <View style={styles.rowLeft}>
              <Moon size={20} color={accentColor} />
              <Text style={styles.cardTitle}>Mode Gelap</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#dfe3e7", true: accentColor }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.card}>
            <View style={styles.rowLeft}>
              <Languages size={20} color="#22c55e" />
              <Text style={styles.cardTitle}>Bahasa</Text>
            </View>
            <Text style={styles.valueText}>Indonesia (ID)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.rowLeft}>
              <Wallet size={20} color="#ef4444" />
              <Text style={styles.cardTitle}>Mata Uang</Text>
            </View>
            <Text style={styles.valueText}>Rupiah (IDR)</Text>
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        <View style={[styles.colorCard, { borderColor: accentColor }]}>
          <View style={styles.rowLeft}>
            <Palette size={20} color={accentColor} />
            <Text style={styles.colorTitle}>Aksen Warna</Text>
          </View>

          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((c) => {
              const isSelected = selectedColor === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setSelectedColor(c.value)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.value },
                    isSelected && styles.colorSwatchSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={styles.checkMark} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.colorPreviewRow}>
            <View style={[styles.colorPreviewDot, { backgroundColor: selectedColor }]} />
            <Text style={styles.colorPreviewLabel}>
              {ACCENT_COLORS.find((c) => c.value === selectedColor)?.label ?? "Custom"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveColorBtn, { backgroundColor: selectedColor }]}
            onPress={handleSaveColor}
            activeOpacity={0.85}
          >
            <Text style={styles.saveColorText}>Simpan Warna</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#d52022" />
          ) : (
            <>
              <LogOut size={18} color="#d52022" />
              <Text style={styles.logoutText}>Keluar Sesi</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>VERSION 1.0 • SAKU</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fb",
  },

  profileSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },

  editBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    marginTop: 15,
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },

  list: {
    paddingHorizontal: 20,
    gap: 12,
  },

  card: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  valueText: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },

  colorCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    borderWidth: 2,
  },

  colorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },

  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  checkMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },

  colorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },

  colorPreviewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  colorPreviewLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },

  saveColorBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  saveColorText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  logoutBtnDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    color: "#d52022",
    fontWeight: "800",
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    color: "#999",
    marginTop: 30,
    marginBottom: 40,
    letterSpacing: 1,
  },
});