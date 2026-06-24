"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Theme, ThemeContextType } from "@/interfaces/context";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEMES = new Set<Theme>(["light", "dark", "system"]);

const getSystemTheme = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const getStoredTheme = (): Theme => {
  const storedTheme = localStorage.getItem("theme");

  return THEMES.has(storedTheme as Theme) ? (storedTheme as Theme) : "system";
};

const applyThemeToDOM = (
  resolvedTheme: "light" | "dark",
  shouldTransition = true,
) => {
  const root = document.documentElement;

  if (shouldTransition) {
    root.classList.add("theme-transition");
  }

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);

  if (shouldTransition) {
    setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);
  }
};

const handleChange = () => {
  applyThemeToDOM(getSystemTheme());
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const hasAppliedTheme = useRef(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return getStoredTheme();
  });

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return theme === "system" ? getSystemTheme() : theme;
  }, [theme]);

  useEffect(() => {
    applyThemeToDOM(resolvedTheme, hasAppliedTheme.current);
    hasAppliedTheme.current = true;
    localStorage.setItem("theme", theme);
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
