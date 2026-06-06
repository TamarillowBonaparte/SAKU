import { Transaction, useTransactionStore } from '@/store/useTransactionStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type GroupedTransaction = {
  date: string;
  transactions: Transaction[];
};

type CategoryLike =
  | string
  | {
    name?: unknown;
  }
  | null
  | undefined;

const COLORS = {
  bg: '#f7f9fb',
  card: '#ffffff',
  primary: '#004ac6',
  primarySoft: '#dbeafe',
  secondary: '#006e2d',
  tertiary: '#ae0010',
  text: '#191c1e',
  subtext: '#6b7280',
  border: '#eceef0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  /* HEADER */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
  },

  /* TITLE */
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 28,
  },

  pageSub: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.subtext,
    fontWeight: '600',
    marginBottom: 24,
  },

  /* SUMMARY */
  summaryCard: {
    backgroundColor: '#eef4ff',
    borderRadius: 30,
    padding: 22,
    marginBottom: 24,
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },

  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },

  summaryItem: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 10,
    color: COLORS.subtext,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 1,
  },

  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
  },

  income: {
    color: COLORS.secondary,
  },

  expense: {
    color: COLORS.tertiary,
  },

  /* FILTER */
  filterContainer: {
    marginBottom: 24,
  },

  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e9edf3',
    marginRight: 10,
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.subtext,
  },

  filterTextActive: {
    color: '#fff',
  },

  /* GROUP */
  dateGroup: {
    marginBottom: 30,
  },

  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  dateBadge: {
    backgroundColor: '#e8ecf1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  dateText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.subtext,
    letterSpacing: 1,
  },

  dayTotal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },

  /* TRANSACTION */
  transactionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 2,
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  transactionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },

  transactionCategory: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
  },

  transactionRight: {
    alignItems: 'flex-end',
  },

  transactionAmount: {
    fontSize: 15,
    fontWeight: '900',
  },

  transactionTime: {
    marginTop: 4,
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1,
  },

  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },

  emptyText: {
    fontSize: 16,
    color: COLORS.subtext,
    fontWeight: '600',
  },
});

const TransactionHistory: React.FC = () => {
  const { transactions, loadTransactions } = useTransactionStore();

  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const getCategoryName = (category: CategoryLike): string => {
    if (typeof category === 'string') return category;

    if (
      category &&
      typeof category === 'object' &&
      typeof category.name === 'string'
    ) {
      return category.name;
    }

    return '';
  };

  useEffect(() => {
    let filtered = transactions;

    if (selectedFilter !== 'Semua') {
      filtered = transactions.filter((t) =>
        getCategoryName(t.category)
          .toLowerCase()
          .includes(selectedFilter.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date || new Date()).getTime();
      const dateB = new Date(b.date || new Date()).getTime();

      return dateB - dateA;
    });

    const grouped = sorted.reduce((acc, transaction) => {
      const date = transaction.date || new Date().toLocaleDateString('id-ID');

      const existing = acc.find((g) => g.date === date);

      if (existing) {
        existing.transactions.push(transaction);
      } else {
        acc.push({
          date,
          transactions: [transaction],
        });
      }

      return acc;
    }, [] as GroupedTransaction[]);

    setGroupedTransactions(grouped);
  }, [transactions, selectedFilter]);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  type IconName =
    NonNullable<
      React.ComponentProps<typeof MaterialCommunityIcons>['name']
    >;

  const getCategoryIcon = (
    category: string,
    type: string
  ): IconName => {
    const map: Record<string, IconName> = {
      makanan: 'food',
      makan: 'food',
      transportasi: 'car',
      transport: 'car',
      tagihan: 'receipt',
      listrik: 'flash',
      belanja: 'shopping',
      hiburan: 'movie',
      kesehatan: 'medical-bag',
      gaji: 'wallet',
      pemasukan: 'wallet',
    };

    const key = category?.toLowerCase() || '';

    for (const k in map) {
      if (key.includes(k)) return map[k];
    }

    return type === 'income'
      ? 'wallet'
      : 'trending-down';
  };

  const getCategoryColors = (
    category: string,
    type: string
  ) => {
    const categoryLower = category?.toLowerCase() || '';

    if (type === 'income') {
      return {
        bg: '#dcfce7',
        text: '#15803d',
      };
    }

    if (categoryLower.includes('makanan')) {
      return {
        bg: '#dbeafe',
        text: COLORS.primary,
      };
    }

    if (categoryLower.includes('transport')) {
      return {
        bg: '#fee2e2',
        text: COLORS.tertiary,
      };
    }

    if (categoryLower.includes('belanja')) {
      return {
        bg: '#ccfbf1',
        text: '#0f766e',
      };
    }

    return {
      bg: '#f1f5f9',
      text: '#475569',
    };
  };

  const filters = [
    'Semua',
    'Makanan',
    'Transportasi',
    'Tagihan',
    'Hiburan',
  ];

  const currentMonth = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.brand}>SAKU</Text>

        <View style={styles.headerRight}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={COLORS.subtext}
          />

          <View style={styles.profile} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <Text style={styles.pageTitle}>
          Riwayat Transaksi
        </Text>

        <Text style={styles.pageSub}>
          {currentMonth}
        </Text>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryTitle}>
              RINGKASAN BULANAN
            </Text>

            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                PEMASUKAN
              </Text>

              <Text
                style={[
                  styles.summaryAmount,
                  styles.income,
                ]}
              >
                {formatCurrency(totalIncome)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                PENGELUARAN
              </Text>

              <Text
                style={[
                  styles.summaryAmount,
                  styles.expense,
                ]}
              >
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterButton,
                selectedFilter === filter &&
                styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter &&
                  styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRANSACTIONS */}
        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Tidak ada transaksi
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => {
            const dayTotal = group.transactions.reduce(
              (sum, t) => {
                if (t.type === 'income') {
                  return sum + (t.amount || 0);
                }

                return sum - (t.amount || 0);
              },
              0
            );

            return (
              <View
                key={group.date}
                style={styles.dateGroup}
              >
                <View style={styles.dateHeader}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>
                      {group.date}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.dayTotal,
                      {
                        color:
                          dayTotal >= 0
                            ? COLORS.secondary
                            : COLORS.tertiary,
                      },
                    ]}
                  >
                    {dayTotal >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(dayTotal))}
                  </Text>
                </View>

                {group.transactions.map((item, idx) => {
                  const categoryName =
                    getCategoryName(item.category);

                  const icon = getCategoryIcon(
                    categoryName,
                    item.type || 'expense'
                  );

                  const colors = getCategoryColors(
                    categoryName,
                    item.type || 'expense'
                  );

                  return (
                    <View
                      key={idx}
                      style={styles.transactionCard}
                    >
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.iconWrap,
                            {
                              backgroundColor: colors.bg,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={icon}
                            size={24}
                            color={colors.text}
                          />
                        </View>

                        <View>
                          <Text
                            style={
                              styles.transactionTitle
                            }
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={
                              styles.transactionCategory
                            }
                          >
                            {categoryName ||
                              'Tanpa kategori'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={styles.transactionRight}
                      >
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                item.type === 'income'
                                  ? COLORS.secondary
                                  : COLORS.tertiary,
                            },
                          ]}
                        >
                          {item.type === 'income'
                            ? '+ '
                            : '- '}
                          {formatCurrency(
                            item.amount || 0
                          )}
                        </Text>

                        <Text style={styles.transactionTime}>
                          {item.date
                            ? new Date(
                              item.date
                            ).toLocaleTimeString(
                              'id-ID',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                            : '--:--'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default TransactionHistory;