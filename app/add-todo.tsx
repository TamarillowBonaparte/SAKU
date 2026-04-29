import { useTodoStore } from "@/store/useTodoStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function AddReminderScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { addTodo, updateTodo, todos } = useTodoStore();

  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Reminder notification states
  const [reminderType, setReminderType] = useState<"1hour" | "2hours" | "custom">("1hour");
  const [customReminderValue, setCustomReminderValue] = useState(1);
  const [customReminderUnit, setCustomReminderUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [showCustomReminderPicker, setShowCustomReminderPicker] = useState(false);

  // Helper to format date to YYYY-MM-DD
  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTimeForApi = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Helper functions for reminder settings
  const saveReminderSettings = async () => {
    try {
      const reminderSettings = {
        type: reminderType,
        customValue: customReminderValue,
        customUnit: customReminderUnit,
      };
      await AsyncStorage.setItem("todoReminderSettings", JSON.stringify(reminderSettings));
    } catch (error) {
      console.error("Error saving reminder settings:", error);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("todoReminderSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        setReminderType(settings.type || "1hour");
        setCustomReminderValue(settings.customValue || 1);
        setCustomReminderUnit(settings.customUnit || "hours");
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    }
  };

  const getReminderDescription = () => {
    if (reminderType === "1hour") return "1 jam sebelumnya";
    if (reminderType === "2hours") return "2 jam sebelumnya";
    return `${customReminderValue} ${
      customReminderUnit === "minutes"
        ? "menit"
        : customReminderUnit === "hours"
        ? "jam"
        : "hari"
    } sebelumnya`;
  };

  const getReminderOffsetMinutes = () => {
    if (reminderType === "1hour") return 60;
    if (reminderType === "2hours") return 120;
    if (customReminderUnit === "minutes") return customReminderValue;
    if (customReminderUnit === "hours") return customReminderValue * 60;
    return customReminderValue * 24 * 60;
  };

  const parseDateValue = (value?: string) => {
    if (!value) {
      return new Date();
    }

    const trimmedValue = value.trim();
    const directDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (directDateMatch) {
      const year = Number(directDateMatch[1]);
      const month = Number(directDateMatch[2]);
      const day = Number(directDateMatch[3]);
      const parsedDate = new Date(year, month - 1, day);

      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    const parsedDate = new Date(trimmedValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
    }

    return new Date();
  };

  const parseTimeValue = (value?: string) => {
    if (!value) {
      return new Date();
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    const [hoursText, minutesText] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    const timeDate = new Date();
    timeDate.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return timeDate;
  };

  // If editing, load the existing todo
  React.useEffect(() => {
    loadReminderSettings();
    if (editId) {
      const todo = todos.find((t) => t.id === Number(editId));
      if (todo) {
        setTitle(todo.title);
        setSelectedDate(parseDateValue(todo.date));
        setSelectedTime(parseTimeValue(todo.time));
        setNotify(!todo.is_done);
      }
    }
  }, [editId, todos]);

  const handleSave = async () => {
    // Validate input
    if (!title.trim()) {
      Alert.alert("Error", "Judul pengingat tidak boleh kosong");
      return;
    }

    setLoading(true);
    try {
      // Save reminder settings locally
      await saveReminderSettings();

      if (editId) {
        await updateTodo(Number(editId), {
          title,
          date: formatDateForApi(selectedDate),
          time: formatTimeForApi(selectedTime),
          is_done: !notify,
          notify_enabled: notify,
          reminder_offset_minutes: getReminderOffsetMinutes(),
        });
        Alert.alert("Success", "Reminder berhasil diupdate");
      } else {
        await addTodo({
          title,
          date: formatDateForApi(selectedDate),
          time: formatTimeForApi(selectedTime),
          is_done: false,
          notify_enabled: notify,
          reminder_offset_minutes: getReminderOffsetMinutes(),
        });
        Alert.alert("Success", "Reminder berhasil ditambahkan");
      }
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Gagal menyimpan reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F9FB" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#2563EB" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {editId ? "Edit Reminder" : "Tambah Reminder"}
          </Text>
        </View>

        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6r9K6khsmXS22KzqNYP02lcUGooYokfLveDMyUBezsR3k0yqNC9CnEMRqDPk7TUDSaPYpf-5UTEQHx5CtsmtnumOQwyB2MtXX0bYAsva0Mz9XMvT3ug0R5gBwT14ZZP0-26O7-OZVWk1MiUFmMDjN6odLFO9JuhTLLb2AImU-O2kXO5vNpRPsqLIQblUaNZRnhKFwLRxktRErLbDdIVPrJosstpCQUDE0h29hxuLKMlXaILTTBiwQie3oXqUpUBrm0S3AlwqOkQ4",
          }}
          style={styles.avatar}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Illustration */}
        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn3cZsKv1o35gGPhaJixk8NbSlYpJ3wwATvGKxnn3Mw_AETebi5V0P1R19KtR0oQtBKpUcQLypkFEfILxpEqF3DLtVGAMyaPG604rbFFOyp4AZNbnJY3InnoKptzea5nLos4qOqjiBf0hE1ip4QPGblKpfgJkdSW5iMQr2A2P5O3Neagyq1LLaJD3gVXyVhraQj-Ge90wEtDRALflj2DRHeXPt2F6XAwsexM3jwrWjgM2WQg-wyL0bYEEcvqT1Hf6e0P5uRP19x24",
              }}
              style={styles.heroImage}
            />
          </View>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.label}>Judul Event</Text>
          <View style={styles.inputWrap}>
            <MaterialIcons name="edit-note" size={22} color="#9CA3AF" />
            <TextInput
              placeholder="Masukkan nama pengingat..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
          </View>

          {/* Date Time */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tanggal</Text>
              <TouchableOpacity
                style={styles.inputWrap}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color="#9CA3AF"
                />
                <Text style={[styles.input, { color: "#111827" }]}>
                  {selectedDate.toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ width: 14 }} />

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Waktu</Text>
              <TouchableOpacity
                style={styles.inputWrap}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                <Text style={[styles.input, { color: "#111827" }]}>
                  {formatTimeForDisplay(selectedTime)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification */}
          <View style={styles.notifyBox}>
            <View style={styles.notifyLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#2563EB"
              />
              <Text style={styles.notifyText}>Ingatkan saya</Text>
            </View>

            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ false: "#D1D5DB", true: "#2563EB" }}
              thumbColor="#fff"
            />
          </View>

          {/* Reminder Notification Settings */}
          {notify && (
            <View style={styles.reminderSettingsContainer}>
              <Text style={styles.label}>Kapan Ingatkan?</Text>
              
              {/* Quick Options */}
              <View style={styles.reminderOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.reminderOption,
                    reminderType === "1hour" && styles.reminderOptionActive,
                  ]}
                  onPress={() => {
                    setReminderType("1hour");
                    saveReminderSettings();
                  }}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === "1hour" && styles.reminderOptionTextActive,
                    ]}
                  >
                    H-1 Jam
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.reminderOption,
                    reminderType === "2hours" && styles.reminderOptionActive,
                  ]}
                  onPress={() => {
                    setReminderType("2hours");
                    saveReminderSettings();
                  }}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === "2hours" && styles.reminderOptionTextActive,
                    ]}
                  >
                    H-2 Jam
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.reminderOption,
                    reminderType === "custom" && styles.reminderOptionActive,
                  ]}
                  onPress={() => setReminderType("custom")}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === "custom" && styles.reminderOptionTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Custom Reminder Picker */}
              {reminderType === "custom" && (
                <View style={styles.customReminderSection}>
                  <TouchableOpacity
                    style={styles.customReminderButton}
                    onPress={() => setShowCustomReminderPicker(true)}
                  >
                    <MaterialIcons name="schedule" size={18} color="#2563EB" />
                    <Text style={styles.customReminderButtonText}>
                      {getReminderDescription()}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Current Reminder Display */}
              <View style={styles.reminderDisplayBox}>
                <Ionicons name="alarm" size={16} color="#2563EB" />
                <Text style={styles.reminderDisplayText}>
                  Notifikasi akan dikirim {getReminderDescription()}
                </Text>
              </View>
            </View>
          )}

          {/* Custom Reminder Picker Modal */}
          <Modal
            visible={showCustomReminderPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCustomReminderPicker(false)}
          >
            <View style={styles.pickerModalOverlay}>
              <View style={styles.pickerModalContent}>
                <View style={styles.pickerModalHeader}>
                  <TouchableOpacity onPress={() => setShowCustomReminderPicker(false)}>
                    <Text style={styles.pickerModalCancel}>Batal</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerModalTitle}>Atur Waktu Pengingat</Text>
                  <TouchableOpacity
                    onPress={() => {
                      saveReminderSettings();
                      setShowCustomReminderPicker(false);
                    }}
                  >
                    <Text style={styles.pickerModalConfirm}>Selesai</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pickerContainer}>
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Jumlah</Text>
                    <Picker
                      selectedValue={customReminderValue}
                      onValueChange={(value: any) => setCustomReminderValue(value)}
                      style={styles.picker}
                    >
                      {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                        <Picker.Item key={num} label={num.toString()} value={num} />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Satuan</Text>
                    <Picker
                      selectedValue={customReminderUnit}
                      onValueChange={(value: any) =>
                        setCustomReminderUnit(value as "minutes" | "hours" | "days")
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Menit" value="minutes" />
                      <Picker.Item label="Jam" value="hours" />
                      <Picker.Item label="Hari" value="days" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {editId ? "Update Reminder" : "Simpan Reminder"}
                </Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* DATE PICKER untuk iOS */}
          {Platform.OS === "ios" && showDatePicker && (
            <View style={styles.iosDatePickerContainer}>
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosDatePickerCancel}>Batal</Text>
                </TouchableOpacity>
                <Text style={styles.iosDatePickerTitle}>Pilih Tanggal</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosDatePickerConfirm}>Selesai</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                textColor="#2563EB"
              />
            </View>
          )}

          {/* DATE PICKER untuk Android */}
          {Platform.OS === "android" && showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setSelectedDate(date);
                }
              }}
            />
          )}

          {/* TIME PICKER untuk iOS */}
          {Platform.OS === "ios" && showTimePicker && (
            <View style={styles.iosDatePickerContainer}>
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosDatePickerCancel}>Batal</Text>
                </TouchableOpacity>
                <Text style={styles.iosDatePickerTitle}>Pilih Waktu</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.iosDatePickerConfirm}>Selesai</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={(event, timeValue) => {
                  if (timeValue) {
                    setSelectedTime(timeValue);
                  }
                }}
                textColor="#2563EB"
              />
            </View>
          )}

          {/* TIME PICKER untuk Android */}
          {Platform.OS === "android" && showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={(event, timeValue) => {
                setShowTimePicker(false);
                if (event.type === "set" && timeValue) {
                  setSelectedTime(timeValue);
                }
              }}
            />
          )}
        </View>

        {/* Help */}
        <Text style={styles.helpText}>
          Kami akan mengirimkan notifikasi pada perangkat Anda saat waktu
          pengingat tiba.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FB",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  heroWrap: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },

  heroCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  heroImage: {
    width: 110,
    height: 110,
    resizeMode: "contain",
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    shadowColor: "#2563EB",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  inputWrap: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
  },

  row: {
    flexDirection: "row",
    marginTop: 6,
  },

  notifyBox: {
    marginTop: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  notifyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  notifyText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  button: {
    marginTop: 24,
    backgroundColor: "#2563EB",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },

  helpText: {
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 35,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },

  iosDatePickerContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  iosDatePickerCancel: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },

  iosDatePickerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

    iosDatePickerConfirm: {
      fontSize: 16,
      color: "#2563EB",
      fontWeight: "700",
    },

    // Reminder Settings Styles
    reminderSettingsContainer: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },

    reminderOptionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      marginBottom: 16,
    },

    reminderOption: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: "#F3F4F6",
      borderWidth: 2,
      borderColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },

    reminderOptionActive: {
      backgroundColor: "#DBEAFE",
      borderColor: "#2563EB",
    },

    reminderOptionText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6B7280",
      textAlign: "center",
    },

    reminderOptionTextActive: {
      color: "#2563EB",
      fontWeight: "700",
    },

    customReminderSection: {
      marginBottom: 16,
    },

    customReminderButton: {
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },

    customReminderButtonText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: "#111827",
    },

    reminderDisplayBox: {
      backgroundColor: "#EEF2FF",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    reminderDisplayText: {
      fontSize: 13,
      color: "#2563EB",
      fontWeight: "600",
      flex: 1,
    },

    pickerModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },

    pickerModalContent: {
      backgroundColor: "#fff",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 20,
    },

    pickerModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },

    pickerModalCancel: {
      fontSize: 14,
      color: "#6B7280",
      fontWeight: "600",
    },

    pickerModalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111827",
    },

    pickerModalConfirm: {
      fontSize: 14,
      color: "#2563EB",
      fontWeight: "700",
    },

    pickerContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 20,
    },

    pickerSection: {
      flex: 1,
    },

    pickerLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#6B7280",
      marginBottom: 10,
      textTransform: "uppercase",
    },

    picker: {
      height: 150,
    },
  });
