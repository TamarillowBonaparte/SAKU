import { Todo, useTodoStore } from "@/store/useTodoStore";
import {
    calculateNotificationTime,
    formatTimeUntilNotification,
} from "@/utils/reminderNotification";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function ReminderScreen() {
  const router = useRouter();
  const { todos, loadTodos, deleteTodo, isLoading } = useTodoStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<any>(null);

  // Load todos when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadTodos();
      loadReminderSettingsFromStorage();
    }, [loadTodos])
  );

  const loadReminderSettingsFromStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem("todoReminderSettings");
      if (saved) {
        setReminderSettings(JSON.parse(saved));
      } else {
        setReminderSettings({
          type: "1hour",
          customValue: 1,
          customUnit: "hours",
        });
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    }
  };

  // Format date to YYYY-MM-DD
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateOnly = (value: string) => {
    const normalizedDate = getDateKey(value);
    const [yearText, monthText, dayText] = normalizedDate.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return new Date(value);
    }

    return new Date(year, month - 1, day);
  };

  const getDateKey = (value: string): string => {
    const trimmedValue = value.trim();
    const directDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (directDateMatch) {
      return `${directDateMatch[1]}-${directDateMatch[2]}-${directDateMatch[3]}`;
    }

    const parsedDate = new Date(trimmedValue);
    if (!Number.isNaN(parsedDate.getTime())) {
      return formatDateToString(parsedDate);
    }

    return trimmedValue;
  };

  const formatTodoDate = (value: string) => {
    const parsedDate = parseDateOnly(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTodoDateTime = (todo: Todo) => {
    const baseDate = parseDateOnly(todo.date);

    if (todo.time) {
      const parsedTime = new Date(todo.time);
      if (!Number.isNaN(parsedTime.getTime())) {
        const combinedDate = new Date(baseDate);
        combinedDate.setHours(parsedTime.getHours(), parsedTime.getMinutes(), parsedTime.getSeconds(), 0);
        return combinedDate;
      }

      const [hoursText, minutesText] = todo.time.split(":");
      const hours = Number(hoursText);
      const minutes = Number(minutesText);
      const combinedDate = new Date(baseDate);
      combinedDate.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
      return combinedDate;
    }

    return baseDate;
  };

  const formatTodoTime = (value?: string) => {
    if (!value) {
      return null;
    }

    const parsedTime = new Date(value);
    if (!Number.isNaN(parsedTime.getTime())) {
      return parsedTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    const [hoursText, minutesText] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return value;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  // Get events for a specific date
  const getEventsForDate = (dateStr: string): Todo[] => {
    return todos
      .filter((todo) => getDateKey(todo.date) === dateStr)
      .sort((a, b) => getTodoDateTime(a).getTime() - getTodoDateTime(b).getTime());
  };

  // Get all days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDatePress = (day: number) => {
    const dateStr = formatDateToString(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    const eventsForDate = getEventsForDate(dateStr);

    if (eventsForDate.length > 0) {
      setSelectedDate(dateStr);
      setModalVisible(true);
    }
  };

  const handleEditTodo = (todoId: number) => {
    setModalVisible(false);
    router.push({
      pathname: "/add-todo",
      params: { editId: todoId.toString() },
    });
  };

  const handleDeleteTodo = async (todoId: number) => {
    Alert.alert("Delete Reminder", "Apakah Anda yakin ingin menghapus?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteTodo(todoId);
            setModalVisible(false);
            setSelectedDate(null);
            Alert.alert("Success", "Reminder berhasil dihapus");
          } catch {
            Alert.alert("Error", "Gagal menghapus reminder");
          } finally {
            setDeleting(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = selectedDate
    ? getEventsForDate(selectedDate)
    : [];
  const upcomingEvents = todos
    .filter((todo) => {
      return getTodoDateTime(todo) >= new Date() && !todo.is_done;
    })
    .sort((a, b) => getTodoDateTime(a).getTime() - getTodoDateTime(b).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarWrap}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJrPETgcUp2PzjSFueY6HufScGG7-otzxzUOEXsovjiTyPZe3T7LiGJWCKYB6OOToLWvEdxIBVTNdpghxHvYwLR1Ebk2TiW03uFh8ygs80VKwOl-z3qHUEfgEcCdlYICBGaqnUZFUZn_Oxx6atrrIQ4YCS7FmsE_XZl_d4pOBOdvST0YypaJ4bPUJWqj7Wi0hYoMaU7gFlcWq-qyRwBThoErE5OUiWwljunLS7X3Iwd-wBdZkMoFXITbRp94FG6FjiVt15Hk4vFxQ",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Reminder</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.calendarHeader}>
              <Text style={styles.monthTitle}>
                {currentDate.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handlePrevMonth}
                >
                  <Ionicons name="chevron-back" size={18} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleNextMonth}
                >
                  <Ionicons name="chevron-forward" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Day labels */}
            <View style={styles.grid}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <View key={`${day}-${index}`} style={styles.dayWrap}>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar days */}
            <View style={styles.grid}>
              {days.map((day, index) => {
                const dateStr =
                  day !== null
                    ? formatDateToString(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day
                        )
                      )
                    : null;
                const hasEvents = day !== null && getEventsForDate(dateStr!).length > 0;
                const isToday =
                  day !== null &&
                  new Date().toDateString() ===
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    ).toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayWrap}
                    onPress={() => day !== null && handleDatePress(day)}
                    disabled={day === null}
                  >
                    {day !== null ? (
                      <View
                        style={[
                          isToday && styles.activeDate,
                          hasEvents && styles.eventDate,
                          hasEvents && styles.eventDateActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            isToday && { color: "#2563EB", fontWeight: "700" },
                            hasEvents && styles.eventDateText,
                          ]}
                        >
                          {day}
                        </Text>
                        {hasEvents && <View style={styles.eventDot} />}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Upcoming Events */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : upcomingEvents.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>Mendatang</Text>
              {todos.length > 3 && (
                <TouchableOpacity
                  onPress={() => {
                    // Show all reminders
                  }}
                >
                  <Text style={styles.link}>Lihat Semua</Text>
                </TouchableOpacity>
              )}
            </View>

            {upcomingEvents.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.reminderCard}
                onPress={() => {
                  setSelectedDate(getDateKey(item.date));
                  setModalVisible(true);
                }}
              >
                <View style={styles.iconBox}>
                  <MaterialIcons name="event-note" size={26} color="#2563EB" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Upcoming</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MaterialIcons
                        name="calendar-today"
                        size={14}
                        color="#777"
                      />
                      <Text style={styles.metaText}>{formatTodoDate(item.date)}</Text>
                    </View>

                    {item.time && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#777" />
                        <Text style={styles.metaText}>{formatTodoTime(item.time)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Tidak ada reminder</Text>
          </View>
        )}
      </ScrollView>

      {/* Event Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedDate(null);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(false);
            setSelectedDate(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedDate(null);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#111" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Event Details</Text>
                  <View style={{ width: 24 }} />
                </View>

                <ScrollView>
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event) => {
                      // Calculate notification time
                      const eventDateTime = getTodoDateTime(event);
                      const notificationTime = reminderSettings
                        ? calculateNotificationTime(eventDateTime, reminderSettings)
                        : eventDateTime;
                      const timeUntilNotification = formatTimeUntilNotification(
                        notificationTime
                      );

                      return (
                        <View key={event.id} style={styles.eventDetailsContainer}>
                          <View style={styles.eventIconBox}>
                            <MaterialIcons name="event-note" size={32} color="#2563EB" />
                          </View>

                          <Text style={styles.eventTitle}>{event.title}</Text>

                          <View style={styles.eventDetailsRow}>
                            <MaterialIcons name="calendar-today" size={16} color="#666" />
                            <Text style={styles.eventDetailText}>{formatTodoDate(event.date)}</Text>
                          </View>

                          {event.time && (
                            <View style={styles.eventDetailsRow}>
                              <Ionicons name="time-outline" size={16} color="#666" />
                              <Text style={styles.eventDetailText}>{formatTodoTime(event.time)}</Text>
                            </View>
                          )}

                          {/* Notification Time Display */}
                          <View style={styles.notificationTimeBadge}>
                            <Ionicons name="alarm" size={14} color="#2563EB" />
                            <Text style={styles.notificationTimeText}>
                              Notifikasi dalam {timeUntilNotification}
                            </Text>
                          </View>

                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => handleEditTodo(event.id)}
                            >
                              <MaterialIcons name="edit" size={18} color="#fff" />
                              <Text style={styles.buttonLabel}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
                              onPress={() => handleDeleteTodo(event.id)}
                              disabled={deleting}
                            >
                              {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Ionicons name="trash" size={18} color="#fff" />
                                  <Text style={styles.buttonLabel}>Delete</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptyModalState}>
                      <Text style={styles.emptyText}>Tidak ada reminder di tanggal ini</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-todo")}
      >
        <Ionicons name="add" size={34} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    backgroundColor: "#ffffff",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    marginRight: 12,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    alignItems: "center",
  },

  monthTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  row: {
    flexDirection: "row",
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    backgroundColor: "#F5F5F5",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayWrap: {
    width: "14.28%",
    alignItems: "center",
    marginBottom: 14,
  },

  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888",
  },

  dateText: {
    fontSize: 14,
    color: "#111",
  },

  activeDate: {
    backgroundColor: "#DBEAFE",
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  eventDate: {
    position: "relative",
  },

  eventDateActive: {
    backgroundColor: "#FEE2E2",
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  eventDateText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    position: "absolute",
    bottom: -8,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  link: {
    color: "#2563EB",
    fontWeight: "700",
  },

  reminderCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    marginTop: 14,
    shadowColor: "#2563EB",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  reminderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
  },

  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 14,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },

  eventDetailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },

  eventIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  eventTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
    textAlign: "center",
  },

  eventDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  eventDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },

  editButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  deleteButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#EF4444",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  buttonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  loadingContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },

  emptyModalState: {
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  notificationTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 16,
    gap: 8,
  },

  notificationTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
    flex: 1,
  },
});