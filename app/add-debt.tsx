import { useDebtStore } from '@/store/useDebtStore';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const COLORS = {
  bg: '#f0f4ff',
  card: '#ffffff',
  primary: '#004ac6',
  debt: '#ae0010',
  receivable: '#006e2d',
  text: '#191c1e',
  textSoft: 'rgba(25, 28, 30, 0.56)',
  border: '#e2e8f0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 12,
    color: COLORS.textSoft,
  },
  segmentWrap: {
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textSoft,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountCurrency: {
    fontSize: 26,
    fontWeight: '800',
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    paddingVertical: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reminderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reminderSub: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 2,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  iosDoneWrap: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  iosDoneText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  reminderOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  reminderOption: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderOptionActive: {
    backgroundColor: '#dbeafe',
    borderColor: COLORS.primary,
  },
  reminderOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  reminderOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  customReminderSection: {
    marginBottom: 12,
  },
  customReminderButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customReminderButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  reminderDisplayBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reminderDisplayText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerModalCancel: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '600',
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerModalConfirm: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSoft,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  picker: {
    height: 120,
  },
});

const formatRupiahInput = (raw: string) => {
  const numeric = raw.replace(/[^0-9]/g, '');
  if (!numeric) return '';
  return parseInt(numeric, 10).toLocaleString('id-ID');
};

const parseAmount = (value: string) => {
  return value.replace(/\./g, '').replace(/,/g, '');
};

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function AddDebtScreen() {
  const addDebt = useDebtStore((s) => s.addDebt);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const isLoading = useDebtStore((s) => s.isLoading);

  const [type, setType] = useState<'utang' | 'piutang'>('utang');
  const [nominal, setNominal] = useState('');
  const [namaCatatan, setNamaCatatan] = useState('');
  const [reminder, setReminder] = useState(true);
  const [tanggal, setTanggal] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reminder custom settings
  const [reminderType, setReminderType] = useState<'1day' | '3days' | 'custom'>('1day');
  const [customReminderValue, setCustomReminderValue] = useState(1);
  const [customReminderUnit, setCustomReminderUnit] = useState<'days' | 'weeks'>('days');
  const [showCustomReminderPicker, setShowCustomReminderPicker] = useState(false);

  const amountColor = useMemo(() => (type === 'utang' ? COLORS.debt : COLORS.receivable), [type]);

  const handleAmountChange = (value: string) => {
    const parsed = parseAmount(value);
    if (parsed === '' || /^\d+$/.test(parsed)) {
      setNominal(formatRupiahInput(parsed));
    }
  };

  const saveReminderSettings = async () => {
    try {
      const reminderSettings = {
        type: reminderType,
        customValue: customReminderValue,
        customUnit: customReminderUnit,
      };
      await AsyncStorage.setItem('debtReminderSettings', JSON.stringify(reminderSettings));
    } catch (error) {
      console.error('Error saving debt reminder settings:', error);
    }
  };

  const getReminderDescription = () => {
    if (reminderType === '1day') return 'H-1 Hari';
    if (reminderType === '3days') return 'H-3 Hari';
    return `H-${customReminderValue} ${customReminderUnit === 'days' ? 'Hari' : 'Minggu'}`;
  };

  const getReminderDays = () => {
    if (reminderType === '1day') return 1;
    if (reminderType === '3days') return 3;
    return customReminderUnit === 'weeks' ? customReminderValue * 7 : customReminderValue;
  };

  const handleSave = async () => {
    if (!namaCatatan.trim()) {
      Alert.alert('Oops', 'Nama catatan harus diisi');
      return;
    }

    const rawAmount = parseAmount(nominal);
    if (!rawAmount || Number.isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      Alert.alert('Oops', 'Nominal tidak valid');
      return;
    }

    const status = tanggal.getTime() < new Date().setHours(0, 0, 0, 0) ? 'jatuh_tempo' : 'aktif';

    try {
      // Save reminder settings if reminder is enabled
      if (reminder) {
        await saveReminderSettings();
      }

      await addDebt({
        name: namaCatatan.trim(),
        amount: Number(rawAmount),
        type,
        status,
        due_date: formatDateForApi(tanggal),
        notify_enabled: reminder,
        reminder_days: getReminderDays(),
      });

      await loadDebts();

      Alert.alert('Berhasil', 'Catatan berhasil disimpan', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/debt'),
        },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Gagal menyimpan catatan utang/piutang';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tambah Catatan Keuangan</Text>
        <Text style={styles.subtitle}>Kelola utang dan piutang Anda dengan mudah</Text>

        <View style={styles.segmentWrap}>
          <Pressable
            onPress={() => setType('utang')}
            style={[styles.segmentBtn, type === 'utang' && { backgroundColor: COLORS.debt }]}
          >
            <Text style={[styles.segmentText, type === 'utang' && { color: '#fff' }]}>Utang</Text>
          </Pressable>

          <Pressable
            onPress={() => setType('piutang')}
            style={[styles.segmentBtn, type === 'piutang' && { backgroundColor: COLORS.receivable }]}
          >
            <Text style={[styles.segmentText, type === 'piutang' && { color: '#fff' }]}>Piutang</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{type === 'utang' ? 'Nominal Utang' : 'Nominal Piutang'}</Text>

          <View style={styles.amountRow}>
            <Text style={[styles.amountCurrency, { color: amountColor }]}>Rp</Text>
            <TextInput
              value={nominal}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94a3b8"
              style={styles.amountInput}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nama Catatan</Text>

          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.textSoft} />
            <TextInput
              value={namaCatatan}
              onChangeText={setNamaCatatan}
              placeholder="Contoh: Utang ke Budi"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <View style={styles.reminderIconBox}>
                <MaterialCommunityIcons name="bell-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.reminderTitle}>Pengingat Pembayaran</Text>
                <Text style={styles.reminderSub}>Notifikasi sebelum jatuh tempo</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setReminder((prev) => !prev)}
              style={[styles.toggle, { backgroundColor: reminder ? COLORS.primary : '#cbd5e1' }]}
            >
              <View style={[styles.toggleKnob, { alignSelf: reminder ? 'flex-end' : 'flex-start' }]} />
            </Pressable>
          </View>

          {/* Reminder Type Options */}
          {reminder && (
            <>
              <View style={styles.reminderOptionsRow}>
                <Pressable
                  style={[
                    styles.reminderOption,
                    reminderType === '1day' && styles.reminderOptionActive,
                  ]}
                  onPress={() => setReminderType('1day')}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === '1day' && styles.reminderOptionTextActive,
                    ]}
                  >
                    H-1 Hari
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.reminderOption,
                    reminderType === '3days' && styles.reminderOptionActive,
                  ]}
                  onPress={() => setReminderType('3days')}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === '3days' && styles.reminderOptionTextActive,
                    ]}
                  >
                    H-3 Hari
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.reminderOption,
                    reminderType === 'custom' && styles.reminderOptionActive,
                  ]}
                  onPress={() => setReminderType('custom')}
                >
                  <Text
                    style={[
                      styles.reminderOptionText,
                      reminderType === 'custom' && styles.reminderOptionTextActive,
                    ]}
                  >
                    Custom
                  </Text>
                </Pressable>
              </View>

              {/* Custom Reminder Picker */}
              {reminderType === 'custom' && (
                <View style={styles.customReminderSection}>
                  <Pressable
                    style={styles.customReminderButton}
                    onPress={() => setShowCustomReminderPicker(true)}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.customReminderButtonText}>
                      {getReminderDescription()}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textSoft} />
                  </Pressable>
                </View>
              )}

              {/* Reminder Display */}
              <View style={styles.reminderDisplayBox}>
                <Ionicons name="alarm" size={16} color={COLORS.primary} />
                <Text style={styles.reminderDisplayText}>
                  Pengingat {getReminderDescription()} sebelum jatuh tempo
                </Text>
              </View>
            </>
          )}

          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>Jatuh tempo: {formatDateForDisplay(tanggal)}</Text>
            <MaterialCommunityIcons name="calendar-month" size={18} color={COLORS.primary} />
          </Pressable>

          {showDatePicker ? (
            <DateTimePicker
              value={tanggal}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date(2000, 0, 1)}
              onChange={(_, selectedDate) => {
                if (Platform.OS !== 'ios') {
                  setShowDatePicker(false);
                }

                if (selectedDate) {
                  setTanggal(selectedDate);
                }
              }}
            />
          ) : null}

          {showDatePicker && Platform.OS === 'ios' ? (
            <View style={styles.iosDoneWrap}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={styles.iosDoneText}>Selesai</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

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
                <Pressable onPress={() => setShowCustomReminderPicker(false)}>
                  <Text style={styles.pickerModalCancel}>Batal</Text>
                </Pressable>
                <Text style={styles.pickerModalTitle}>Atur Waktu Pengingat</Text>
                <Pressable
                  onPress={() => {
                    setShowCustomReminderPicker(false);
                  }}
                >
                  <Text style={styles.pickerModalConfirm}>Selesai</Text>
                </Pressable>
              </View>

              <View style={styles.pickerContainer}>
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Jumlah</Text>
                  <Picker
                    selectedValue={customReminderValue}
                    onValueChange={(value: any) => setCustomReminderValue(value)}
                    style={styles.picker}
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                      <Picker.Item key={num} label={num.toString()} value={num} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Satuan</Text>
                  <Picker
                    selectedValue={customReminderUnit}
                    onValueChange={(value: any) =>
                      setCustomReminderUnit(value as 'days' | 'weeks')
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Hari" value="days" />
                    <Picker.Item label="Minggu" value="weeks" />
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Pressable
          onPress={() => void handleSave()}
          disabled={isLoading}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>{isLoading ? 'Menyimpan...' : 'Simpan Catatan'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
