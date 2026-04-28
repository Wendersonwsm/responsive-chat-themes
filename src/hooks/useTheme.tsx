import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeName = 'light' | 'dark' | 'ocean' | 'midnight';

export const THEMES: { id: ThemeName; label: string; preview: string }[] = [
  { id: 'light', label: 'Claro', preview: 'linear-gradient(135deg,#faf8f5,#dbeafe)' },
  { id: 'dark', label: 'Escuro', preview: 'linear-gradient(135deg,#1c1a18,#1e3a5f)' },
  { id: 'ocean', label: 'Azul Oceano', preview: 'linear-gradient(135deg,#e0f2fe,#0284c7)' },
  { id: 'midnight', label: 'Roxo Midnight', preview: 'linear-gradient(135deg,#1a0f2e,#a855f7)' },
];

interface Ctx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeCtx = createContext<Ctx>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('finwise-theme') as ThemeName | null;
    return saved && THEMES.find(t => t.id === saved) ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finwise-theme', theme);
  }, [theme]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').update({ theme: t }).eq('id', data.user.id);
      }
    });
  };

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
