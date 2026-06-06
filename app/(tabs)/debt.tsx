import { useDebtStore } from '@/store/useDebtStore';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  background: '#f7f9fb',
  surface: '#ffffff',
  primary: '#004ac6',
  primaryContainer: '#2563eb',
  secondary: '#006e2d',
  tertiary: '#ae0010',
  text: '#191c1e',
  textSoft: '#434655',
  border: '#e2e8f0',
  surfaceLow: '#f2f4f6',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },

  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 2,
  },

  profile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#c7d2fe',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },

  summaryCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },

  filterRow: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 10,
  },

  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSoft,
  },

  filterTextActive: {
    color: '#fff',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#edf0f2',
    marginBottom: 16,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  debtBg: {
    backgroundColor: '#fee2e2',
  },

  receivableBg: {
    backgroundColor: '#dcfce7',
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  itemDate: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 4,
  },

  itemAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'right',
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-end',
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  reminderBox: {
    marginTop: 14,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  reminderText: {
    flex: 1,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    marginTop: 10,
    color: COLORS.textSoft,
    textAlign: 'center',
    marginBottom: 16,
  },

  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 30,
    maxHeight: '85%',
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  modalBody: {
    padding: 20,
  },

  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  detailName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    color: COLORS.text,
  },

  detailAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  detailText: {
    fontSize: 13,
    color: COLORS.textSoft,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    borderRadius: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  actionText: {
    color: '#fff',
    fontWeight: '800',
  },
});

const toCurrency = (amount: number) =>
  `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;

const formatDate = (dateText: string) => {
  const parsed = new Date(dateText);

  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isDebtType = (type: string) => {
  const normalized = type.toLowerCase();
  return normalized === 'utang' || normalized === 'debt';
};

const getStatusMeta = (status: string, dueDate: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('lunas') || normalizedStatus.includes('paid')) {
    return {
      label: 'Lunas',
      bg: '#dcfce7',
      text: '#166534',
    };
  }

  const parsedDueDate = new Date(dueDate);

  const isPastDue =
    !Number.isNaN(parsedDueDate.getTime()) &&
    parsedDueDate.getTime() < new Date().setHours(0, 0, 0, 0);

  if (
    normalizedStatus.includes('jatuh') ||
    normalizedStatus.includes('overdue') ||
    isPastDue
  ) {
    return {
      label: 'Jatuh Tempo',
      bg: '#fef3c7',
      text: '#92400e',
    };
  }

  return {
    label: 'Lancar',
    bg: '#dcfce7',
    text: '#166534',
  };
};

export default function DebtScreen() {
  const debts = useDebtStore((s) => s.debts);
  const isLoading = useDebtStore((s) => s.isLoading);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const deleteDebt = useDebtStore((s) => s.deleteDebt);

  const [selectedTab, setSelectedTab] = useState('Semua');
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      void loadDebts();
      loadReminderSettings();
    }, [loadDebts]),
  );

  const loadReminderSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('debtReminderSettings');

      if (saved) {
        setReminderSettings(JSON.parse(saved));
      } else {
        setReminderSettings({
          type: '1day',
          customValue: 1,
          customUnit: 'days',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateNotificationTime = (dueDate: string): Date => {
    const notificationTime = new Date(dueDate);

    if (!reminderSettings) return notificationTime;

    if (reminderSettings.type === '1day') {
      notificationTime.setDate(notificationTime.getDate() - 1);
    } else if (reminderSettings.type === '3days') {
      notificationTime.setDate(notificationTime.getDate() - 3);
    } else if (reminderSettings.type === 'custom') {
      if (reminderSettings.customUnit === 'days') {
        notificationTime.setDate(
          notificationTime.getDate() - reminderSettings.customValue,
        );
      } else if (reminderSettings.customUnit === 'weeks') {
        notificationTime.setDate(
          notificationTime.getDate() - reminderSettings.customValue * 7,
        );
      }
    }

    return notificationTime;
  };

  const formatTimeUntilNotification = (notificationTime: Date): string => {
    const now = new Date();
    const diff = notificationTime.getTime() - now.getTime();

    if (diff <= 0) return 'Sekarang';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    if (days > 0) return `${days} hari`;
    if (hours > 0) return `${hours} jam`;

    return 'Segera';
  };

  const handleDeleteDebt = (debtId: number, debtName: string) => {
    Alert.alert(
      'Hapus Catatan',
      `Yakin ingin menghapus "${debtName}"?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDebt(debtId);
              await loadDebts();
              setDetailModalVisible(false);
              setSelectedDebt(null);

              Alert.alert('Sukses', 'Catatan berhasil dihapus');
            } catch {
              Alert.alert('Error', 'Gagal menghapus catatan');
            }
          },
        },
      ],
    );
  };

  const totals = useMemo(() => {
    return debts.reduce(
      (acc, debt) => {
        if (isDebtType(debt.type)) {
          acc.utang += debt.amount;
        } else {
          acc.piutang += debt.amount;
        }

        return acc;
      },
      {
        utang: 0,
        piutang: 0,
      },
    );
  }, [debts]);

  const filteredDebts = useMemo(() => {
    let data = [...debts];

    if (selectedTab === 'Pengeluaran') {
      data = data.filter((d) => isDebtType(d.type));
    }

    if (selectedTab === 'Pemasukan') {
      data = data.filter((d) => !isDebtType(d.type));
    }

    return data.sort((a, b) => {
      const aTime = new Date(a.due_date).getTime();
      const bTime = new Date(b.due_date).getTime();

      return aTime - bTime;
    });
  }, [debts, selectedTab]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={COLORS.background}
        barStyle="dark-content"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="bank"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View>
              <Text style={styles.headerTitle}>Utang dan Piutang</Text>
              <Text style={styles.headerSubtitle}>
                Pantau semua catatan pinjaman
              </Text>
            </View>
          </View>

          <View style={styles.profile} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void loadDebts()}
          />
        }
      >
        {/* SUMMARY */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: '#fee2e2' },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: COLORS.tertiary },
              ]}
            >
              Total Utang
            </Text>

            <Text style={styles.summaryAmount}>
              {toCurrency(totals.utang)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: '#dcfce7' },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: COLORS.secondary },
              ]}
            >
              Total Piutang
            </Text>

            <Text style={styles.summaryAmount}>
              {toCurrency(totals.piutang)}
            </Text>
          </View>
        </View>

        {/* FILTER */}
        <View style={styles.filterRow}>
          {['Semua', 'Pengeluaran', 'Pemasukan'].map((item) => {
            const active = selectedTab === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  active && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedTab(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catatan Terbaru</Text>

          <MaterialCommunityIcons
            name="filter-variant"
            size={22}
            color={COLORS.textSoft}
          />
        </View>

        {isLoading && filteredDebts.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        ) : null}

        {!isLoading && filteredDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={40}
              color={COLORS.textSoft}
            />

            <Text style={styles.emptyText}>
              Belum ada data utang atau piutang
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-debt')}
            >
              <Text style={styles.addButtonText}>
                Tambah Catatan
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {filteredDebts.map((item) => {
          const debt = isDebtType(item.type);

          const statusMeta = getStatusMeta(
            item.status,
            item.due_date,
          );

          const notificationTime =
            calculateNotificationTime(item.due_date);

          const timeUntilNotification =
            formatTimeUntilNotification(notificationTime);

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => {
                setSelectedDebt(item);
                setDetailModalVisible(true);
              }}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      debt
                        ? styles.debtBg
                        : styles.receivableBg,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        debt
                          ? 'arrow-top-right'
                          : 'arrow-bottom-left'
                      }
                      size={22}
                      color={
                        debt
                          ? COLORS.tertiary
                          : COLORS.secondary
                      }
                    />
                  </View>

                  <View>
                    <Text style={styles.itemTitle}>
                      {item.name}
                    </Text>

                    <Text style={styles.itemDate}>
                      {formatDate(item.due_date)}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      styles.itemAmount,
                      {
                        color: debt
                          ? COLORS.tertiary
                          : COLORS.secondary,
                      },
                    ]}
                  >
                    {toCurrency(item.amount)}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: statusMeta.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statusMeta.text },
                      ]}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.reminderBox}>
                <Ionicons
                  name="notifications"
                  size={16}
                  color={COLORS.primary}
                />

                <Text style={styles.reminderText}>
                  Pengingat dalam {timeUntilNotification}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Detail Catatan
              </Text>

              <View style={{ width: 24 }} />
            </View>

            {selectedDebt && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <View
                    style={[
                      styles.detailIcon,
                      {
                        backgroundColor: isDebtType(
                          selectedDebt.type,
                        )
                          ? '#fee2e2'
                          : '#dcfce7',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        isDebtType(selectedDebt.type)
                          ? 'arrow-top-right'
                          : 'arrow-bottom-left'
                      }
                      size={32}
                      color={
                        isDebtType(selectedDebt.type)
                          ? COLORS.tertiary
                          : COLORS.secondary
                      }
                    />
                  </View>

                  <Text style={styles.detailName}>
                    {selectedDebt.name}
                  </Text>

                  <Text
                    style={[
                      styles.detailAmount,
                      {
                        color: isDebtType(selectedDebt.type)
                          ? COLORS.tertiary
                          : COLORS.secondary,
                      },
                    ]}
                  >
                    {toCurrency(selectedDebt.amount)}
                  </Text>

                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color={COLORS.textSoft}
                    />

                    <Text style={styles.detailText}>
                      {formatDate(selectedDebt.due_date)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="notifications"
                      size={16}
                      color={COLORS.textSoft}
                    />

                    <Text style={styles.detailText}>
                      Pengingat dalam{' '}
                      {formatTimeUntilNotification(
                        calculateNotificationTime(
                          selectedDebt.due_date,
                        ),
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setDetailModalVisible(false);

                      router.push({
                        pathname: '/add-debt',
                        params: {
                          editId:
                            selectedDebt.id.toString(),
                        },
                      });
                    }}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color="#fff"
                    />

                    <Text style={styles.actionText}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeleteDebt(
                        selectedDebt.id,
                        selectedDebt.name,
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={18}
                      color="#fff"
                    />

                    <Text style={styles.actionText}>
                      Hapus
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-debt')}
      >
        <MaterialCommunityIcons
          name="plus"
          size={34}
          color="#fff"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}