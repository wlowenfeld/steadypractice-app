import React, { createContext, useContext, useMemo } from 'react';
import { useAppStore, ThemeMode } from './store';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ResolvedTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: {
    bg: string;
    bgSecondary: string;
    card: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    tabBar: string;
    tabBarBorder: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  const theme: ResolvedTheme = themeMode;
  const isDark = theme === 'dark';

  const colors = useMemo(() => {
    if (theme === 'dark') {
      return {
        bg: '#2B3830',
        bgSecondary: '#354840',
        card: '#354840',
        cardBorder: '#4E6858',
        text: '#FFFFFF',
        textSecondary: '#A3BCAD',
        textTertiary: '#8CA696',
        accent: '#C8DCC0',
        tabBar: '#2B3830',
        tabBarBorder: '#4E6858',
      };
    }
    // Light theme (default)
    return {
      bg: '#FAFAF7',
      bgSecondary: '#F5F3EE',
      card: '#FFFFFF',
      cardBorder: '#E2E0DB',
      text: '#2C3830',
      textSecondary: '#5B6B60',
      textTertiary: '#7A8F80',
      accent: '#4A6352',
      tabBar: '#FAFAF7',
      tabBarBorder: '#E2E0DB',
    };
  }, [theme]);

  const value = useMemo(
    () => ({ theme, themeMode, setThemeMode, isDark, colors }),
    [theme, themeMode, setThemeMode, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
