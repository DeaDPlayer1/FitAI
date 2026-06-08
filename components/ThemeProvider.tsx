import React, { createContext, useContext, useMemo } from 'react';
import { theme as lightTheme } from '@/constants/theme';
import { darkTheme } from '@/constants/darkTheme';
import { useUserStore } from '@/store/userStore';

type Theme = typeof lightTheme;

const ThemeContext = createContext<Theme>(lightTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const activeTheme = useMemo(() => (user?.dark_mode ? darkTheme : lightTheme), [user?.dark_mode]);

  return (
    <ThemeContext.Provider value={activeTheme}>
      {children}
    </ThemeContext.Provider>
  );
}
