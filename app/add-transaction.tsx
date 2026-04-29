import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { getCategoryMeta } from "@/constants/categories";
import { ReceiptData } from "@/services/receiptService";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Palet warna ──────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#F2F4F7",
  white: "#FFFFFF",
  primary: "#1B4FD8",
  danger: "#E8323A",
  success: "#16A34A",
  text: "#111827",
  textSoft: "#9CA3AF",
  border: "#E5E7EB",
};

// ─── Helper format Rupiah ──────────────────────────────────────────────────────
const formatRupiah = (val: string) => {
  const numeric = val.replace(/[^0-9]/g, "");
  if (!numeric) return "";
  return parseInt(numeric, 10).toLocaleString("id-ID");
};
const parseAmount = (val: string) => val.replace(/\./g, "").replace(/,/g, "");

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateFromApi = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month, day);
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return new Date();
};

export default function AddTransactionScreen() {
  const params = useLocalSearchParams();
  const transactionId = params?.id ? parseInt(params.id as string, 10) : null;
  const isEditing = !!transactionId;

  const {
    addTransaction,
    updateTransaction,
    loadTransactions,
    isLoading: isAddingTransaction,
    transactions,
  } = useTransactionStore();
  const { loadBudgets } = useBudgetStore();
  const {
    loadCategories,
    getCategoriesByType,
    isLoading: isCategoriesLoading,
  } = useCategoryStore();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  const availableCategories = getCategoriesByType(type);
  const selectedCategory = availableCategories.find(
    (c) => c.id === selectedCategoryId,
  );
  const selectedMeta = selectedCategory
    ? getCategoryMeta(selectedCategory.name)
    : null;

  useEffect(() => {
    if (isEditing && transactions.length === 0) {
      loadTransactions();
    }
  }, [isEditing, transactions.length, loadTransactions]);

  // Load current transaction data if editing
  useEffect(() => {
    if (isEditing) {
      const transaction = transactions.find((t) => t.id === transactionId);
      if (transaction) {
        setNote(transaction.title);
        setAmount(formatRupiah(transaction.amount.toString()));
        setType(transaction.type);
        setSelectedCategoryId(transaction.category_id);
        setSelectedDate(parseDateFromApi(transaction.date));
      }
    }
  }, [isEditing, transactionId, transactions]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (availableCategories.length > 0 && !selectedCategoryId && !isEditing) {
      setSelectedCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, selectedCategoryId, isEditing]);

  const handleTypeChange = (val: "income" | "expense") => {
    setType(val);
    if (!isEditing) {
      setSelectedCategoryId(null);
    }
  };

  const handleAmountChange = (val: string) => {
    const raw = parseAmount(val);
    if (raw === "" || /^\d+$/.test(raw)) setAmount(formatRupiah(raw));
  };

  /**
   * Handle receipt scanner data
   */
  const handleReceiptScanned = (receiptData: ReceiptData) => {
    // Set amount if found
    if (receiptData.totalAmount) {
      setAmount(formatRupiah(receiptData.totalAmount.toString()));
    }

    // Set note from items description
    if (receiptData.items.length > 0) {
      const itemDescriptions = receiptData.items
        .map((item) => item.description)
        .filter((desc) => desc.length > 0)
        .slice(0, 3) // Take first 3 items
        .join(", ");

      if (itemDescriptions) {
        setNote(itemDescriptions);
      }
    }

    // Auto-select category if expense
    if (availableCategories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(availableCategories[0].id);
    }

    Alert.alert(
      "Berhasil! 📸",
      "Data struk berhasil diambil. Silakan periksa kembali sebelum menyimpan.",
    );
  };

  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert("Oops!", "Catatan tidak boleh kosong");
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert("Oops!", "Silakan pilih kategori");
      return;
    }
    const rawAmount = parseAmount(amount);
    if (!rawAmount || isNaN(parseFloat(rawAmount))) {
      Alert.alert("Oops!", "Jumlah tidak valid");
      return;
    }
    try {
      if (isEditing && transactionId) {
        await updateTransaction(transactionId, {
          title: note.trim(),
          amount: parseFloat(rawAmount),
          type,
          category_id: selectedCategoryId,
          date: formatDateForApi(selectedDate),
        });
        await loadBudgets();
        Alert.alert("Berhasil 🎉", "Transaksi berhasil diperbarui", [
          { text: "OK", onPress: () => router.navigate("/(tabs)/transaction") },
        ]);
      } else {
        await addTransaction({
          title: note.trim(),
          amount: parseFloat(rawAmount),
          type,
          category_id: selectedCategoryId,
          date: formatDateForApi(selectedDate),
        });
        await loadBudgets();
        Alert.alert("Berhasil 🎉", "Transaksi berhasil ditambahkan", [
          { text: "OK", onPress: () => router.navigate("/(tabs)") },
        ]);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        (isEditing
          ? "Gagal memperbarui transaksi"
          : "Gagal menambahkan transaksi");
      Alert.alert("Error", errorMsg);
    }
  };

  const isLoading = isAddingTransaction || isCategoriesLoading;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* NOMINAL */}
        <View style={styles.nominalSection}>
          <Text style={styles.nominalLabel}>NOMINAL TRANSAKSI</Text>
          <View style={styles.nominalRow}>
            <Text style={styles.rpLabel}>Rp</Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.text}
              style={styles.nominalInput}
            />
          </View>
        </View>

        {/* TOGGLE TIPE */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              type === "expense" && { backgroundColor: COLORS.danger },
            ]}
            onPress={() => handleTypeChange("expense")}
          >
            {type === "expense" && <View style={styles.toggleDot} />}
            <Text
              style={[
                styles.toggleText,
                type === "expense" && { color: "#fff", fontWeight: "700" },
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              type === "income" && { backgroundColor: COLORS.success },
            ]}
            onPress={() => handleTypeChange("income")}
          >
            {type === "income" && <View style={styles.toggleDot} />}
            <Text
              style={[
                styles.toggleText,
                type === "income" && { color: "#fff", fontWeight: "700" },
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* SCAN STRUK */}
        <TouchableOpacity
          style={styles.scanBtn}
          activeOpacity={0.85}
          onPress={() => setShowReceiptScanner(true)}
        >
          <View style={styles.scanIconWrap}>
            <Text style={styles.scanIconText}>⊞</Text>
          </View>
          <View style={styles.scanTextWrap}>
            <Text style={styles.scanTitle}>Scan Struk</Text>
            <Text style={styles.scanSub}>Auto-input dengan AI</Text>
          </View>
          <Text style={styles.scanArrow}>›</Text>
        </TouchableOpacity>

        {/* KATEGORI */}
        <TouchableOpacity
          style={styles.inputCard}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputCardLabel}>KATEGORI</Text>
          <View style={styles.categoryRow}>
            <View
              style={[
                styles.catIconBox,
                { backgroundColor: selectedMeta?.bg ?? "#F3F4F6" },
              ]}
            >
              <Text style={{ fontSize: 16 }}>
                {selectedMeta?.emoji ?? "📦"}
              </Text>
            </View>
            <Text style={styles.categoryValue}>
              {selectedCategory ? selectedCategory.name : "Pilih Kategori"}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* CATATAN */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardLabel}>CATATAN</Text>
          <TextInput
            placeholder="Misal: Makan siang di Senopati..."
            placeholderTextColor={COLORS.textSoft}
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.noteInput}
          />
        </View>

        {/* TANGGAL */}
        <TouchableOpacity
          style={styles.inputCard}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputCardLabel}>TANGGAL</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateValue}>
              {selectedDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text style={{ fontSize: 18 }}>📅</Text>
          </View>
        </TouchableOpacity>

        {/* DATE PICKER untuk iOS (Spinner) */}
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
              textColor={COLORS.primary}
            />
          </View>
        )}

        {/* SIMPAN */}
        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.saveBtnIcon}>✓</Text>
              <Text style={styles.saveBtnText}>
                {isEditing ? "Perbarui Transaksi" : "Simpan Transaksi"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL PILIH KATEGORI — bottom sheet dengan grid ikon
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        {/* Overlay — tap untuk tutup */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          {/* Sheet — cegah tap-through */}
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
            {/* Drag handle */}
            <View style={styles.modalHandle} />

            {/* Header: judul + tombol tambah */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity style={styles.addCatBtn} activeOpacity={0.75}>
                <Text style={styles.addCatBtnText}>+ Tambah</Text>
              </TouchableOpacity>
            </View>

            {/* Grid kategori — scrollable */}
            {isCategoriesLoading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginVertical: 32 }}
              />
            ) : availableCategories.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada kategori tersedia</Text>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContainer}
              >
                {availableCategories.map((item) => {
                  const active = item.id === selectedCategoryId;
                  const meta = getCategoryMeta(item.name);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.gridItem, active && styles.gridItemActive]}
                      onPress={() => {
                        setSelectedCategoryId(item.id);
                        setShowCategoryModal(false);
                      }}
                      activeOpacity={0.75}
                    >
                      {/* Kotak ikon berwarna */}
                      <View
                        style={[
                          styles.gridIconBox,
                          { backgroundColor: meta.bg },
                        ]}
                      >
                        <Text style={styles.gridEmoji}>{meta.emoji}</Text>
                      </View>
                      {/* Label */}
                      <Text
                        style={[
                          styles.gridLabel,
                          active && {
                            color: COLORS.primary,
                            fontWeight: "700",
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {item.name.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          DATE PICKER — calendar view (Android)
      ════════════════════════════════════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════════════════════════════════════
          RECEIPT SCANNER MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <ReceiptScannerModal
        visible={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onReceiptScanned={handleReceiptScanned}
      />
    </View>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backArrow: {
    fontSize: 26,
    color: COLORS.text,
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },

  scroll: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },

  // Nominal
  nominalSection: { marginBottom: 20 },
  nominalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSoft,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  nominalRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  rpLabel: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  nominalInput: {
    fontSize: 52,
    fontWeight: "800",
    color: COLORS.text,
    minWidth: 100,
    padding: 0,
  },

  // Toggle
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  toggleText: { fontSize: 14, fontWeight: "500", color: COLORS.textSoft },

  // Scan
  scanBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    gap: 14,
  },
  scanIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanIconText: { fontSize: 20, color: "#fff" },
  scanTextWrap: { flex: 1 },
  scanTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  scanSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  scanArrow: { color: "#fff", fontSize: 22, fontWeight: "300" },

  // Input card
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSoft,
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  // Kategori row (card utama)
  categoryRow: { flexDirection: "row", alignItems: "center" },
  catIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  categoryValue: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  chevron: { fontSize: 22, color: COLORS.textSoft },

  // Catatan
  noteInput: {
    fontSize: 15,
    color: COLORS.text,
    minHeight: 56,
    textAlignVertical: "top",
    padding: 0,
  },

  // Tanggal
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateValue: { fontSize: 15, fontWeight: "600", color: COLORS.text },

  // Save
  saveBtn: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  // ── Modal bottom sheet ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    paddingTop: 14,
    maxHeight: "65%", // bisa scroll kalau kategori banyak
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  addCatBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
  },
  addCatBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  // ── Grid kategori di dalam modal ────────────────────────────────────────────
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 8,
  },
  gridItem: {
    // ~3 kolom dengan gap 12 di dalam padding 20+20
    width: "30%",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  gridItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EEF2FF",
  },
  gridIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridEmoji: { fontSize: 26 },
  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: 0.3,
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.textSoft,
    paddingVertical: 24,
    fontSize: 14,
  },

  // ── iOS Date Picker ────────────────────────────────────────────────────────
  iosDatePickerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iosDatePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  iosDatePickerCancel: {
    fontSize: 16,
    color: COLORS.textSoft,
  },
  iosDatePickerConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
