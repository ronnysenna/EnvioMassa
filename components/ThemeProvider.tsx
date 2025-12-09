"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Forçar tema claro independentemente do navegador/sistema
  const [theme, setThemeState] = useState<Theme>(() => "light");

  useEffect(() => {
    try {
      // Sempre salvar 'light' e remover qualquer classe 'dark' no <html>
      localStorage.setItem("theme", "light");
      const el = document.documentElement;
      el.classList.remove("dark");
    } catch (_e) {
      // ignore
    }
    // executa apenas uma vez
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  // Impedir ativação do tema escuro: toggle força 'light'
  const toggleTheme = () => setThemeState("light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
