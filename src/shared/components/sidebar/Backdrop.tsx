import { useSidebarStore } from "@/shared/store/sidebar.store";

export function Backdrop() {
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const toggleMobileSidebar = useSidebarStore((s) => s.toggleMobileSidebar);

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
}
