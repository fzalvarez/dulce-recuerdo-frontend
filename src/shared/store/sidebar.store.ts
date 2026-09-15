import { create } from "zustand";

type SidebarState = {
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

export const useSidebarStore = create<SidebarState>()((set) => ({
  isMobileOpen: false,
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobileSidebar: () => set({ isMobileOpen: false }),
}));
