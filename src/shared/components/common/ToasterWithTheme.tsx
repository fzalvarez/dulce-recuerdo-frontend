import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/shared/store/theme.store";

export function ToasterWithTheme() {
  const { theme } = useThemeStore();

  return (
    <Toaster theme={theme} position="bottom-right" richColors duration={3000} />
  );
}
