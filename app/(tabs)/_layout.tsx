import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link, Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 80 : 70;
const ADD_BTN_SIZE = 60;
const ADD_BTN_RISE = 22; // how many px the button floats above the bar

/**
 * TAB NAVIGATION LAYOUT
 * =====================
 * Custom tab bar implementation with floating action button.
 * Only renders when inside the (tabs) route group.
 * Handles tab switching and UI styling.
 */

const styles = StyleSheet.create({
  // outer wrapper that allows the floating button to overflow upward
  outerWrapper: {
    overflow: "visible",
    backgroundColor: "transparent",
  },
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fb",
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "visible",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tabButtonLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // space in the middle row for the button
  centerSlot: {
    width: ADD_BTN_SIZE + 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  addButton: {
    position: "absolute",
    bottom: TAB_BAR_HEIGHT / 2 - ADD_BTN_SIZE / 2 + ADD_BTN_RISE,
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: ADD_BTN_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 99,
  },
});

interface TabItem {
  name: string;
  icon: string;
  label: string;
  routeIndex: number;
}

const LEFT_TABS: TabItem[] = [
  { name: "index", icon: "home", label: "Beranda", routeIndex: 0 },
  {
    name: "transaction",
    icon: "receipt-text",
    label: "Riwayat",
    routeIndex: 1,
  },
  {
    name: "todo",
    icon: "clipboard-list-outline",
    label: "Event",
    routeIndex: 2,
  },
];

const RIGHT_TABS: TabItem[] = [
  { name: "budget", icon: "wallet", label: "Budget", routeIndex: 3 },
  { name: "debt", icon: "bank", label: "Utang", routeIndex: 4 },
  { name: "profile", icon: "account", label: "Profil", routeIndex: 5 },
];

interface CustomTabBarProps {
  state: any;
  navigation: any;
  accentColor: string;
}

function CustomTabBar({ state, navigation, accentColor }: CustomTabBarProps) {
  const inactive = "rgba(25, 28, 30, 0.4)";

  return (
    <View style={styles.outerWrapper}>
      <View style={[styles.tabBarContainer, { shadowColor: accentColor }]}>
        {/* Left tabs */}
        {LEFT_TABS.map((tab) => {
          const color = state.index === tab.routeIndex ? accentColor : inactive;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabButton}
              onPress={() => navigation.navigate(tab.name)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={color}
              />
              <Text style={[styles.tabButtonLabel, { color }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Center slot — floating button lives here */}
        <View style={styles.centerSlot}>
          <Link href="/add-transaction" asChild>
            <Pressable
              style={[
                styles.addButton,
                {
                  backgroundColor: accentColor || "#1B4FD8",
                  shadowColor: accentColor || "#1B4FD8",
                },
              ]}
              onPress={() => {
                /* Navigation handled by Link */
              }}
            >
              <MaterialCommunityIcons name="plus" size={32} color="#fff" />
            </Pressable>
          </Link>
        </View>

        {/* Right tabs */}
        {RIGHT_TABS.map((tab) => {
          const color = state.index === tab.routeIndex ? accentColor : inactive;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabButton}
              onPress={() => navigation.navigate(tab.name)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={color}
              />
              <Text style={[styles.tabButtonLabel, { color }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { accentColor } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: "rgba(25, 28, 30, 0.4)",
        headerShown: false,
        tabBarButton: HapticTab,
      }}
      tabBar={(props) => (
        <CustomTabBar
          state={props.state}
          navigation={props.navigation}
          accentColor={accentColor}
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="receipt-text"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: "Kegiatan",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Anggaran",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debt"
        options={{
          title: "Utang",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bank" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
