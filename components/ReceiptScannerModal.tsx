/**
 * Receipt Scanner Modal
 * Captures receipt image using camera and processes with OCR
 */

import { processReceiptImage, ReceiptData } from "@/services/receiptService";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

interface ReceiptScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onReceiptScanned: (data: ReceiptData) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  visible,
  onClose,
  onReceiptScanned,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null);

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== "granted" || galleryStatus !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Camera access is required for receipt scanning",
          );
        }
      }
    })();
  }, []);

  /**
   * Launch camera to capture receipt
   */
  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await processReceipt(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error(error);
    }
  };

  /**
   * Pick image from gallery
   */
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        await processReceipt(imageUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  /**
   * Process receipt image with OCR
   */
  const processReceipt = async (imageUri: string) => {
    try {
      setIsProcessing(true);

      // Process with Tesseract OCR
      const result = await processReceiptImage(imageUri);

      console.log("Receipt processing result:", result);

      // Validate result - be more lenient
      // Accept if:
      // 1. Has a total amount (primary goal)
      // 2. OR has items detected
      // 3. OR has meaningful OCR text with decent confidence
      const hasValidData =
        result.totalAmount ||
        result.items.length > 0 ||
        (result.rawText &&
          result.rawText.trim().length > 20 &&
          result.confidence > 30);

      if (!hasValidData) {
        Alert.alert(
          "Scan Tidak Berhasil",
          "Foto struk tidak terlalu jelas. Coba:\n• Ambil foto dengan pencahayaan lebih baik\n• Pastikan struk tidak buram atau rusak\n• Posisikan struk lebih tegak",
          [
            { text: "Coba Ulang", onPress: () => handleReset() },
            { text: "Batal" },
          ],
        );
        setSelectedImage(null);
        setIsProcessing(false);
        return;
      }

      setScannedData(result);
      setIsProcessing(false);
    } catch (error: any) {
      console.error("Receipt processing error:", error);
      const msg =
        error?.message || "Gagal memproses gambar struk";
      Alert.alert("Scan Gagal", msg, [
        { text: "Coba Ulang", onPress: () => handleReset() },
        { text: "Tutup" },
      ]);
      setSelectedImage(null);
      setIsProcessing(false);
    }
  };

  /**
   * Confirm and use scanned receipt data
   */
  const handleConfirm = () => {
    if (scannedData) {
      onReceiptScanned(scannedData);
      handleReset();
      onClose();
    }
  };

  /**
   * Reset state and retry
   */
  const handleReset = () => {
    setSelectedImage(null);
    setScannedData(null);
    setIsProcessing(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan Struk</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!selectedImage ? (
            // Selection Screen
            <View style={styles.selectionContainer}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📸</Text>
              </View>
              <Text style={styles.instructionTitle}>Ambil Foto Struk</Text>
              <Text style={styles.instructionText}>
                Posisikan struk dengan baik dan pastikan semua teks terlihat
                jelas
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleTakePhoto}
              >
                <Text style={styles.primaryBtnText}>📷 Ambil Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: COLORS.white,
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                  },
                ]}
                onPress={handlePickImage}
              >
                <Text
                  style={[styles.primaryBtnText, { color: COLORS.primary }]}
                >
                  🖼️ Pilih dari Galeri
                </Text>
              </TouchableOpacity>
            </View>
          ) : isProcessing ? (
            // Processing Screen
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>Memproses struk...</Text>
              <Text style={styles.processingSubText}>
                Teknologi AI mengenali teks dari foto Anda
              </Text>
            </View>
          ) : scannedData ? (
            // Results Screen
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Hasil Scan Struk</Text>
                <Text style={styles.confidenceText}>
                  Akurasi: {Math.round(scannedData.confidence)}%
                </Text>
              </View>

              {/* Total Amount */}
              {scannedData.totalAmount && (
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Jumlah Total</Text>
                  <Text style={styles.totalAmount}>
                    Rp {scannedData.totalAmount.toLocaleString("id-ID")}
                  </Text>
                </View>
              )}

              {/* Items List */}
              {scannedData.items.length > 0 && (
                <View style={styles.itemsSection}>
                  <Text style={styles.itemsTitle}>Item Pembelian</Text>
                  {scannedData.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>
                      {item.amount && (
                        <Text style={styles.itemAmount}>
                          Rp {item.amount.toLocaleString("id-ID")}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Raw OCR Text (for reference) */}
              {scannedData.rawText && (
                <View style={styles.rawTextSection}>
                  <Text style={styles.rawTextTitle}>Teks Mentah (OCR)</Text>
                  <View style={styles.rawTextBox}>
                    <Text style={styles.rawText} numberOfLines={5}>
                      {scannedData.rawText}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: COLORS.white,
                      borderWidth: 2,
                      borderColor: COLORS.border,
                    },
                  ]}
                  onPress={() => {
                    handleReset();
                    handlePickImage();
                  }}
                >
                  <Text style={[styles.actionBtnText, { color: COLORS.text }]}>
                    Scan Ulang
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleConfirm}
                >
                  <Text style={styles.actionBtnText}>✓ Gunakan Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
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
    fontSize: 24,
    color: COLORS.text,
    fontWeight: "600",
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

  // Selection Screen
  selectionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  icon: {
    fontSize: 40,
  },

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

  // Processing Screen
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

  // Results Screen
  resultsContainer: {
    paddingBottom: 20,
  },

  resultHeader: {
    marginBottom: 20,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  confidenceText: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: "500",
  },

  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  totalLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 6,
  },

  totalAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
  },

  itemsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  itemsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  itemLeft: {
    flex: 1,
    marginRight: 12,
  },

  itemDesc: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },

  itemAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },

  rawTextSection: {
    marginBottom: 16,
  },

  rawTextTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  rawTextBox: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  rawText: {
    fontSize: 12,
    color: COLORS.textSoft,
    lineHeight: 18,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },

  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.white,
  },
});
