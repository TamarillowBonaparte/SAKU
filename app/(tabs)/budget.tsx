import { getCategoryMeta } from "@/constants/categories";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import {
    MaterialIcons
} from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
//           {/* ── Summary Card ── */}
//           <View style={styles.header}>
//             <View style={styles.summaryCard}>
//               <View style={styles.summaryCardInner}>
//                 <Text style={styles.summaryLabel}>Total Terpakai Bulan Ini</Text>

//                 <View style={{ marginBottom: 16 }}>
//                   <Text style={styles.summaryAmount}>
//                     Rp {totalSpent.toLocaleString('id-ID')}
//                   </Text>
//                 </View>

//                 <View style={styles.progressContainer}>
//                   <View style={styles.progressBarBg}>
//                     <View
//                       style={[
//                         styles.progressBarFill,
//                         { width: `${Math.min(totalPercentage, 100)}%` },
//                       ]}
//                     />
//                   </View>
//                   <Text style={styles.progressText}>{totalPercentage.toFixed(0)}%</Text>
//                 </View>

//                 <Text style={styles.remainingText}>
//                   Sisa anggaran aman: Rp {remainingBudget.toLocaleString('id-ID')}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* ── Category Header ── */}
//           <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
//             <Text style={styles.sectionHeader}>Kategori Anggaran</Text>
//           </View>

//           {/* ── Budget Grid ── */}
//           <View style={styles.gridContainer}>
//             {sorted.map((item) => {
//               const spent = item.daily_limit || 0;
//               const limit = item.daily_limit || 0;
//               const percentage = limit > 0 ? (spent / limit) * 100 : 0;
//               const { status, color } = getStatusColor(percentage);
//               const remaining = limit - spent;
//               const icon = getCategoryIcon(item.category?.name || '');

//               return (
//                 <View key={item.id?.toString()} style={styles.gridItem}>
//                   <View style={styles.budgetItem}>
//                     {/* Header with icon and status */}
//                     <View style={styles.budgetItemHeader}>
//                       <View
//                         style={[
//                           styles.iconWrapper,
//                           color === COLORS.success && styles.iconWrapperSuccess,
//                           color === COLORS.warning && styles.iconWrapperWarning,
//                           color === COLORS.error && styles.iconWrapperError,
//                         ]}
//                       >
//                         <Text style={styles.iconText}>{icon}</Text>
//                       </View>

//                       <View
//                         style={[
//                           styles.statusBadge,
//                           color === COLORS.success && styles.statusBadgeSuccess,
//                           color === COLORS.warning && styles.statusBadgeWarning,
//                           color === COLORS.error && styles.statusBadgeError,
//                         ]}
//                       >
//                         <Text
//                           style={[
//                             styles.statusBadgeText,
//                             color === COLORS.success && styles.statusBadgeTextSuccess,
//                             color === COLORS.warning && styles.statusBadgeTextWarning,
//                             color === COLORS.error && styles.statusBadgeTextError,
//                           ]}
//                         >
//                           {status}
//                         </Text>
//                       </View>
//                     </View>

//                     {/* Title */}
//                     <Text style={styles.budgetTitle}>{item.category?.name}</Text>

//                     {/* Amount */}
//                     <View style={styles.budgetAmountContainer}>
//                       <Text style={styles.amountLabel}>Rp</Text>
//                       <Text style={styles.amountValue}>{formatAmount(spent)}</Text>
//                       <Text style={styles.amountLimit}>/ Rp {formatAmount(limit)}</Text>
//                     </View>

//                     {/* Progress Bar */}
//                     <View style={styles.progressBar}>
//                       <View
//                         style={[
//                           styles.progressFill,
//                           color === COLORS.warning && styles.progressFillWarning,
//                           color === COLORS.error && styles.progressFillError,
//                           { width: `${Math.min(percentage, 100)}%` },
//                         ]}
//                       />
//                     </View>

//                     {/* Footer with percentage and remaining */}
//                     <View style={styles.budgetFooter}>
//                       <Text style={styles.percentageText}>
//                         Terpakai {percentage.toFixed(0)}%
//                       </Text>
//                       <Text
//                         style={[
//                           styles.remainingAmount,
//                           color === COLORS.warning && styles.remainingAmountWarning,
//                           color === COLORS.error && styles.remainingAmountError,
//                         ]}
//                       >
//                         {remaining < 0 ? `Minus Rp ${Math.abs(remaining).toLocaleString('id-ID')}` : `Sisa Rp ${remaining.toLocaleString('id-ID')}`}
//                       </Text>
//                     </View>

//                     {/* Delete Button */}
//                     <TouchableOpacity
//                       style={styles.deleteButton}
//                       onPress={() => handleDelete(item.id)}
//                       activeOpacity={0.7}
//                     >
//                       <Text style={styles.deleteButtonText}>HAPUS</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>

//           {/* ── Tips Section ── */}
//           <View style={styles.tipsContainer}>
//             <View style={styles.tipsCard}>
//               <Text style={styles.tipsIcon}>💡</Text>
//               <View style={styles.tipsContent}>
//                 <Text style={styles.tipsTitle}>Tips Pengelolaan Anggaran</Text>
//                 <Text style={styles.tipsText}>
//                   {totalPercentage > 100
//                     ? 'Total anggaran Anda sudah melebihi batas. Pertimbangkan untuk mengurangi pengeluaran di kategori tertentu.'
//                     : totalPercentage > 80
//                     ? `Anda sudah menggunakan ${totalPercentage.toFixed(0)}% dari total anggaran. Hati-hati dengan pengeluaran selanjutnya!`
//                     : 'Pengelolaan anggaran Anda sangat baik! Terus jaga disiplin finansial Anda.'}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </ScrollView>
//       )}
//     </View>
//   );
// }







const BLUE = "#004ac6";
const GREEN = "#22C55E";
const RED = "#ef4444";
const WARNING = "#EAB308";
const BG = "#f7f9fb";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#191c1e";
const TEXT_SECONDARY = "rgba(25, 28, 30, 0.55)";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  headerLeft: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  addButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: BLUE,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 16,
  },
  summaryCurrency: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  budgetItem: {
    backgroundColor: CARD_BG,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  budgetItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  budgetItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
  },
  categoryEmoji: {
    fontSize: 20,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  budgetDate: {
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  budgetActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "rgba(0, 74, 198, 0.1)",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  budgetAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  budgetMax: {
    fontSize: 11,
    fontWeight: "500",
    color: TEXT_SECONDARY,
  },
  progressBar2: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  budgetStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f0f4ff",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: BLUE,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

interface BudgetItemProps {
  budget: any;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function BudgetItemCard({ budget, onEdit, onDelete }: BudgetItemProps) {
  const categoryMeta = getCategoryMeta(budget.category?.name || "DEFAULT");
  const categoryName = budget.category?.name || "Unknown";
  const limit = budget.daily_limit || 0;
  const percentage = (100 / limit) * limit;
  
  let statusColor = GREEN;
  let statusText = "Aman";
  
  if (percentage > 100) {
    statusColor = RED;
    statusText = "Melebihi";
  } else if (percentage > 80) {
    statusColor = WARNING;
    statusText = "Hampir Habis";
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}jt`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}rb`;
    }
    return amount.toString();
  };

  return (
    <View style={styles.budgetItem}>
      <View style={styles.budgetItemTop}>
        <View style={styles.budgetItemLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryMeta.bg }]}>
            <Text style={styles.categoryEmoji}>{categoryMeta.emoji}</Text>
          </View>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetName}>{categoryName}</Text>
            <Text style={styles.budgetDate}>{formatDate(budget.date)}</Text>
          </View>
        </View>
        <View style={styles.budgetActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(budget.id)}
          >
            <MaterialIcons name="edit" size={16} color={BLUE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(budget.id)}
          >
            <MaterialIcons name="delete-outline" size={16} color={RED} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.budgetAmount}>
        <Text style={styles.budgetLabel}>Rp</Text>
        <Text style={styles.budgetValue}>{formatAmount(limit)}</Text>
      </View>

      <View style={styles.progressBar2}>
        <View
          style={[
            { height: "100%", width: `${Math.min(percentage, 100)}%`, backgroundColor: statusColor, borderRadius: 3 },
          ]}
        />
      </View>

      <View style={styles.budgetStatus}>
        <Text style={styles.statusText}>Penggunaan {percentage.toFixed(0)}%</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { budgets, isLoading, loadBudgets, deleteBudget } = useBudgetStore();
  const { loadCategories } = useCategoryStore();

  const loadData = useCallback(async () => {
    await Promise.all([loadBudgets(), loadCategories()]);
  }, [loadBudgets, loadCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEdit = (id: number) => {
    router.push({
      pathname: "/add-budget",
      params: { editId: id },
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Hapus Budget",
      "Yakin ingin menghapus budget ini? Tindakan ini tidak dapat dibatalkan.",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          onPress: async () => {
            try {
              await deleteBudget(id);
              Alert.alert("✅ Berhasil", "Budget telah dihapus");
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || "Gagal menghapus budget";
              Alert.alert("❌ Gagal", errorMsg);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const totalLimit = budgets.reduce((sum, b) => sum + (b.daily_limit || 0), 0);
  const totalUsed = budgets.reduce((sum, b) => sum + 0, 0);
  const totalPercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}jt`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}rb`;
    }
    return amount.toString();
  };

  if (isLoading && budgets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Keuangan</Text>
          <Text style={styles.title}>Budget</Text>
        </View>
        <Link href="/add-budget" asChild>
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BLUE} />}
      >
        {/* Summary Card */}
        {budgets.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Budget Harian</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryCurrency}>Rp</Text>
              <Text style={styles.summaryAmount}>{formatAmount(totalLimit)}</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(totalPercentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Penggunaan {totalPercentage.toFixed(0)}% • Sisa Rp{" "}
                {formatAmount(totalLimit - totalUsed)}
              </Text>
            </View>
          </View>
        )}

        {/* Budget List */}
        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyTitle}>Belum Ada Budget</Text>
            <Text style={styles.emptyText}>
              Tap tombol Tambah untuk membuat{"\n"}budget pertamamu
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>Daftar Budget</Text>
            {budgets.map((budget) => (
              <BudgetItemCard
                key={budget.id}
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}