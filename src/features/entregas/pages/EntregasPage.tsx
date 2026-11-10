import { useState } from "react";
import { PackageCheckIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { useRecurso } from "@/shared/hooks/useRecurso";
import api from "@/shared/lib/axios";
import { EntregaDialog } from "@/features/casos/components/Dialogos";
import type { CasoFila } from "@/features/casos/types";
import { fechaHora, soles } from "@/features/casos/utils/casos";

async function pendientes(): Promise<CasoFila[]> {
  const { data } = await api.get<CasoFila[]>("/entregas/pendientes");
  return data;
}

/** Urnas y recuerdos por entregar: casos realizados sin entrega (spec caso-flujo §2.3). */
export default function EntregasPage() {
  const recurso = useRecurso(pendientes);
  const [elegido, setElegido] = useState<CasoFila | null>(null);
  const filas = recurso.data ?? [];

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Entregas" }]} />
      <ModuleHeader
        title="Entregas"
        description="Servicios realizados cuya urna o recuerdos todavía no se entregan."
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Mascota y tutor</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Urna</th>
                <th className="px-5 py-3 font-semibold">Realizado</th>
                <th className="px-5 py-3 font-semibold">Saldo</th>
                <th className="px-5 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                  <td className="px-5 py-3">
                    <span className="block font-semibold text-slate-900 dark:text-white">{c.mascota}</span>
                    <span className="text-xs text-slate-500">
                      {c.tutor}
                      {c.plan_nombre ? ` · ${c.plan_nombre}` : ""}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {c.telefono ?? "—"}
                    {c.distrito_origen ? ` · ${c.distrito_origen}` : ""}
                    {c.veterinaria ? ` · vía ${c.veterinaria}` : ""}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {c.urna ?? (c.servicio === "CREMACION" ? <span className="font-semibold text-amber-700">Por elegir</span> : "—")}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{fechaHora(c.fecha_realizado)}</td>
                  <td className="px-5 py-3">
                    {Number(c.saldo) > 0 ? <span className="text-amber-700">{soles(c.saldo)}</span> : <span className="text-emerald-700">Pagado</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="operational" size="sm" onClick={() => setElegido(c)}>
                      <PackageCheckIcon className="size-4" />
                      Marcar entregado
                    </Button>
                  </td>
                </tr>
              ))}
              {recurso.cargando && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">Cargando entregas…</td>
                </tr>
              )}
              {recurso.error && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-red-600">{recurso.error}</td>
                </tr>
              )}
              {!recurso.cargando && !recurso.error && filas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">No hay entregas pendientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EntregaDialog caso={elegido} onOpenChange={(o) => !o && setElegido(null)} onHecho={recurso.recargar} />
    </>
  );
}
