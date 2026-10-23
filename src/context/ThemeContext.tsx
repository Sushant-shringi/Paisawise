import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId = 
  | 'professional-carbon' 
  | 'crimson-dusk' 
  | 'cobalt-steel' 
  | 'ember-glow' 
  | 'mint-frost';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  mode: 'dark' | 'light';
  accentColor: string;
  accentSecondary: string;
  previewBorder: string;
  cardBg: string;
  isDark: boolean;
  swatches: string[];
}

export const PAISAWISE_THEMES: ThemeConfig[] = [
  {
    id: 'professional-carbon',
    name: 'Professional Carbon',
    tagline: 'Stealth carbon & emerald accents',
    mode: 'dark',
    accentColor: '#10b981',
    accentSecondary: '#059669',
    previewBorder: 'border-slate-500/60',
    cardBg: '#111827',
    isDark: true,
    swatches: ['#090d16', '#111827', '#10b981', '#34d399']
  },
  {
    id: 'crimson-dusk',
    name: 'Crimson Dusk',
    tagline: 'Deep velvet wine & warm gold highlights',
    mode: 'dark',
    accentColor: '#e11d48',
    accentSecondary: '#f59e0b',
    previewBorder: 'border-rose-600/70',
    cardBg: '#1f0b10',
    isDark: true,
    swatches: ['#14070a', '#1f0b10', '#e11d48', '#f59e0b']
  },
  {
    id: 'cobalt-steel',
    name: 'Cobalt Steel',
    tagline: 'Midnight steel & electric cyber cyan',
    mode: 'dark',
    accentColor: '#06b6d4',
    accentSecondary: '#3b82f6',
    previewBorder: 'border-cyan-500/70',
    cardBg: '#0a1931',
    isDark: true,
    swatches: ['#050f1e', '#0a1931', '#06b6d4', '#38bdf8']
  },
  {
    id: 'ember-glow',
    name: 'Ember Glow',
    tagline: 'Charcoal espresso & radiant amber fire',
    mode: 'dark',
    accentColor: '#f97316',
    accentSecondary: '#eab308',
    previewBorder: 'border-amber-600/70',
    cardBg: '#1f140c',
    isDark: true,
    swatches: ['#140d08', '#1f140c', '#f97316', '#fdba74']
  },
  {
    id: 'mint-frost',
    name: 'Mint Frost',
    tagline: 'Pristine airy daylight & frosted mint glass',
    mode: 'light',
    accentColor: '#059669',
    accentSecondary: '#10b981',
    previewBorder: 'border-emerald-400',
    cardBg: '#ffffff',
    isDark: false,
    swatches: ['#f0fdf4', '#ffffff', '#059669', '#a7f3d0']
  }
];

interface ThemeContextType {
  activeTheme: ThemeId;
  themeConfig: ThemeConfig;
  allThemes: ThemeConfig[];
  setTheme: (themeId: ThemeId) => void;
  // Compatibility helpers
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('paisawise_theme_id') as ThemeId;
    if (saved && PAISAWISE_THEMES.some(t => t.id === saved)) {
      return saved;
    }
    // Backward compatibility with legacy 'dark' / 'light'
    const legacy = localStorage.getItem('paisawise_theme');
    if (legacy === 'light') return 'mint-frost';
    return 'professional-carbon';
  });

  const currentConfig = PAISAWISE_THEMES.find(t => t.id === activeTheme) || PAISAWISE_THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme attribute
    root.setAttribute('data-theme', activeTheme);

    // Set or remove 'dark' class
    if (currentConfig.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist
    localStorage.setItem('paisawise_theme_id', activeTheme);
    localStorage.setItem('paisawise_theme', currentConfig.mode);
  }, [activeTheme, currentConfig]);

  const setTheme = (themeId: ThemeId) => {
    if (PAISAWISE_THEMES.some(t => t.id === themeId)) {
      setActiveThemeState(themeId);
    }
  };

  const toggleTheme = () => {
    // Quick toggle switches between the active dark theme and Mint Frost (light)
    if (currentConfig.isDark) {
      setActiveThemeState('mint-frost');
    } else {
      setActiveThemeState('professional-carbon');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        themeConfig: currentConfig,
        allThemes: PAISAWISE_THEMES,
        setTheme,
        theme: currentConfig.mode,
        toggleTheme,
      }}
    >
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
