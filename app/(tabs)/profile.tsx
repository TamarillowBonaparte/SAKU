import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Bell,
  Edit3,
  Languages,
  LogOut,
  Moon,
  Palette,
  Plus,
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
  const [darkMode, setDarkMode] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

    const loadAvatar = async () => {
      try {
        const storedAvatar = await AsyncStorage.getItem(avatarStorageKey);
        if (!isMounted) {
          return;
        }

        setAvatarUri(storedAvatar || fallbackAvatarUri);
      } catch {
        if (isMounted) {
          setAvatarUri(fallbackAvatarUri);
        }
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [avatarStorageKey, fallbackAvatarUri]);

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Izin Ditolak",
          "Aplikasi membutuhkan izin galeri untuk mengganti foto profil."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      await AsyncStorage.setItem(avatarStorageKey, selectedUri);
    } catch {
      Alert.alert("Gagal", "Foto profil belum berhasil diganti. Coba lagi.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Keluar Sesi", "Yakin ingin keluar dari akun ini?", [
      {
        text: "Batal",
        style: "cancel",
      },
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: displayAvatarUri }}
            style={styles.smallAvatar}
          />
          <Text style={styles.logo}>SAKU</Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={22} color="#44474a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: displayAvatarUri }}
              style={styles.avatar}
            />

            <TouchableOpacity
              style={styles.editBtn}
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
              <Moon size={20} color="#004ac6" />
              <Text style={styles.cardTitle}>Mode Gelap</Text>
            </View>

            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#dfe3e7", true: "#2563eb" }}
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

        {/* Accent */}
        <View style={styles.colorCard}>
          <View style={styles.rowLeft}>
            <Palette size={20} color="#004ac6" />
            <Text style={styles.colorTitle}>Aksen Warna</Text>
          </View>

          <View style={styles.colorRow}>
            <TouchableOpacity style={styles.activeColor} />

            <TouchableOpacity style={styles.addColor}>
              <Plus size={16} color="#888" />
            </TouchableOpacity>
          </View>
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

        <Text style={styles.version}>
          VERSION 1.O • SAKU
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fb",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  smallAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#2563eb",
  },

  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#004ac6",
  },

  iconBtn: {
    padding: 8,
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
  },

  editBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#004ac6",
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
    borderColor: "#2563eb",
  },

  colorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  colorRow: {
    flexDirection: "row",
    marginTop: 18,
    alignItems: "center",
  },

  activeColor: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#004ac6",
    marginRight: 14,
  },

  addColor: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
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