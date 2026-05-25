import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const ACCENT_COLORS = [
  { label: 'Biru', value: '#004ac6' },
  { label: 'Ungu', value: '#7c3aed' },
  { label: 'Hijau', value: '#059669' },
  { label: 'Oranye', value: '#ea580c' },
  { label: 'Merah', value: '#dc2626' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Indigo', value: '#4f46e5' },
];

const STORAGE_KEY = 'app_accent_color';
const DEFAULT_COLOR = '#004ac6';

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: DEFAULT_COLOR,
  setAccentColor: async () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState(DEFAULT_COLOR);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setAccentColorState(saved);
    });
  }, []);

  const setAccentColor = useCallback(async (color: string) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(STORAGE_KEY, color);
  }, []);

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
