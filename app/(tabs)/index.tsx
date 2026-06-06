import { useAuth } from '@/context/AuthContext';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
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

const PRIMARY = '#004ac6';
const PRIMARY_LIGHT = '#2563eb';
const GREEN = '#006e2d';
const RED = '#ae0010';
const BG = '#f8faff';
const CARD = '#ffffff';
const TEXT = '#191c1e';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: SUBTEXT,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  headerName: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT,
  },

  notificationButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
  },

  /* HERO */
  heroCard: {
    backgroundColor: PRIMARY,
    borderRadius: 40,
    padding: 28,
    marginBottom: 28,
    overflow: 'hidden',
  },

  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 10,
  },

  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 30,
  },

  heroCurrency: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  heroAmount: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
  },

  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  heroStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },

  heroStatAmount: {
    fontSize: 15,
    fontWeight: '800',
  },

  incomeText: {
    color: '#7ffc97',
  },

  expenseText: {
    color: '#ffb4ab',
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },

  heroButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* SECTION */
  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT,
  },

  sectionButton: {
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY,
  },

  /* BUDGET */
  budgetCard: {
    backgroundColor: CARD,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  budgetCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 7,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  budgetPercent: {
    fontSize: 16,
    fontWeight: '900',
    color: PRIMARY,
  },

  budgetSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: SUBTEXT,
  },

  budgetInfo: {
    flex: 1,
  },

  budgetLabel: {
    fontSize: 11,
    color: SUBTEXT,
    fontWeight: '700',
    marginBottom: 6,
  },

  budgetAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: TEXT,
    marginBottom: 4,
  },

  budgetLimit: {
    fontSize: 11,
    color: SUBTEXT,
  },

  /* TRANSACTION */
  transactionCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },

  transactionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT,
  },

  transactionDate: {
    fontSize: 10,
    color: SUBTEXT,
    marginTop: 4,
    fontWeight: '700',
  },

  transactionAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
});

function formatAmount(amount: number): string {
  const n = amount || 0;

  if (n >= 1_000_000) {
    return `${parseFloat((n / 1_000_000).toFixed(1))}jt`;
  }

  if (n >= 1_000) {
    return `${Math.round(n / 1_000)}rb`;
  }

  return n.toLocaleString('id-ID');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr);

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}

export default function DashboardScreen() {
  const { user } = useAuth();

  const transactions = useTransactionStore((s) => s.transactions);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const isTransactionLoading = useTransactionStore((s) => s.isLoading);

  const budgets = useBudgetStore((s) => s.budgets);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);
  const isBudgetLoading = useBudgetStore((s) => s.isLoading);

  const isLoading = isTransactionLoading || isBudgetLoading;

  const loadData = useCallback(async () => {
    await Promise.all([loadTransactions(), loadBudgets()]);
  }, [loadTransactions, loadBudgets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const safeTransactions = transactions || [];
  const safeBudgets = budgets || [];

  const totalIncome = safeTransactions
    .filter((t) => t.type?.toLowerCase() === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = safeTransactions
    .filter((t) => t.type?.toLowerCase() === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBalance = totalIncome - totalExpenses;

  const today = new Date().toISOString().split('T')[0];

  const todayExpenses = safeTransactions
    .filter((t) => {
      if (t.type?.toLowerCase() !== 'expense') return false;

      const tDate = t.date?.split('T')[0];

      return tDate === today;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalDailyLimit = safeBudgets.reduce(
    (sum, b) => sum + (b.daily_limit || 0),
    0
  );

  const remaining = Math.max(0, totalDailyLimit - todayExpenses);

  const percentage =
    totalDailyLimit > 0
      ? Math.max(0, 100 - (todayExpenses / totalDailyLimit) * 100)
      : 0;

  const recentTransactions = [...safeTransactions]
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    )
    .slice(0, 3);

  const userName = user?.name || 'Pengguna';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={PRIMARY}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeLabel}>
              Selamat datang,
            </Text>

            <Text style={styles.headerName}>
              👋 {userName}
            </Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={TEXT}
            />

            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* HERO */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            SALDO SAAT INI
          </Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>Rp</Text>

            <Text style={styles.heroAmount}>
              {formatAmount(totalBalance)}
            </Text>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.heroStats}>
              <View>
                <Text style={styles.heroStatLabel}>Masuk</Text>

                <Text
                  style={[
                    styles.heroStatAmount,
                    styles.incomeText,
                  ]}
                >
                  Rp {formatAmount(totalIncome)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View>
                <Text style={styles.heroStatLabel}>Keluar</Text>

                <Text
                  style={[
                    styles.heroStatAmount,
                    styles.expenseText,
                  ]}
                >
                  Rp {formatAmount(totalExpenses)}
                </Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <View style={styles.heroButton}>
                <MaterialCommunityIcons
                  name="arrow-up"
                  size={20}
                  color="#fff"
                />
              </View>

              <View style={styles.heroButton}>
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={20}
                  color="#fff"
                />
              </View>
            </View>
          </View>
        </View>

        {/* BUDGET */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Budget Harian
            </Text>

            <Link href="/(tabs)/budget" asChild>
              <Pressable>
                <Text style={styles.sectionButton}>
                  ATUR
                </Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.budgetCircle}>
              <Text style={styles.budgetSmall}>
                Sisa
              </Text>

              <Text style={styles.budgetPercent}>
                {Math.round(percentage)}%
              </Text>
            </View>

            <View style={styles.budgetInfo}>
              <Text style={styles.budgetLabel}>
                Sisa Kuota Hari Ini
              </Text>

              <Text style={styles.budgetAmount}>
                Rp {formatAmount(remaining)}
              </Text>

              <Text style={styles.budgetLimit}>
                Batas harian Rp {formatAmount(totalDailyLimit)}
              </Text>
            </View>
          </View>
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Catatan Terakhir
            </Text>

            <Link href="/(tabs)/transaction" asChild>
              <Pressable>
                <Text style={styles.sectionButton}>
                  LIHAT SEMUA
                </Text>
              </Pressable>
            </Link>
          </View>

          {recentTransactions.map((transaction, index) => {
            const isIncome =
              transaction.type?.toLowerCase() === 'income';

            return (
              <View
                key={transaction.id || index}
                style={styles.transactionCard}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIconWrap,
                      {
                        backgroundColor: isIncome
                          ? '#dbeafe'
                          : '#fee2e2',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        isIncome
                          ? 'trending-up'
                          : 'cart-outline'
                      }
                      size={24}
                      color={isIncome ? PRIMARY : RED}
                    />
                  </View>

                  <View>
                    <Text style={styles.transactionTitle}>
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
                    {
                      color: isIncome ? GREEN : RED,
                    },
                  ]}
                >
                  {isIncome ? '+' : '-'} Rp{' '}
                  {formatAmount(transaction.amount || 0)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}