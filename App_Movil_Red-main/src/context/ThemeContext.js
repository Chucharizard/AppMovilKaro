import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema claro
const lightTheme = {
  colors: {
    primary: '#8B2635',
    primaryDark: '#5C1A24',
    primaryLight: '#A63D4C',
    secondary: '#50C878',
    accent: '#D64550',
    warning: '#FFB84D',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceDark: '#E8ECEF',
    card: '#FFFFFF',
    border: '#E8ECEF',
    text: '#2C3E50',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    textLight: '#BDC3C7',
    success: '#27AE60',
    error: '#E74C3C',
    info: '#3498DB',
    like: '#3B5998',
    love: '#E0245E',
    laugh: '#FDCB5C',
    wow: '#F7B731',
    sad: '#95A5A6',
    angry: '#C0392B',
  },
};

// Tema oscuro
const darkTheme = {
  colors: {
    primary: '#A63D4C',
    primaryDark: '#8B2635',
    primaryLight: '#C05560',
    secondary: '#5FD68A',
    accent: '#B84550',
    warning: '#FFC266',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceDark: '#2C2C2C',
    card: '#1E1E1E',
    border: '#2C2C2C',
    text: '#E8E8E8',
    textPrimary: '#E8E8E8',
    textSecondary: '#A0A0A0',
    textLight: '#6C6C6C',
    success: '#2ECC71',
    error: '#EC5A4C',
    info: '#3FA9E8',
    like: '#5A7BC8',
    love: '#E84165',
    laugh: '#FDD76C',
    wow: '#F9C951',
    sad: '#A5B5B6',
    angry: '#D0594B',
  },
};

// Propiedades comunes del tema
const commonTheme = {
  gradients: {
    header: ['#5C1A24', '#8B2635'],
    card: ['#FFFFFF', '#F5F7FA'],
    button: ['#8B2635', '#A63D4C'],
    notification: ['#732128', '#8B2635'],
    carpooling: ['#50C878', '#6FD896'],
    academic: ['#9B59B6', '#B07CC6'],
  },
  fonts: {
    primary: 'System',
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 30,
    full: 999,
  },
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
    pressScale: 0.95,
  },
  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
  components: {
    button: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 24,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    input: {
      height: 48,
      borderRadius: 10,
      paddingHorizontal: 16,
      borderWidth: 1,
    },
    tabBar: {
      height: 75,
      paddingBottom: 8,
    },
    avatar: {
      sm: 32,
      md: 40,
      lg: 100,
    },
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Cargar preferencia guardada
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const theme = {
    ...(isDark ? darkTheme : lightTheme),
    ...commonTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
