import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useDebtStore } from "@/store/useDebtStore";
import { useTodoStore } from "@/store/useTodoStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { setupAppServices } from "@/utils/appInit";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadBudgets = useBudgetStore((s) => s.loadBudgets);
  const loadDebts = useDebtStore((s) => s.loadDebts);
  const loadTodos = useTodoStore((s) => s.loadTodos);
  const loadCategories = useCategoryStore((s) => s.loadCategories);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const loadAllData = async () => {
        try {
          await Promise.all([
            loadCategories(),
            loadTransactions(),
            loadBudgets(),
            loadDebts(),
            loadTodos(),
            setupAppServices(), // Initialize OCR for receipt scanner
          ]);
          console.log("All data loaded successfully");
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      };

      loadAllData();
    }
  }, [
    isAuthenticated,
    isLoading,
    loadTransactions,
    loadBudgets,
    loadDebts,
    loadTodos,
    loadCategories,
  ]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="reset_password"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
        <Redirect href="/login" />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{ title: "Add Transaction" }}
        />
        <Stack.Screen name="add-budget" options={{ title: "Add Budget" }} />
        <Stack.Screen name="add-debt" options={{ title: "Add Debt" }} />
        <Stack.Screen name="add-todo" options={{ title: "Add Todo" }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
