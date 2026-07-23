"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
    backgroundSecondary: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    inner: string;
  };
}

const defaultTheme: DashboardTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    neutral: '#6b7280',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    border: '#e2e8f0',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
};

const ThemeContext = createContext<DashboardTheme>(defaultTheme);

export const useDashboardTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useDashboardTheme must be used within DashboardThemeProvider');
  }
  return theme;
};

interface DashboardThemeProviderProps {
  children: React.ReactNode;
  theme?: Partial<DashboardTheme>;
}

export const DashboardThemeProvider: React.FC<DashboardThemeProviderProps> = ({ 
  children, 
  theme = {} 
}) => {
  const mergedTheme = { ...defaultTheme, ...theme };
  
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
