import { LayoutGridIcon } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { ModuleHeader } from "./ModuleHeader";

interface PlaceholderPageProps {
  title: string;
  section: string;
  description?: string;
}

export function PlaceholderPage({ title, section, description }: PlaceholderPageProps) {
  return (
    <>
      <Breadcrumbs items={[{ label: section }, { label: title }]} />

      <ModuleHeader
        title={title}
        description={description ?? "Módulo en construcción."}
      />

      <div className="flex-1 min-h-[360px] bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center p-8 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <LayoutGridIcon className="w-7 h-7" />
        </div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Módulo en desarrollo
        </h2>
        <p className="text-xs text-slate-400 max-w-md">
          Este espacio está preparado para la gestión de {title.toLowerCase()}.
        </p>
      </div>
    </>
  );
}
