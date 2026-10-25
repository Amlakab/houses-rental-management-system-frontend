'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved theme
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else if (systemPrefersDark) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  // Synchronized Material-UI Theme for flawless contrast across modals, menus, inputs & cards
  const muiTheme = useMemo(() => {
    const isDark = theme === 'dark';
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: '#2563EB',
          light: '#60A5FA',
          dark: '#1D4ED8',
        },
        secondary: {
          main: '#0EA5E9',
        },
        background: {
          default: isDark ? '#0a192f' : '#F8FAFC',
          paper: isDark ? '#112240' : '#FFFFFF',
        },
        text: {
          primary: isDark ? '#F1F5F9' : '#0F172A',
          secondary: isDark ? '#94A3B8' : '#475569',
        },
        divider: isDark ? '#233554' : '#E2E8F0',
      },
      typography: {
        fontFamily: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'].join(','),
      },
      shape: {
        borderRadius: 10,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#112240' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? '#112240' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              border: isDark ? '1px solid rgba(0, 255, 255, 0.2)' : '1px solid #E2E8F0',
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundColor: isDark ? '#112240' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              border: isDark ? '1px solid #233554' : '1px solid #E2E8F0',
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              color: isDark ? '#F1F5F9' : '#0F172A',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            icon: {
              color: isDark ? '#94A3B8' : '#475569',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? '#38BDF8' : '#2563EB',
              },
            },
          },
        },
      },
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}