import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#f7f9fb',
    borderTopColor: 'transparent',
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#004ac6',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    position: 'relative',
  },
  tabBarContainer: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#f7f9fb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#004ac6',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tabButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabButtonLabelActive: {
    color: '#004ac6',
  },
  tabButtonLabelInactive: {
    color: 'rgba(25, 28, 30, 0.4)',
  },
  addButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004ac6',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 50,
    left: '50%',
    marginLeft: -30,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#004ac6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Custom Tab Bar Component
  const CustomTabBar = (props: any) => {
    const { state, descriptors, navigation } = props;

    return (
      <View style={styles.tabBarContainer}>
        {/* Tab 1: Beranda */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('index')}
        >
          <MaterialCommunityIcons
            name="home"
            size={24}
            color={state.index === 0 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 0 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
            Beranda
          </Text>
        </Pressable>

        {/* Tab 2: Riwayat */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('transaction')}
        >
          <MaterialCommunityIcons
            name="receipt-text"
            size={24}
            color={state.index === 1 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 1 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
            Riwayat
          </Text>
        </Pressable>

        {/* Tab 3: List Kegiatan */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('todo')}
        >
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={24}
            color={state.index === 2 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 2 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
           Event
          </Text>
        </Pressable>

        {/* Empty space for centered add button */}
        <View style={styles.tabButton} />

        {/* Tab 4: Anggaran */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('budget')}
        >
          <MaterialCommunityIcons
            name="wallet"
            size={24}
            color={state.index === 3 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 3 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
            Buged
          </Text>
        </Pressable>

        {/* Tab 5: Utang */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('debt')}
        >
          <MaterialCommunityIcons
            name="bank"
            size={24}
            color={state.index === 4 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 4 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
            Utang
          </Text>
        </Pressable>

        {/* Tab 6: Profile */}
        <Pressable
          style={styles.tabButton}
          onPress={() => navigation.navigate('profile')}
        >
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={state.index === 5 ? '#004ac6' : 'rgba(25, 28, 30, 0.4)'}
          />
          <Text
            style={[
              styles.tabButtonLabel,
              state.index === 5 ? styles.tabButtonLabelActive : styles.tabButtonLabelInactive,
            ]}
          >
            Profil
          </Text>
        </Pressable>

        {/* Floating Add Button - Positioned Absolutely */}
        <Link href="/add-transaction" asChild>
          <Pressable style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={32} color="#ffffff" />
          </Pressable>
        </Link>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#004ac6',
        tabBarInactiveTintColor: 'rgba(25, 28, 30, 0.4)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarStyle: styles.tabBar,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
      tabBar={CustomTabBar}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="receipt-text" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'Kegiatan',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Anggaran',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debt"
        options={{
          title: 'Utang',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bank" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
