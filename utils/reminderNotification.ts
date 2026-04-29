import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReminderSettings {
  type: "1hour" | "2hours" | "custom";
  customValue: number;
  customUnit: "minutes" | "hours" | "days";
}

export interface ReminderSchedule {
  todoId: number;
  title: string;
  scheduledTime: number; // Timestamp in milliseconds
  notificationId: string;
}

/**
 * Calculate when to send the notification based on todo time and reminder settings
 */
export const calculateNotificationTime = (
  todoDateTime: Date,
  reminderSettings: ReminderSettings
): Date => {
  const notificationTime = new Date(todoDateTime.getTime());

  switch (reminderSettings.type) {
    case "1hour":
      notificationTime.setHours(notificationTime.getHours() - 1);
      break;
    case "2hours":
      notificationTime.setHours(notificationTime.getHours() - 2);
      break;
    case "custom":
      if (reminderSettings.customUnit === "minutes") {
        notificationTime.setMinutes(
          notificationTime.getMinutes() - reminderSettings.customValue
        );
      } else if (reminderSettings.customUnit === "hours") {
        notificationTime.setHours(
          notificationTime.getHours() - reminderSettings.customValue
        );
      } else if (reminderSettings.customUnit === "days") {
        notificationTime.setDate(
          notificationTime.getDate() - reminderSettings.customValue
        );
      }
      break;
  }

  return notificationTime;
};

/**
 * Get saved reminder settings from device storage
 */
export const getReminderSettings = async (): Promise<ReminderSettings> => {
  try {
    const saved = await AsyncStorage.getItem("todoReminderSettings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading reminder settings:", error);
  }

  // Return default settings
  return {
    type: "1hour",
    customValue: 1,
    customUnit: "hours",
  };
};

/**
 * Save reminder schedule to device storage
 */
export const saveReminderSchedule = async (
  todoId: number,
  schedule: ReminderSchedule
): Promise<void> => {
  try {
    const key = `todoReminder_${todoId}`;
    await AsyncStorage.setItem(key, JSON.stringify(schedule));
  } catch (error) {
    console.error("Error saving reminder schedule:", error);
  }
};

/**
 * Get saved reminder schedule for a specific todo
 */
export const getReminderSchedule = async (
  todoId: number
): Promise<ReminderSchedule | null> => {
  try {
    const key = `todoReminder_${todoId}`;
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading reminder schedule:", error);
  }
  return null;
};

/**
 * Delete reminder schedule
 */
export const deleteReminderSchedule = async (todoId: number): Promise<void> => {
  try {
    const key = `todoReminder_${todoId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error deleting reminder schedule:", error);
  }
};

/**
 * Format time until notification
 */
export const formatTimeUntilNotification = (notificationTime: Date): string => {
  const now = new Date();
  const diff = notificationTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Segera";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};
