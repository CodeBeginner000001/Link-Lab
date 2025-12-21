"use client"
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./Button";
import { Moon, Sun } from "lucide-react";

export default function ToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };
  return (
    <Button variant="ghost" size="icon" className="cursor-pointer rounded-full" onClick={handleThemeToggle}>
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
