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
  primarySoft: '#dbe1ff',
  secondary: '#006e2d',
  tertiary: '#ae0010',
  text: '#191c1e',
  textSoft: '#6b7280',
  border: '#eceef0',
  warning: '#996600',
  warningBg: '#fff2cc',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  header: {
    height: 68,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 22,
    marginTop: 20,
    marginBottom: 24,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },

  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayName: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 11,
    color: COLORS.textSoft,
    fontWeight: '700',
  },

  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  activeDay: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 999,
  },

  activeDayText: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },

  reminderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },

  reminderIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderBody: {
    flex: 1,
  },

  reminderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },

  reminderDate: {
    fontSize: 10,
    color: COLORS.textSoft,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  reminderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },

  reminderAmount: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
  },

  alarmButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  modalBody: {
    padding: 20,
  },

  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },

  detailAmount: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },

  detailText: {
    fontSize: 14,
    color: COLORS.textSoft,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
  },

  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.tertiary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
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
  const normalized = status.toLowerCase();

  if (normalized.includes('lunas') || normalized.includes('paid')) {
    return {
      label: 'Lunas',
      bg: '#e2e8f0',
      text: '#475569',
    };
  }

  const parsedDueDate = new Date(dueDate);

  const overdue =
    !Number.isNaN(parsedDueDate.getTime()) &&
    parsedDueDate.getTime() < new Date().setHours(0, 0, 0, 0);

  if (normalized.includes('jatuh') || overdue) {
    return {
      label: 'Lewat Tempo',
      bg: COLORS.warningBg,
      text: COLORS.warning,
    };
  }

  return {
    label: 'Aktif',
    bg: '#dcfce7',
    text: '#166534',
  };
};

export default function DebtScreen() {
  const debts = useDebtStore((s) => s.debts);
  const isLoading = useDebtStore((s) => s.isLoading);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const deleteDebt = useDebtStore((s) => s.deleteDebt);

  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadDebts();
    }, [loadDebts]),
  );

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      return (
        new Date(a.due_date).getTime() -
        new Date(b.due_date).getTime()
      );
    });
  }, [debts]);

  const reminderDays = useMemo(() => {
    return sortedDebts.map((item) => {
      const date = new Date(item.due_date);
      return date.getDate();
    });
  }, [sortedDebts]);

  const handleDeleteDebt = (id: number, name: string) => {
    Alert.alert(
      'Hapus Catatan',
      `Yakin ingin menghapus "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteDebt(id);
            await loadDebts();
            setDetailModalVisible(false);
          },
        },
      ],
    );
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = 31;

    for (let i = 1; i <= totalDays; i++) {
      const active = reminderDays.includes(i);

      days.push(
        <View
          key={i}
          style={[styles.dayCell, active && styles.activeDay]}
        >
          <Text style={active && styles.activeDayText}>{i}</Text>
        </View>,
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pengingat Tagihan</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void loadDebts()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Mei 2026</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={COLORS.textSoft}
              />
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSoft}
              />
            </View>
          </View>

          <View style={styles.calendarGrid}>
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <Text key={d} style={styles.dayName}>
                {d}
              </Text>
            ))}

            {renderCalendar()}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daftar Tagihan</Text>

        {isLoading && sortedDebts.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : null}

        {sortedDebts.map((item) => {
          const debt = isDebtType(item.type);

          const status = getStatusMeta(
            item.status,
            item.due_date,
          );

          return (
            <Pressable
              key={item.id}
              style={styles.reminderCard}
              onPress={() => {
                setSelectedDebt(item);
                setDetailModalVisible(true);
              }}
            >
              <View
                style={[
                  styles.reminderIcon,
                  {
                    backgroundColor: debt
                      ? '#fee2e2'
                      : '#dcfce7',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    debt
                      ? 'arrow-top-right'
                      : 'arrow-bottom-left'
                  }
                  size={24}
                  color={
                    debt
                      ? COLORS.tertiary
                      : COLORS.secondary
                  }
                />
              </View>

              <View style={styles.reminderBody}>
                <View style={styles.reminderTop}>
                  <Text style={styles.reminderDate}>
                    {formatDate(item.due_date)}
                  </Text>

                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: status.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: status.text },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reminderTitle}>
                  {item.name}
                </Text>

                <Text
                  style={[
                    styles.reminderAmount,
                    {
                      color: debt
                        ? COLORS.tertiary
                        : COLORS.secondary,
                    },
                  ]}
                >
                  {debt ? '- ' : '+ '}
                  {toCurrency(item.amount)}
                </Text>
              </View>

              <TouchableOpacity style={styles.alarmButton}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </Pressable>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-debt')}
      >
        <Ionicons name="add" size={34} color="#fff" />
      </TouchableOpacity>

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
                Detail Tagihan
              </Text>

              <View style={{ width: 24 }} />
            </View>

            {selectedDebt && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.detailTitle}>
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
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={COLORS.textSoft}
                  />

                  <Text style={styles.detailText}>
                    {formatDate(selectedDebt.due_date)}
                  </Text>
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
    </SafeAreaView>
  );
}