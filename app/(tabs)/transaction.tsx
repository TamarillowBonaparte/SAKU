import { Transaction, useTransactionStore } from '@/store/useTransactionStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    Pressable,
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
  // Dropdown styles
  dropdownWrapper: {
    marginBottom: 20,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#d0d4d8',
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  dropdownButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginRight: 6,
  },
  dropdownButtonTextActive: {
    color: COLORS.onPrimary,
  },
  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    marginHorizontal: 12,
  },
  // Transaction list styles
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
  transactionItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
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

type FilterOption = {
  label: string;
  value: string;
  icon: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'Semua', value: 'Semua', icon: 'view-list' },
  { label: 'Makanan', value: 'Makanan', icon: 'food' },
  { label: 'Transportasi', value: 'Transportasi', icon: 'car' },
  { label: 'Tagihan', value: 'Tagihan', icon: 'receipt' },
  { label: 'Hiburan', value: 'Hiburan', icon: 'movie' },
  { label: 'Belanja', value: 'Belanja', icon: 'shopping' },
  { label: 'Kesehatan', value: 'Kesehatan', icon: 'medical-bag' },
  { label: 'Pemasukan', value: 'Pemasukan', icon: 'wallet' },
];

/** Parse date string "DD APR YYYY" or ISO format → timestamp for sorting */
const parseDateToTimestamp = (dateStr: string): number => {
  // Try ISO format first (e.g. "2026-04-17")
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso.getTime();

  // Try "DD MMM YYYY" format (e.g. "17 APR 2026")
  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, MEI: 4, JUN: 5,
    JUL: 6, AGU: 7, AUG: 7, SEP: 8, OKT: 9, OCT: 9, NOV: 10, DES: 11, DEC: 11,
  };
  const parts = dateStr.toUpperCase().split(/[\s/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day).getTime();
    }
  }

  return 0;
};

const TransactionHistory: React.FC = () => {
  const { transactions, loadTransactions, deleteTransaction, isLoading } = useTransactionStore();
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const dropdownButtonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getCategoryName = (category: CategoryLike): string => {
    if (typeof category === 'string') return category;
    if (category && typeof category === 'object' && typeof category.name === 'string') {
      return category.name;
    }
    return '';
  };

  const handleEditTransaction = (id: number) => {
    setShowActionMenu(false);
    router.navigate({ pathname: '/add-transaction', params: { id: id.toString() } });
  };

  const handleDeleteTransaction = (id: number) => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Batal', onPress: () => {}, style: 'cancel' },
        {
          text: 'Hapus',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              setShowActionMenu(false);
              Alert.alert('Berhasil', 'Transaksi berhasil dihapus');
            } catch (error: any) {
              const errorMsg = error?.response?.data?.message || 'Gagal menghapus transaksi';
              Alert.alert('Error', errorMsg);
            }
          },
          style: 'destructive',
        },
      ]
    );
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

    // Sort descending by date (most recent first)
    const sorted = [...filtered].sort((a, b) => {
      const tsA = parseDateToTimestamp(a.date || '');
      const tsB = parseDateToTimestamp(b.date || '');
      return tsB - tsA;
    });

    // Group by date string
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

  const openDropdown = () => {
    dropdownButtonRef.current?.measure((_fx, _fy, width, height, px, py) => {
      setDropdownLayout({ x: px, y: py + height + 6, width, height });
      setDropdownVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDropdown = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => setDropdownVisible(false));
  };

  const handleSelectFilter = (value: string) => {
    setSelectedFilter(value);
    closeDropdown();
  };

  const selectedOption = FILTER_OPTIONS.find((o) => o.value === selectedFilter) ?? FILTER_OPTIONS[0];

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

        {/* Dropdown Filter */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            ref={dropdownButtonRef as React.RefObject<View>}
            style={[styles.dropdownButton, dropdownVisible && styles.dropdownButtonActive]}
            onPress={openDropdown}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={selectedOption.icon as IconName}
              size={16}
              color={dropdownVisible ? COLORS.onPrimary : COLORS.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.dropdownButtonText,
                dropdownVisible && styles.dropdownButtonTextActive,
              ]}
            >
              {selectedOption.label}
            </Text>
            <MaterialCommunityIcons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={dropdownVisible ? COLORS.onPrimary : COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

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
                  const isSelected = selectedTransactionId === item.id;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.transactionItem,
                        idx === group.transactions.length - 1 && { borderBottomWidth: 0 },
                        isSelected && styles.transactionItemSelected,
                      ]}
                      onLongPress={() => {
                        setSelectedTransactionId(item.id);
                        setShowActionMenu(true);
                      }}
                      onPress={() => {
                        if (isSelected) {
                          setShowActionMenu(!showActionMenu);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                        <MaterialCommunityIcons name={icon} size={24} color={colors.text} />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <Text style={styles.transactionCategory}>
                          {categoryName || 'Tanpa kategori'}
                        </Text>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            item.type === 'income' && styles.transactionAmountIncome,
                          ]}
                        >
                          {item.type === 'income' ? '+ ' : '- '}
                          {formatCurrency(item.amount || 0)}
                        </Text>
                        {isSelected && (
                          <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleEditTransaction(item.id)}
                            >
                              <MaterialCommunityIcons name="pencil" size={18} color="#4B5563" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteTransaction(item.id)}
                            >
                              <MaterialCommunityIcons name="trash-can" size={18} color="#E8323A" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDropdown}>
          {dropdownLayout && (
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  top: dropdownLayout.y,
                  left: dropdownLayout.x,
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {FILTER_OPTIONS.map((option, index) => (
                <React.Fragment key={option.value}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedFilter === option.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => handleSelectFilter(option.value)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as IconName}
                      size={18}
                      color={
                        selectedFilter === option.value
                          ? COLORS.primary
                          : COLORS.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedFilter === option.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedFilter === option.value && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color={COLORS.primary}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                  {index < FILTER_OPTIONS.length - 1 && (
                    <View style={styles.dropdownSeparator} />
                  )}
                </React.Fragment>
              ))}
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
};

export default TransactionHistory;