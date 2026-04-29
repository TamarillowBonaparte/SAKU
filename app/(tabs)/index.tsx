import { useAuth } from '@/context/AuthContext';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const BLUE = '#004ac6';
const GREEN = '#006e2d';
const RED = '#ae0010';
const BG = '#f0f4ff';
const CARD_BG = '#ffffff';
const TEXT_PRIMARY = '#191c1e';
const TEXT_SECONDARY = 'rgba(25, 28, 30, 0.55)';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  headerGreeting: {
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSub: {
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  /* Scrollable Content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  /* Hero Card */
  heroCard: {
    marginBottom: 20,
    paddingVertical: 28,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: BLUE,
    elevation: 6,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroCurrency: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
  },
  heroSubRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  /* Two Column Cards */
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    elevation: 2,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
  },
  cardCurrency: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  cardAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  incomeAmount: { color: GREEN },
  expenseAmount: { color: RED },
  /* Budget Section */
  sectionCard: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    marginBottom: 20,
    elevation: 2,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  viewAllButton: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: BLUE,
  },
  budgetAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  budgetRemaining: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  budgetTotal: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e6e8ea',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  /* Transaction item */
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: BG,
    marginBottom: 10,
    borderRadius: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  transactionDate: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountIncome: { color: GREEN },
  amountExpense: { color: RED },
  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
});

// ─── Format Helper ───────────────────────────────────────────────
function formatAmount(amount: number): string {
  const n = amount || 0;
  if (n >= 1_000_000) {
    const juta = n / 1_000_000;
    return `${parseFloat(juta.toFixed(1)).toString()}jt`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}rb`;
  }
  return n.toLocaleString('id-ID');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const transactions = useTransactionStore((s) => s.transactions);
  const isTransactionLoading = useTransactionStore((s) => s.isLoading);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const budgets = useBudgetStore((s) => s.budgets);
  const isBudgetLoading = useBudgetStore((s) => s.isLoading);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);

  const isLoading = isTransactionLoading || isBudgetLoading;

  const loadData = useCallback(async () => {
    await Promise.all([loadBudgets(), loadTransactions()]);
  }, [loadBudgets, loadTransactions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ── Calculations ──────────────────────────────────────────────
  const safeTransactions = transactions || [];

  const totalIncome = safeTransactions
    .filter((t) => t.type?.toLowerCase() === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = safeTransactions
    .filter((t) => t.type?.toLowerCase() === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpenses;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayExpenses = safeTransactions
    .filter((t) => {
      if (t.type?.toLowerCase() !== 'expense') return false;
      const tDate = t.date ? t.date.split('T')[0] : '';
      return tDate === today;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const safeBudgets = budgets || [];
  const totalDailyLimit =
    safeBudgets.length > 0
      ? safeBudgets.reduce((sum, b) => sum + (b.daily_limit || 0), 0)
      : 0;
  const dailyBudgetRemaining = Math.max(0, totalDailyLimit - todayExpenses);
  const dailyBudgetPercent = totalDailyLimit > 0 ? (todayExpenses / totalDailyLimit) * 100 : 0;
  const isOverBudget = dailyBudgetPercent > 100;

  const recentTransactions = [...safeTransactions]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 3);

  const getTransactionIcon = (type: string, _category?: string): string => {
    if (type?.toLowerCase() === 'income') return '🏦';
    return '🛒';
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const userName = user?.name || 'Pengguna';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.headerGreeting}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerSub}>Selamat datang 👋</Text>
          </View>
        </View>
        <Pressable style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={BLUE} />
        </Pressable>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={BLUE} />}
      >
        {/* Hero Card - Saldo */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Saldo Saat Ini</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>Rp</Text>
            <Text style={styles.heroAmount}>{formatAmount(totalBalance)}</Text>
          </View>
          <View style={styles.heroSubRow}>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatDot, { backgroundColor: '#4ade80' }]} />
              <Text style={styles.heroStatText}>Masuk Rp {formatAmount(totalIncome)}</Text>
            </View>
            <View style={styles.heroStat}>
              <View style={[styles.heroStatDot, { backgroundColor: '#f87171' }]} />
              <Text style={styles.heroStatText}>Keluar Rp {formatAmount(totalExpenses)}</Text>
            </View>
          </View>
        </View>

        {/* Uang Masuk & Pengeluaran */}
        <View style={styles.twoColumnGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.cardTop}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="arrow-down" size={18} color={GREEN} />
              </View>
              <Text style={styles.cardLabel}>Masuk</Text>
            </View>
            <Text style={styles.cardCurrency}>Rp</Text>
            <Text style={[styles.cardAmount, styles.incomeAmount]}>
              {formatAmount(totalIncome)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.cardTop}>
              <View style={[styles.cardIconContainer, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="arrow-up" size={18} color={RED} />
              </View>
              <Text style={styles.cardLabel}>Keluar</Text>
            </View>
            <Text style={styles.cardCurrency}>Rp</Text>
            <Text style={[styles.cardAmount, styles.expenseAmount]}>
              {formatAmount(totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Budget Harian */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Budget Harian</Text>
            <Link href="/(tabs)/budget" asChild>
              <Pressable>
                <Text style={styles.viewAllButton}>Atur →</Text>
              </Pressable>
            </Link>
          </View>

          {totalDailyLimit === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={36}
                color={TEXT_SECONDARY}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>Belum ada budget ditetapkan.{'\n'}Tap "Atur" untuk mulai.</Text>
            </View>
          ) : (
            <>
              <View style={styles.budgetAmountRow}>
                <View>
                  <Text style={styles.cardCurrency}>Sisa hari ini</Text>
                  <Text style={styles.budgetRemaining}>Rp {formatAmount(dailyBudgetRemaining)}</Text>
                </View>
                <Text style={styles.budgetTotal}>dari Rp {formatAmount(totalDailyLimit)}</Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(dailyBudgetPercent, 100)}%`,
                      backgroundColor: isOverBudget ? RED : BLUE,
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetStatusRow}>
                <MaterialCommunityIcons
                  name={isOverBudget ? 'alert-circle' : 'check-circle'}
                  size={14}
                  color={isOverBudget ? RED : GREEN}
                />
                <Text style={[styles.budgetStatusText, { color: isOverBudget ? RED : TEXT_SECONDARY }]}>
                  {isOverBudget
                    ? 'Budget hari ini melebihi batas!'
                    : 'Pemakaian masih dalam batas aman.'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Catatan Terakhir */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Catatan Terakhir</Text>
            <Link href="/(tabs)/transaction" asChild>
              <Pressable>
                <Text style={styles.viewAllButton}>Lihat Semua →</Text>
              </Pressable>
            </Link>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={36}
                color={TEXT_SECONDARY}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>Belum ada transaksi.{'\n'}Tap + untuk mencatat.</Text>
            </View>
          ) : (
            recentTransactions.map((transaction, index) => (
              <View key={transaction.id || index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIconContainer}>
                    <Text style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.type)}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName} numberOfLines={1}>
                      {transaction.title || 'Transaksi'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type?.toLowerCase() === 'income'
                      ? styles.amountIncome
                      : styles.amountExpense,
                  ]}
                >
                  {transaction.type?.toLowerCase() === 'income' ? '+' : '-'} Rp{' '}
                  {formatAmount(transaction.amount || 0)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
