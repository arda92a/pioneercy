"use client";
import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

// Anahtar değişti: eski "admin-theme" kayıtları yok sayılır, herkes açık temayla başlar.
const STORAGE_KEY = "admin-theme-v2";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const readTheme = (): Theme => (localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light");

export function useAdminTheme() {
  return useContext(ThemeContext);
}

export default function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  function toggle() {
    localStorage.setItem(STORAGE_KEY, theme === "dark" ? "light" : "dark");
    listeners.forEach((l) => l());
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
