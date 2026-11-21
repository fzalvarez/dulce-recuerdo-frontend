import { ExternalLinkIcon, MenuIcon } from "lucide-react";
import { useSidebarStore } from "@/shared/store/sidebar.store";
import { Button } from "@/components/ui/button";

/** Sistema externo de facturación electrónica (SUSSI). Se abre en una pestaña nueva. */
const FACTURACION_URL = "https://sistema.susii.com/login";

export function AppHeader() {
  const toggleMobileSidebar = useSidebarStore((s) => s.toggleMobileSidebar);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
      {/* Menú de navegación: solo en pantallas donde el menú lateral está oculto */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileSidebar}
        className="lg:hidden shrink-0 text-slate-600"
        aria-label="Abrir menú"
      >
        <MenuIcon className="w-5 h-5" />
      </Button>

      <a
        href={FACTURACION_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir el sistema de facturación electrónica en una pestaña nueva"
        className="ml-auto inline-flex items-center gap-2.5 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-500 transition-colors"
      >
        <img src="/brand/logo-sussi.svg" alt="" className="h-5 w-[72px]" />
        Facturación electrónica
        <ExternalLinkIcon className="size-3.5 text-slate-400" aria-hidden />
      </a>
    </header>
  );
}
