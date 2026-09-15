import { useEffect } from "react";
import { useThemeStore } from "@/shared/store/theme.store";

export function ThemeHydrator() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
