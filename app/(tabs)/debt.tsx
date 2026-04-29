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
  bg: '#f0f4ff',
  card: '#ffffff',
  primary: '#004ac6',
  income: '#006e2d',
  expense: '#ae0010',
  text: '#191c1e',
  textSoft: 'rgba(25, 28, 30, 0.56)',
  border: '#e2e8f0',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  titleSub: {
    fontSize: 11,
    color: COLORS.textSoft,
  },
  addButtonHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  summaryLabel: {
    color: '#ffffffcc',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  reminderCountdownBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  reminderCountdownText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailCard: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  detailAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailRowText: {
    fontSize: 13,
    color: COLORS.textSoft,
  },
  detailStatusBox: {
    marginTop: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButtonFull: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonFull: {
    flex: 1,
    backgroundColor: COLORS.expense,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

const toCurrency = (amount: number) => `Rp ${Math.abs(amount).toLocaleString('id-ID')}`;

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
      badgeBg: '#e2e8f0',
      badgeText: '#475569',
    };
  }

  const parsedDueDate = new Date(dueDate);
  const isPastDue = !Number.isNaN(parsedDueDate.getTime()) && parsedDueDate.getTime() < new Date().setHours(0, 0, 0, 0);

  if (normalizedStatus.includes('jatuh') || normalizedStatus.includes('overdue') || isPastDue) {
    return {
      label: 'Jatuh Tempo',
      badgeBg: '#ffedd5',
      badgeText: '#c2410c',
    };
  }

  return {
    label: 'Aktif',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
  };
};

export default function DebtScreen() {
  const debts = useDebtStore((s) => s.debts);
  const isLoading = useDebtStore((s) => s.isLoading);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const deleteDebt = useDebtStore((s) => s.deleteDebt);

  const [reminderSettings, setReminderSettings] = useState<any>(null);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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
      console.error('Error loading reminder settings:', error);
    }
  };

  const calculateNotificationTime = (dueDate: string): Date => {
    const notificationTime = new Date(dueDate);

    if (!reminderSettings) {
      return notificationTime;
    }

    if (reminderSettings.type === '1day') {
      notificationTime.setDate(notificationTime.getDate() - 1);
    } else if (reminderSettings.type === '3days') {
      notificationTime.setDate(notificationTime.getDate() - 3);
    } else if (reminderSettings.type === 'custom') {
      if (reminderSettings.customUnit === 'days') {
        notificationTime.setDate(
          notificationTime.getDate() - reminderSettings.customValue
        );
      } else if (reminderSettings.customUnit === 'weeks') {
        notificationTime.setDate(
          notificationTime.getDate() - reminderSettings.customValue * 7
        );
      }
    }

    return notificationTime;
  };

  const formatTimeUntilNotification = (notificationTime: Date): string => {
    const now = new Date();
    const diff = notificationTime.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Sekarang';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} hari`;
    } else if (hours > 0) {
      return `${hours} jam`;
    } else {
      return 'Segera';
    }
  };

  const handleDeleteDebt = (debtId: number, debtName: string) => {
    Alert.alert(
      'Hapus Catatan',
      `Yakin ingin menghapus "${debtName}"?`,
      [
        { text: 'Batal', style: 'cancel' },
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
      ]
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
      { utang: 0, piutang: 0 },
    );
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      const aTime = new Date(a.due_date).getTime();
      const bTime = new Date(b.due_date).getTime();
      return aTime - bTime;
    });
  }, [debts]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons name="bank" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.titleText}>Utang dan Piutang</Text>
            <Text style={styles.titleSub}>Pantau semua catatan pinjaman</Text>
          </View>
        </View>

        {/* <Pressable style={styles.addButtonHeader} onPress={() => router.push('/add-debt')}>
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
        </Pressable> */}

        
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void loadDebts()} />}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#d71920' }]}>
            <Text style={styles.summaryLabel}>Total Utang</Text>
            <Text style={styles.summaryAmount}>{toCurrency(totals.utang)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#0f8d3b' }]}>
            <Text style={styles.summaryLabel}>Total Piutang</Text>
            <Text style={styles.summaryAmount}>{toCurrency(totals.piutang)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catatan Terbaru</Text>
          <Pressable onPress={() => void loadDebts()}>
            <Text style={styles.sectionAction}>Muat Ulang</Text>
          </Pressable>
        </View>

        {isLoading && sortedDebts.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : null}

        {!isLoading && sortedDebts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-document-outline" size={28} color={COLORS.textSoft} />
            <Text style={styles.emptyText}>Belum ada data utang atau piutang. Tambahkan catatan baru.</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/add-debt')}>
              <Text style={styles.emptyButtonText}>Tambah Catatan</Text>
            </Pressable>
          </View>
        ) : null}

        {sortedDebts.map((item) => {
          const debt = isDebtType(item.type);
          const statusMeta = getStatusMeta(item.status, item.due_date);
          const notificationTime = calculateNotificationTime(item.due_date);
          const timeUntilNotification = formatTimeUntilNotification(notificationTime);

          return (
            <Pressable
              key={item.id}
              style={styles.itemCard}
              onPress={() => {
                setSelectedDebt(item);
                setDetailModalVisible(true);
              }}
            >
              <View style={styles.itemTop}>
                <View style={styles.itemLeft}>
                  <View
                    style={[
                      styles.itemIcon,
                      { backgroundColor: debt ? '#fee2e2' : '#dcfce7' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={debt ? 'arrow-top-right' : 'arrow-bottom-left'}
                      size={18}
                      color={debt ? COLORS.expense : COLORS.income}
                    />
                  </View>

                  <View>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemDate}>Jatuh tempo: {formatDate(item.due_date)}</Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: debt ? COLORS.expense : COLORS.income },
                    ]}
                  >
                    {debt ? '- ' : '+ '}
                    {toCurrency(item.amount)}
                  </Text>

                  <View style={[styles.statusBadge, { backgroundColor: statusMeta.badgeBg }]}>
                    <Text style={[styles.statusText, { color: statusMeta.badgeText }]}>{statusMeta.label}</Text>
                  </View>
                </View>
              </View>

              {/* Reminder Countdown */}
              <View style={styles.reminderCountdownBox}>
                <Ionicons name="alarm" size={14} color={COLORS.primary} />
                <Text style={styles.reminderCountdownText}>
                  Pengingat dalam {timeUntilNotification}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Detail Modal */}
        <Modal
          visible={detailModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Detail Catatan</Text>
                <View style={{ width: 24 }} />
              </View>

              {selectedDebt && (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailIconBox}>
                      <MaterialCommunityIcons
                        name={isDebtType(selectedDebt.type) ? 'arrow-top-right' : 'arrow-bottom-left'}
                        size={32}
                        color={isDebtType(selectedDebt.type) ? COLORS.expense : COLORS.income}
                      />
                    </View>

                    <Text style={styles.detailName}>{selectedDebt.name}</Text>

                    <Text style={styles.detailAmount}>
                      {isDebtType(selectedDebt.type) ? '- ' : '+ '}
                      {toCurrency(selectedDebt.amount)}
                    </Text>

                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar" size={16} color={COLORS.textSoft} />
                      <Text style={styles.detailRowText}>{formatDate(selectedDebt.due_date)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="alarm" size={16} color={COLORS.textSoft} />
                      <Text style={styles.detailRowText}>
                        Pengingat dalam {formatTimeUntilNotification(calculateNotificationTime(selectedDebt.due_date))}
                      </Text>
                    </View>

                    <View style={styles.detailStatusBox}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusMeta(selectedDebt.status, selectedDebt.due_date).badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusMeta(selectedDebt.status, selectedDebt.due_date).badgeText },
                          ]}
                        >
                          {getStatusMeta(selectedDebt.status, selectedDebt.due_date).label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.editButtonFull}
                      onPress={() => {
                        setDetailModalVisible(false);
                        router.push({
                          pathname: '/add-debt',
                          params: { editId: selectedDebt.id.toString() },
                        });
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButtonFull}
                      onPress={() => handleDeleteDebt(selectedDebt.id, selectedDebt.name)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/add-debt')}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}