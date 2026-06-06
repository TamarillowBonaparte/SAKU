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

  premiumHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: '#eef2ff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  premiumBrand: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },

  contentContainer: {
    flex: 1,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
  },

  premiumSummaryCard: {
    backgroundColor: '#edf4ff',
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
    marginBottom: 24,
  },

  premiumSummaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  premiumIncomeText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.secondary,
  },

  premiumExpenseText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.tertiary,
  },

  dropdownWrapper: {
    marginBottom: 20,
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },

  dropdownButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },

  dropdownButtonTextActive: {
    color: '#fff',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    minWidth: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },

  dropdownItemActive: {
    backgroundColor: '#eef2ff',
  },

  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  dropdownItemTextActive: {
    color: COLORS.primary,
  },

  dropdownSeparator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 36,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#eceef0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },

  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 10,
  },

  modernDateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  modernTransactionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eceef0',
  },

  transactionItemSelected: {
    backgroundColor: '#eef2ff',
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  transactionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 4,
  },

  transactionCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },

  transactionAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.tertiary,
  },

  transactionAmountIncome: {
    color: COLORS.secondary,
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    paddingVertical: 80,
  },

  emptyText: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },

  bottomNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  navText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
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

const parseDateToTimestamp = (dateStr: string): number => {
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso.getTime();

  return 0;
};

const TransactionHistory: React.FC = () => {
  const {
    transactions,
    loadTransactions,
    deleteTransaction,
  } = useTransactionStore();

  const [groupedTransactions, setGroupedTransactions] =
    useState<GroupedTransaction[]>([]);

  const [selectedFilter, setSelectedFilter] =
    useState('Semua');

  const [dropdownVisible, setDropdownVisible] =
    useState(false);

  const [dropdownLayout, setDropdownLayout] =
    useState<any>(null);

  const [selectedTransactionId, setSelectedTransactionId] =
    useState<number | null>(null);

  const dropdownButtonRef = useRef<View>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTransactions();
  }, []);

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
      return (
        parseDateToTimestamp(b.date || '') -
        parseDateToTimestamp(a.date || '')
      );
    });

    const grouped = sorted.reduce((acc, transaction) => {
      const date =
        transaction.date ||
        new Date().toLocaleDateString('id-ID');

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
      React.ComponentProps<
        typeof MaterialCommunityIcons
      >['name']
    >;

  const getCategoryIcon = (
    category: string,
    type: string
  ): IconName => {
    const map: Record<string, IconName> = {
      makanan: 'food',
      transportasi: 'car',
      tagihan: 'receipt',
      belanja: 'shopping',
      hiburan: 'movie',
      kesehatan: 'medical-bag',
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
    const categoryLower =
      category?.toLowerCase() || '';

    if (type === 'income') {
      return {
        bg: '#dcfce7',
        text: '#15803d',
      };
    }

    if (categoryLower.includes('makanan'))
      return {
        bg: '#dbeafe',
        text: '#004ac6',
      };

    if (categoryLower.includes('belanja'))
      return {
        bg: '#ccfbf1',
        text: '#0f766e',
      };

    if (categoryLower.includes('transport'))
      return {
        bg: '#fee2e2',
        text: '#ae0010',
      };

    return {
      bg: '#f3f4f6',
      text: '#4b5563',
    };
  };

  const handleEditTransaction = (id: number) => {
    router.navigate({
      pathname: '/add-transaction',
      params: { id: id.toString() },
    });
  };

  const handleDeleteTransaction = (id: number) => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(id);
          },
        },
      ]
    );
  };

  const openDropdown = () => {
    dropdownButtonRef.current?.measure(
      (_fx, _fy, width, height, px, py) => {
        setDropdownLayout({
          x: px,
          y: py + height + 8,
        });

        setDropdownVisible(true);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    );
  };

  const closeDropdown = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setDropdownVisible(false);
    });
  };

  const selectedOption =
    FILTER_OPTIONS.find(
      (o) => o.value === selectedFilter
    ) || FILTER_OPTIONS[0];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#eef2ff"
      />

      {/* HEADER */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.premiumBrand}>SAKU</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={COLORS.onSurfaceVariant}
            />

            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: '#dbeafe',
              }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>
            Riwayat Transaksi
          </Text>

          <Text
            style={{
              marginTop: 4,
              color: COLORS.onSurfaceVariant,
              fontWeight: '600',
            }}
          >
            Mei 2026
          </Text>
        </View>

        {/* SUMMARY */}
        <View style={styles.premiumSummaryCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <Text style={styles.premiumSummaryTitle}>
              Ringkasan Bulanan
            </Text>

            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={COLORS.primary}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>
                Pemasukan
              </Text>

              <Text style={styles.premiumIncomeText}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>
                Pengeluaran
              </Text>

              <Text style={styles.premiumExpenseText}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* FILTER */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            ref={dropdownButtonRef as any}
            style={[
              styles.dropdownButton,
              dropdownVisible &&
              styles.dropdownButtonActive,
            ]}
            onPress={openDropdown}
          >
            <MaterialCommunityIcons
              name={selectedOption.icon as IconName}
              size={18}
              color={
                dropdownVisible
                  ? '#fff'
                  : COLORS.primary
              }
            />

            <Text
              style={[
                styles.dropdownButtonText,
                dropdownVisible &&
                styles.dropdownButtonTextActive,
              ]}
            >
              {selectedOption.label}
            </Text>

            <MaterialCommunityIcons
              name={
                dropdownVisible
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={18}
              color={
                dropdownVisible
                  ? '#fff'
                  : COLORS.onSurfaceVariant
              }
            />
          </TouchableOpacity>
        </View>

        {/* CHART CARD */}
        <View style={styles.chartCard}>
          <View style={styles.chartLegendRow}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.primary },
                ]}
              />
              <Text>Makanan</Text>
            </View>

            <Text style={{ fontWeight: '900' }}>
              53%
            </Text>
          </View>

          <View style={styles.chartLegendRow}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: '#14b8a6' },
                ]}
              />
              <Text>Belanja</Text>
            </View>

            <Text style={{ fontWeight: '900' }}>
              39%
            </Text>
          </View>

          <View style={styles.chartLegendRow}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.tertiary },
                ]}
              />
              <Text>Transport</Text>
            </View>

            <Text style={{ fontWeight: '900' }}>
              8%
            </Text>
          </View>
        </View>

        {/* TRANSACTION */}
        {groupedTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Tidak ada transaksi
            </Text>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View
              key={group.date}
              style={{ marginBottom: 28 }}
            >
              <Text style={styles.modernDateLabel}>
                {group.date}
              </Text>

              {group.transactions.map((item) => {
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

                const isSelected =
                  selectedTransactionId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modernTransactionCard,
                      isSelected &&
                      styles.transactionItemSelected,
                    ]}
                    activeOpacity={0.8}
                    onLongPress={() => {
                      setSelectedTransactionId(
                        item.id
                      );
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor:
                              colors.bg,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={icon}
                          size={24}
                          color={colors.text}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
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
                      style={{
                        alignItems: 'flex-end',
                      }}
                    >
                      <Text
                        style={[
                          styles.transactionAmount,
                          item.type ===
                          'income' &&
                          styles.transactionAmountIncome,
                        ]}
                      >
                        {item.type === 'income'
                          ? '+ '
                          : '- '}
                        {formatCurrency(
                          item.amount || 0
                        )}
                      </Text>

                      {isSelected && (
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 8,
                            marginTop: 10,
                          }}
                        >
                          <TouchableOpacity
                            style={
                              styles.actionButton
                            }
                            onPress={() =>
                              handleEditTransaction(
                                item.id
                              )
                            }
                          >
                            <MaterialCommunityIcons
                              name="pencil"
                              size={18}
                              color="#4B5563"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.deleteButton,
                            ]}
                            onPress={() =>
                              handleDeleteTransaction(
                                item.id
                              )
                            }
                          >
                            <MaterialCommunityIcons
                              name="trash-can"
                              size={18}
                              color="#E8323A"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FLOAT BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          router.push('/add-transaction')
        }
      >
        <MaterialCommunityIcons
          name="plus"
          size={32}
          color="#fff"
        />
      </TouchableOpacity>

      {/* NAVBAR */}
      <View style={styles.bottomNavbar}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons
            name="home-outline"
            size={24}
            color="#6b7280"
          />
          <Text
            style={[
              styles.navText,
              { color: '#6b7280' },
            ]}
          >
            Beranda
          </Text>
        </View>

        <View style={styles.navItem}>
          <MaterialCommunityIcons
            name="chart-box"
            size={24}
            color={COLORS.primary}
          />
          <Text
            style={[
              styles.navText,
              { color: COLORS.primary },
            ]}
          >
            Laporan
          </Text>
        </View>

        <View style={{ width: 60 }} />

        <View style={styles.navItem}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={24}
            color="#6b7280"
          />
          <Text
            style={[
              styles.navText,
              { color: '#6b7280' },
            ]}
          >
            Anggaran
          </Text>
        </View>

        <View style={styles.navItem}>
          <MaterialCommunityIcons
            name="account-outline"
            size={24}
            color="#6b7280"
          />
          <Text
            style={[
              styles.navText,
              { color: '#6b7280' },
            ]}
          >
            Profil
          </Text>
        </View>
      </View>

      {/* DROPDOWN */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeDropdown}
        >
          {dropdownLayout && (
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  top: dropdownLayout.y,
                  left: dropdownLayout.x,
                  opacity: fadeAnim,
                },
              ]}
            >
              {FILTER_OPTIONS.map(
                (option, index) => (
                  <React.Fragment
                    key={option.value}
                  >
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        selectedFilter ===
                        option.value &&
                        styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedFilter(
                          option.value
                        );
                        closeDropdown();
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          option.icon as IconName
                        }
                        size={18}
                        color={
                          selectedFilter ===
                            option.value
                            ? COLORS.primary
                            : COLORS.onSurfaceVariant
                        }
                      />

                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedFilter ===
                          option.value &&
                          styles.dropdownItemTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>

                    {index <
                      FILTER_OPTIONS.length -
                      1 && (
                        <View
                          style={
                            styles.dropdownSeparator
                          }
                        />
                      )}
                  </React.Fragment>
                )
              )}
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
};

export default TransactionHistory;