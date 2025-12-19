"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Theme, ThemeContextType } from "@/src/interfaces/context";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyThemeToDOM = (resolvedTheme: "light" | "dark") => {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 300);
};

const handleChange = () => {
  applyThemeToDOM(getSystemTheme());
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as Theme) ?? "system";
  });

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return theme === "system" ? getSystemTheme() : theme;
  }, [theme]);

  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
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
