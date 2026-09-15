import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";

export default function DashboardPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <ModuleHeader
        title="Dashboard"
        description="Resumen general de la operación de Dulce Recuerdo."
      />

      <div className="flex-1 min-h-[360px] bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center p-8 text-center gap-2">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Indicadores en construcción
        </h2>
        <p className="text-xs text-slate-400 max-w-md">
          Aquí se mostrarán los KPIs operativos: casos activos, agenda del día
          y entregas pendientes.
        </p>
      </div>
    </>
  );
}
