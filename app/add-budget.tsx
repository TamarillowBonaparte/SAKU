import { getCategoryMeta } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function AddDailyBudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const editId = params.editId ? parseInt(params.editId as string) : null;

  // Form state
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Store hooks
  const { addBudget, updateBudget, budgets, isLoading } = useBudgetStore();
  const { categories, loadCategories } = useCategoryStore();

  // Load data on mount
  useEffect(() => {
    loadCategories();
    
    // If editing, load budget data
    if (editId) {
      const budgetToEdit = budgets.find(b => b.id === editId);
      if (budgetToEdit) {
        setAmount(budgetToEdit.daily_limit.toString());
        setSelectedCategory(budgetToEdit.category);
        setSelectedDate(new Date(budgetToEdit.date));
      }
    }
  }, [editId, loadCategories]);

  // Filter expense categories
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const handleDateChange = () => {
    // For simplicity, increment date by 1 day. In a real app, use a date picker library
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Silakan masukkan jumlah yang valid");
      return false;
    }
    if (!selectedCategory) {
      setError("Silakan pilih kategori");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const dateStr = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (editId) {
        // Update existing budget
        await updateBudget(editId, {
          daily_limit: parseFloat(amount),
          category_id: selectedCategory.id,
          date: dateStr,
        });
        Alert.alert("✅ Berhasil", "Budget telah diperbarui");
      } else {
        // Create new budget
        await addBudget({
          category_id: selectedCategory.id,
          daily_limit: parseFloat(amount),
          date: dateStr,
        });
        Alert.alert("✅ Berhasil", "Budget telah ditambahkan");
      }

      // Navigate back after successful save
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Gagal menyimpan budget";
      Alert.alert("❌ Gagal", errorMsg);
      console.error("Save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (amount || note || selectedCategory) {
      Alert.alert("Batalkan?", "Perubahan Anda akan hilang", [
        { text: "Lanjutkan", style: "cancel" },
        { text: "Batalkan", onPress: () => router.back(), style: "destructive" },
      ]);
    } else {
      router.back();
    }
  };

  const getCategoryIcon = (categoryName: string): string => {
    const meta = getCategoryMeta(categoryName);
    return meta.emoji;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const avatarText = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fb" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {editId ? "Edit Budget" : "Tambah Budget"}
          </Text>
        </View>

        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{avatarText}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Card */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.labelTop}>DAILY LIMIT</Text>

            <View style={styles.amountRow}>
              <Text style={styles.rp}>Rp</Text>

              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                style={styles.amountInput}
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Kategori</Text>

            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowCategoryModal(true)}
              disabled={isSubmitting}
            >
              <View style={styles.selectLeft}>
                <View style={styles.iconBox}>
                  <Text style={styles.categoryEmoji}>
                    {selectedCategory ? getCategoryIcon(selectedCategory.name) : "📦"}
                  </Text>
                </View>

                <Text style={styles.selectText}>
                  {selectedCategory ? selectedCategory.name : "Pilih Kategori"}
                </Text>
              </View>

              <MaterialIcons
                name="keyboard-arrow-down"
                size={24}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Tanggal Mulai</Text>

            <TouchableOpacity
              style={styles.inputBox}
              onPress={handleDateChange}
              disabled={isSubmitting}
            >
              <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
              <Text style={styles.inputText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveText}>
                {editId ? "Perbarui Budget" : "Simpan Budget"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelText}>Batalkan</Text>
          </TouchableOpacity>
        </View>

        {/* Tip */}
        <View style={styles.tipBox}>
          <MaterialIcons name="info" size={22} color="#15803d" />

          <Text style={styles.tipText}>
            <Text style={{ fontWeight: "700" }}>💡 Tips:</Text> Atur budget
            harian untuk setiap kategori pengeluaran agar pengelolaan keuangan
            lebih teratur.
          </Text>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kategori</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={expenseCategories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory?.id === item.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text style={styles.categoryItemEmoji}>
                    {getCategoryIcon(item.name)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedCategory?.id === item.id && { color: "#004ac6" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedCategory?.id === item.id && (
                    <MaterialIcons name="check-circle" size={20} color="#004ac6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f9fb",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    paddingHorizontal: 18,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#004ac6",
  },

  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#004ac6",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 28,
    padding: 22,
    shadowColor: "#004ac6",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  amountSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  labelTop: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#6b7280",
    marginBottom: 8,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  rp: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563eb",
    marginRight: 6,
    marginBottom: 6,
  },

  amountInput: {
    fontSize: 42,
    fontWeight: "900",
    color: "#111827",
    minWidth: 180,
    textAlign: "center",
  },

  fieldWrap: {
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    marginLeft: 4,
  },

  selectBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  categoryEmoji: {
    fontSize: 20,
  },

  selectText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  inputBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  inputText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  noteInput: {
    flex: 1,
    marginLeft: 10,
  },

  saveBtn: {
    backgroundColor: "#004ac6",
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 12,
    alignItems: "center",
  },

  cancelText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },

  tipBox: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: "#ecfdf5",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  tipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },

  /* Category Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 0,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  categoryItemSelected: {
    backgroundColor: "#f0f4ff",
  },

  categoryItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },

  categoryItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});