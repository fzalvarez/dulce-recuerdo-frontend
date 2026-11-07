import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  BriefcaseIcon,
  FileTextIcon,
  CalendarIcon,
  StethoscopeIcon,
  TruckIcon,
  CarIcon,
  Building2Icon,
  PawPrintIcon,
  ClipboardListIcon,
  LayersIcon,
  PackageIcon,
  UsersIcon,
  SettingsIcon,
  WalletIcon,
  WrenchIcon,
  ChartColumnIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useSidebarStore } from "@/shared/store/sidebar.store";

// Eutanasia y cremación: pipeline por Caso (evento único, no cliente recurrente).
const DESPEDIDAS_ITEMS = [
  { label: "Casos & Servicios", icon: BriefcaseIcon, to: "/casos" },
  { label: "Cotizaciones", icon: FileTextIcon, to: "/cotizaciones" },
  { label: "Agenda & Rutas", icon: CalendarIcon, to: "/agenda" },
  { label: "Convenios Veterinarios", icon: StethoscopeIcon, to: "/veterinarias" },
  { label: "Entregas", icon: TruckIcon, to: "/entregas" },
];

// Atención veterinaria (consulta general y a domicilio): servicio recurrente,
// aquí sí aplica un catálogo real de Clientes/Mascotas con historial.
const ATENCION_VETERINARIA_ITEMS = [
  { label: "Clientes", icon: Building2Icon, to: "/clientes" },
  { label: "Mascotas", icon: PawPrintIcon, to: "/mascotas" },
];

// Reportes de revisión de la empresa (cada 3 o 6 meses).
const REPORTES_ITEMS = [
  { label: "Reportes", icon: ChartColumnIcon, to: "/reportes" },
];

// Finanzas: ingresos (desde servicios realizados) y gastos fijos mensuales.
const FINANZAS_ITEMS = [
  { label: "Ingresos y Gastos", icon: WalletIcon, to: "/finanzas" },
];

const CATALOGO_ITEMS = [
  { label: "Servicios", icon: ClipboardListIcon, to: "/servicios" },
  { label: "Planes", icon: LayersIcon, to: "/planes" },
  { label: "Inventario", icon: PackageIcon, to: "/inventario" },
  { label: "Activos", icon: WrenchIcon, to: "/activos" },
  { label: "Vehículo", icon: CarIcon, to: "/vehiculos" },
  { label: "Usuarios", icon: UsersIcon, to: "/usuarios" },
];

function NavItem({
  label,
  icon: Icon,
  to,
  end,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  end?: boolean;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
          isActive
            ? "text-brand-500 bg-brand-50 border border-blue-100/80 font-semibold shadow-xs"
            : "text-slate-600 hover:text-brand-500 hover:bg-brand-50"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "w-5 h-5 shrink-0 group-hover:text-brand-500",
              isActive ? "text-brand-500" : "text-slate-400"
            )}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppSidebar() {
  const getUserName = useAuthStore((s) => s.getUserName);
  const getUserEmail = useAuthStore((s) => s.getUserEmail);
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const closeMobileSidebar = useSidebarStore((s) => s.closeMobileSidebar);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col z-50 select-none transition-transform duration-200 ease-in-out",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand & Isotipo Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3 shrink-0">
        <div className="w-10 h-10 shrink-0 flex items-center justify-center p-0.5 rounded-lg bg-slate-50 border border-slate-200">
          <img
            alt="Isotipo Dulce Recuerdo"
            className="w-full h-full object-contain"
            src="/brand/isotipo.webp"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-base tracking-tight text-slate-900 leading-tight truncate">
            Dulce Recuerdo
          </span>
          <span className="text-label font-medium tracking-wider uppercase text-brand-500">
            Panel de Control
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <NavItem
          label="Dashboard"
          icon={LayoutDashboardIcon}
          to="/"
          end
          onClick={closeMobileSidebar}
        />

        <div className="pt-4 pb-1">
          <p className="px-3 text-label font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Despedidas
          </p>
        </div>
        {DESPEDIDAS_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeMobileSidebar} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-label font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Atención Veterinaria
          </p>
        </div>
        {ATENCION_VETERINARIA_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeMobileSidebar} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-label font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Finanzas
          </p>
        </div>
        {FINANZAS_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeMobileSidebar} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-label font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Reportes
          </p>
        </div>
        {REPORTES_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeMobileSidebar} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-label font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Catálogos & Administración
          </p>
        </div>
        {CATALOGO_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} onClick={closeMobileSidebar} />
        ))}

        <div className="pt-2">
          <NavItem
            label="Configuración"
            icon={SettingsIcon}
            to="/configuracion"
            onClick={closeMobileSidebar}
          />
        </div>
      </nav>

      {/* Footer: System status & operator card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <span className="text-slate-500 font-medium">Servidor Base</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
            <span className="text-label font-semibold text-emerald-700">
              En Línea
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200">
          <div className="w-8 h-8 rounded bg-slate-200 shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold uppercase">
            {getUserName().charAt(0).toUpperCase() || "OP"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-800 truncate">
              {getUserName() || "Operador Activo"}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {getUserEmail() || "admin@dulcerecuerdo.pe"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
