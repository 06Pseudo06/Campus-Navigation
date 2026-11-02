"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = "campusway-theme";

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): { theme: ThemeMode; resolvedTheme: ResolvedTheme } {
  if (typeof window === "undefined") {
    return { theme: "dark", resolvedTheme: "dark" };
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const theme: ThemeMode =
      stored === "dark" || stored === "light" || stored === "system"
        ? stored
        : "dark";
    const resolvedTheme: ResolvedTheme =
      theme === "system" ? getSystemPreference() : theme;
    return { theme, resolvedTheme };
  } catch {
    return { theme: "dark", resolvedTheme: "dark" };
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // First-time visitors default to "dark", client reads from localStorage
  const [{ theme, resolvedTheme }, setThemeState] = useState<{
    theme: ThemeMode;
    resolvedTheme: ResolvedTheme;
  }>(getInitialTheme);

  // Apply theme classes and attributes to <html>
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    }
  }, []);

  // Sync theme to DOM on mount and when resolvedTheme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  // Listen for OS system theme changes when theme === "system"
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const nextResolved: ResolvedTheme = e.matches ? "dark" : "light";
      setThemeState((prev) => ({
        ...prev,
        resolvedTheme: nextResolved,
      }));
      applyTheme(nextResolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Set theme preference
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // Handle private browsing or localStorage disabled
      }

      const nextResolved: ResolvedTheme =
        newTheme === "system" ? getSystemPreference() : newTheme;

      setThemeState({
        theme: newTheme,
        resolvedTheme: nextResolved,
      });
      applyTheme(nextResolved);
    },
    [applyTheme]
  );

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
