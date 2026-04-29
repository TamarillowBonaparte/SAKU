/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Editorial Ledger Design System Colors
const primary = '#004ac6';
const primaryContainer = '#2563eb';
const secondary = '#006e2d';
const secondaryContainer = '#7cf994';
const tertiary = '#ae0010';
const tertiaryContainer = '#d52022';
const background = '#f7f9fb';
const surface = '#ffffff';
const onBackground = '#191c1e';
const onSurface = '#191c1e';
const error = '#ba1a1a';

export const Colors = {
  light: {
    text: onSurface,
    background: background,
    surface: surface,
    tint: primary,
    primary: primary,
    primaryContainer: primaryContainer,
    secondary: secondary,
    secondaryContainer: secondaryContainer,
    tertiary: tertiary,
    tertiaryContainer: tertiaryContainer,
    error: error,
    icon: onSurface,
    tabIconDefault: 'rgba(25, 28, 30, 0.4)',
    tabIconSelected: primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#191c1e',
    surface: '#2d3133',
    tint: primaryContainer,
    primary: primary,
    primaryContainer: primaryContainer,
    secondary: secondary,
    secondaryContainer: secondaryContainer,
    tertiary: tertiary,
    tertiaryContainer: tertiaryContainer,
    error: error,
    icon: '#A0A0A0',
    tabIconDefault: '#707070',
    tabIconSelected: primaryContainer,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
