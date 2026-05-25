/**
 * Receipt Scanner Modal
 * Captures receipt image using camera and processes with OCR
 * Supports manual item add/edit after scanning
 */

import { processReceiptImage, ReceiptData, ReceiptItem } from "@/services/receiptService";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const COLORS = {
  bg: "#F2F4F7",
  white: "#FFFFFF",
  primary: "#1B4FD8",
  primaryLight: "#EEF2FF",
  danger: "#E8323A",
  dangerLight: "#FEF2F2",
  success: "#16A34A",
  successLight: "#F0FDF4",
  text: "#111827",
  textSoft: "#6B7280",
  border: "#E5E7EB",
};

interface ReceiptScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onReceiptScanned: (data: ReceiptData) => void;
}

// ─── Add Item Modal ────────────────────────────────────────────────────────
interface AddItemModalProps {
  visible: boolean;
  editItem?: ReceiptItem | null;
  onSave: (item: ReceiptItem) => void;
  onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ visible, editItem, onSave, onClose }) => {
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (editItem) {
      setDesc(editItem.description);
      setQty(editItem.qty?.toString() ?? "1");
      setPrice(editItem.amount?.toString() ?? "");
    } else {
      setDesc("");
      setQty("1");
      setPrice("");
    }
  }, [editItem, visible]);

  const handleSave = () => {
    const trimDesc = desc.trim();
    if (!trimDesc) {
      Alert.alert("Validasi", "Nama item tidak boleh kosong");
      return;
    }
    const parsedPrice = parseFloat(price.replace(/[^\d]/g, ""));
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Validasi", "Harga harus diisi dengan angka valid");
      return;
    }
    const parsedQty = parseInt(qty) || 1;
    onSave({
      description: trimDesc,
      qty: parsedQty,
      unitPrice: Math.round(parsedPrice / parsedQty),
      amount: parsedPrice,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.addModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>
                {editItem ? "Edit Item" : "Tambah Item Manual"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Item *</Text>
              <TextInput
                style={styles.input}
                value={desc}
                onChangeText={setDesc}
                placeholder="Contoh: Nasi Goreng"
                placeholderTextColor={COLORS.textSoft}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Qty</Text>
                <TextInput
                  style={styles.input}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={COLORS.textSoft}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>Harga Total (Rp) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="25000"
                  placeholderTextColor={COLORS.textSoft}
                />
              </View>
            </View>

            <View style={styles.addModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editItem ? "Simpan Perubahan" : "Tambah Item"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  visible,
  onClose,
  onReceiptScanned,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: ReceiptItem; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== "granted" || galleryStatus !== "granted") {
          Alert.alert("Permission Denied", "Camera access is required for receipt scanning");
        }
      }
    })();
  }, []);

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1.0,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Gagal mengambil foto");
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1.0,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await processReceipt(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Gagal memilih gambar");
    }
  };

  const processReceipt = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      const result = await processReceiptImage(imageUri);
      console.log("Receipt result:", JSON.stringify(result, null, 2));

      const hasValidData =
        result.totalAmount ||
        result.items.length > 0 ||
        (result.rawText && result.rawText.trim().length > 20 && result.confidence > 30);

      if (!hasValidData) {
        Alert.alert(
          "Scan Tidak Berhasil",
          "Foto struk tidak terlalu jelas. Coba:\n• Ambil foto dengan pencahayaan lebih baik\n• Pastikan struk tidak buram\n• Posisikan struk lebih tegak\n\nAnda bisa tetap tambah item manual.",
          [
            { text: "Coba Ulang", onPress: handleReset },
            {
              text: "Tambah Manual",
              onPress: () => {
                setScannedData(result);
                setItems([]);
                setIsProcessing(false);
              },
            },
          ]
        );
        setIsProcessing(false);
        return;
      }

      setScannedData(result);
      setItems([...result.items]);
      setIsProcessing(false);
    } catch (error: any) {
      Alert.alert("Scan Gagal", error?.message || "Gagal memproses gambar", [
        { text: "Coba Ulang", onPress: handleReset },
        { text: "Tutup" },
      ]);
      setSelectedImage(null);
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (scannedData) {
      // Recalculate total from items if no total from OCR
      let total = scannedData.totalAmount;
      if (!total && items.length > 0) {
        total = items.reduce((sum, it) => sum + (it.amount ?? 0), 0);
      }
      onReceiptScanned({ ...scannedData, items, totalAmount: total });
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScannedData(null);
    setItems([]);
    setIsProcessing(false);
    setEditingItem(null);
  };

  const handleAddItem = (item: ReceiptItem) => {
    if (editingItem !== null) {
      const updated = [...items];
      updated[editingItem.index] = item;
      setItems(updated);
      setEditingItem(null);
    } else {
      setItems((prev) => [...prev, item]);
    }
    setShowAddItem(false);
  };

  const handleDeleteItem = (index: number) => {
    Alert.alert("Hapus Item", "Hapus item ini dari daftar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleEditItem = (item: ReceiptItem, index: number) => {
    setEditingItem({ item, index });
    setShowAddItem(true);
  };

  const calculatedTotal = items.reduce((sum, it) => sum + (it.amount ?? 0), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan Struk</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!selectedImage ? (
            // ── Selection Screen ──
            <View style={styles.selectionContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📸</Text>
              </View>
              <Text style={styles.instructionTitle}>Ambil Foto Struk</Text>
              <Text style={styles.instructionText}>
                Posisikan struk dengan baik dan pastikan semua teks terlihat jelas
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleTakePhoto}>
                <Text style={styles.primaryBtnText}>📷 Ambil Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary }]}
                onPress={handlePickImage}
              >
                <Text style={[styles.primaryBtnText, { color: COLORS.primary }]}>
                  🖼️ Pilih dari Galeri
                </Text>
              </TouchableOpacity>
            </View>
          ) : isProcessing ? (
            // ── Processing Screen ──
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>Memproses struk...</Text>
              <Text style={styles.processingSubText}>AI mengenali teks dari foto Anda</Text>
            </View>
          ) : scannedData ? (
            // ── Results Screen ──
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Hasil Scan Struk</Text>
                <Text style={styles.confidenceText}>
                  Akurasi: {Math.round(scannedData.confidence)}%
                  {scannedData.storeName ? `  ·  ${scannedData.storeName}` : ""}
                </Text>
              </View>

              {/* Total Card */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>
                  {scannedData.totalAmount ? "Total dari Struk" : "Total dari Item"}
                </Text>
                <Text style={styles.totalAmount}>
                  Rp{" "}
                  {(scannedData.totalAmount ?? calculatedTotal).toLocaleString("id-ID")}
                </Text>
                {items.length > 0 && scannedData.totalAmount && (
                  <Text style={styles.totalSub}>
                    Total item: Rp {calculatedTotal.toLocaleString("id-ID")}
                  </Text>
                )}
              </View>

              {/* Items Section */}
              <View style={styles.itemsSection}>
                <View style={styles.itemsHeader}>
                  <Text style={styles.itemsTitle}>
                    Item Pembelian ({items.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.addItemBtn}
                    onPress={() => {
                      setEditingItem(null);
                      setShowAddItem(true);
                    }}
                  >
                    <Text style={styles.addItemBtnText}>+ Tambah</Text>
                  </TouchableOpacity>
                </View>

                {items.length === 0 ? (
                  <View style={styles.emptyItems}>
                    <Text style={styles.emptyItemsIcon}>🛒</Text>
                    <Text style={styles.emptyItemsText}>
                      Tidak ada item terdeteksi.{"\n"}Tambahkan item secara manual.
                    </Text>
                    <TouchableOpacity
                      style={styles.addItemInlineBtn}
                      onPress={() => {
                        setEditingItem(null);
                        setShowAddItem(true);
                      }}
                    >
                      <Text style={styles.addItemInlineBtnText}>+ Tambah Item Manual</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <TouchableOpacity
                        style={styles.itemLeft}
                        onPress={() => handleEditItem(item, index)}
                      >
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                        {item.qty && item.qty > 1 && (
                          <Text style={styles.itemQty}>
                            {item.qty} × Rp {item.unitPrice?.toLocaleString("id-ID")}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemRight}>
                        {item.amount && (
                          <Text style={styles.itemAmount}>
                            Rp {item.amount.toLocaleString("id-ID")}
                          </Text>
                        )}
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={styles.editItemBtn}
                            onPress={() => handleEditItem(item, index)}
                          >
                            <Text style={styles.editItemBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteItemBtn}
                            onPress={() => handleDeleteItem(index)}
                          >
                            <Text style={styles.deleteItemBtnText}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Raw OCR Text */}
              {scannedData.rawText && (
                <View style={styles.rawTextSection}>
                  <Text style={styles.rawTextTitle}>Teks OCR (referensi)</Text>
                  <View style={styles.rawTextBox}>
                    <Text style={styles.rawText} numberOfLines={6}>
                      {scannedData.rawText}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border }]}
                  onPress={() => {
                    handleReset();
                    handlePickImage();
                  }}
                >
                  <Text style={[styles.actionBtnText, { color: COLORS.text }]}>🔄 Scan Ulang</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { opacity: items.length === 0 && !scannedData.totalAmount ? 0.6 : 1 }]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.actionBtnText}>✓ Gunakan Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* Add / Edit Item Modal */}
      <AddItemModal
        visible={showAddItem}
        editItem={editingItem?.item ?? null}
        onSave={handleAddItem}
        onClose={() => {
          setShowAddItem(false);
          setEditingItem(null);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Selection ──
  selectionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  icon: { fontSize: 40 },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },

  // ── Processing ──
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 20,
  },
  processingSubText: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginTop: 8,
  },

  // ── Results ──
  resultsContainer: { paddingBottom: 20 },
  resultHeader: { marginBottom: 16 },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSoft,
  },

  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.white,
  },
  totalSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },

  itemsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  addItemBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyItems: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyItemsIcon: { fontSize: 36, marginBottom: 8 },
  emptyItemsText: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  addItemInlineBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addItemInlineBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLeft: { flex: 1, marginRight: 8 },
  itemDesc: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  itemQty: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  editItemBtn: {
    padding: 4,
  },
  editItemBtnText: { fontSize: 14 },
  deleteItemBtn: {
    padding: 4,
  },
  deleteItemBtnText: { fontSize: 14 },

  rawTextSection: { marginBottom: 16 },
  rawTextTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSoft,
    marginBottom: 6,
  },
  rawTextBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rawText: {
    fontSize: 11,
    color: COLORS.textSoft,
    lineHeight: 17,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },

  // ── Add Item Modal ──
  addModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  addModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  addModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addModalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  inputGroup: { marginBottom: 14 },
  inputRow: { flexDirection: "row" },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  addModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },
});
