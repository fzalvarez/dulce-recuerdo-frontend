import { MenuIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebar.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  const toggleMobileSidebar = useSidebarStore((s) => s.toggleMobileSidebar);
  const getUserName = useAuthStore((s) => s.getUserName);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-30">
      {/* Sidebar toggle (mobile/tablet) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileSidebar}
        className="lg:hidden shrink-0 text-slate-600"
        aria-label="Abrir menú"
      >
        <MenuIcon className="w-5 h-5" />
      </Button>

      {/* Universal search */}
      <div className="flex-1 max-w-xl min-w-0">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <Input
            type="text"
            placeholder="Buscar casos, expedientes, clientes, veterinarias..."
            className="pl-10 pr-4 h-10 py-2 text-xs md:text-sm bg-slate-50 border-slate-200 text-slate-600 focus:bg-white"
          />
          <div className="hidden sm:flex absolute inset-y-0 right-0 pr-2.5 items-center">
            <kbd className="px-1.5 py-0.5 text-label font-semibold text-slate-400 bg-white border border-slate-200 rounded">
              Ctrl + K
            </kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-800">
            Crematorio: Activo • Guardias OK
          </span>
        </div>

        <Button variant="operational" size="sm" className="px-3 sm:px-3.5">
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Caso</span>
        </Button>

        <div className="hidden md:block h-8 w-px bg-slate-200" />

        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
          {getUserName().slice(0, 2).toUpperCase() || "DR"}
        </div>
      </div>
    </header>
  );
}
