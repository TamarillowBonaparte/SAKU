import { Transaction, useTransactionStore } from '@/store/useTransactionStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  surface: '#f7f9fb',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434655',
  surfaceContainer: '#eceef0',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainerLowest: '#ffffff',
  primary: '#004ac6',
  onPrimary: '#ffffff',
  secondary: '#006e2d',
  tertiary: '#ae0010',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e5',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    color: COLORS.onSurface,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  summaryAmountExpense: {
    color: COLORS.tertiary,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e6e8ea',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  filterButtonTextActive: {
    color: COLORS.onPrimary,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  transactionContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerLow,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
  transactionAmountIncome: {
    color: COLORS.secondary,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
});

const TransactionHistory: React.FC = () => {
  const { transactions, loadTransactions } = useTransactionStore();
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  const getCategoryName = (category: CategoryLike): string => {
    if (typeof category === 'string') return category;
    if (category && typeof category === 'object' && typeof category.name === 'string') {
      return category.name;
    }
    return '';
  };

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    let filtered = transactions;

    if (selectedFilter !== 'Semua') {
      const selectedFilterLower = selectedFilter.toLowerCase();
      filtered = transactions.filter((t) =>
        getCategoryName(t.category).toLowerCase().includes(selectedFilterLower)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date || new Date()).getTime();
      const dateB = new Date(b.date || new Date()).getTime();
      return dateB - dateA;
    });

    const grouped = sorted.reduce((acc, transaction) => {
      const date = transaction.date || new Date().toLocaleDateString('id-ID');
      const existingGroup = acc.find((g) => g.date === date);

      if (existingGroup) {
        existingGroup.transactions.push(transaction);
      } else {
        acc.push({ date, transactions: [transaction] });
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

  type IconName = NonNullable<React.ComponentProps<typeof MaterialCommunityIcons>['name']>;

  const getCategoryIcon = (category: string, type: string): IconName => {
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
    return type === 'income' ? 'wallet' : 'trending-down';
  };

  const getCategoryColors = (category: string, type: string) => {
    const categoryLower = category?.toLowerCase() || '';

    if (type === 'income') {
      if (categoryLower.includes('gaji')) return { bg: '#dcfce7', text: '#15803d' };
      return { bg: '#dbeafe', text: '#0369a1' };
    }

    if (categoryLower.includes('makanan')) return { bg: '#fed7aa', text: '#92400e' };
    if (categoryLower.includes('transportasi')) return { bg: '#dbeafe', text: '#0369a1' };
    if (categoryLower.includes('tagihan')) return { bg: '#e9d5ff', text: '#7c3aed' };
    if (categoryLower.includes('belanja')) return { bg: '#fbcfe8', text: '#be185d' };
    if (categoryLower.includes('hiburan')) return { bg: '#fef3c7', text: '#d97706' };
    if (categoryLower.includes('kesehatan')) return { bg: '#fee2e2', text: '#991b1b' };

    return { bg: '#f3f4f6', text: '#4b5563' };
  };

  const filters = ['Semua', 'Makanan', 'Transportasi', 'Tagihan', 'Hiburan'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.profileImage} />
            <Text style={styles.headerTitle}>The Editorial Ledger</Text>
          </View>
          <MaterialCommunityIcons name="bell" size={24} color={COLORS.primary} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pemasukan</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pengeluaran</Text>
            <Text style={[styles.summaryAmount, styles.summaryAmountExpense]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          scrollEventThrottle={16}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction List */}
        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{group.date}</Text>
              <View style={styles.transactionContainer}>
                {group.transactions.map((item, idx) => {
                  const categoryName = getCategoryName(item.category);
                  const icon = getCategoryIcon(categoryName, item.type || 'expense');
                  const colors = getCategoryColors(categoryName, item.type || 'expense');

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.transactionItem,
                        idx === group.transactions.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                        <MaterialCommunityIcons name={icon} size={24} color={colors.text} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <Text style={styles.transactionCategory}>{categoryName || 'Tanpa kategori'}</Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            item.type === 'income' && styles.transactionAmountIncome,
                          ]}
                        >
                          {item.type === 'income' ? '+ ' : '- '}
                          {formatCurrency(item.amount || 0)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* Bottom Padding */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default TransactionHistory;
