import { useState } from "react";
import { PencilIcon, PlusCircleIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { usePreferenciasStore } from "@/shared/store/preferencias.store";
import { Modal } from "@/features/casos/components/Dialogos";
import { listarMarcas, type Marca } from "../api";
import { MarcaForm } from "../components/MarcaForm";
import { CargaHistorica } from "../components/CargaHistorica";
import { SedesPanel } from "../components/SedesPanel";
import { SeriesPanel } from "../components/SeriesPanel";

/** Configuración del sistema. Hoy: sub-marcas (spec tarifas, R13). */
export default function ConfiguracionPage() {
  const recurso = useRecurso(listarMarcas);
  const [editando, setEditando] = useState<Marca | "nueva" | null>(null);
  const marcas = recurso.data ?? [];

  return (
    <>
      <Breadcrumbs items={[{ label: "Sistema" }, { label: "Configuración" }]} />
      <ModuleHeader title="Configuración" description="Ajustes generales del sistema." />

      <PreferenciasVista />

      <section className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sub-marcas</h2>
            <p className="text-sm text-slate-500">
              Marcas con planes propios para sus veterinarias. Sus planes y precios se cargan en Planes.
            </p>
          </div>
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
            <PlusCircleIcon className="size-4" />
            Nueva marca
          </Button>
        </div>

        {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm min-w-120">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Marca</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {marcas.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{m.nombre}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-label font-semibold",
                        m.activa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {m.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(m)}>
                      <PencilIcon className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!recurso.cargando && marcas.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    Todavía no hay sub-marcas. Crea la primera con «Nueva marca».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <SedesPanel />
      </section>

      <section className="mt-6">
        <SeriesPanel />
      </section>

      <section className="mt-6">
        <CargaHistorica />
      </section>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-md">
        {editando && (
          <MarcaForm
            marca={editando === "nueva" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              recurso.recargar();
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

/** Preferencias de vista: se guardan en este navegador, no en el servidor. */
function PreferenciasVista() {
  const mostrar = usePreferenciasStore((s) => s.mostrarDescripciones);
  const setMostrar = usePreferenciasStore((s) => s.setMostrarDescripciones);
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Vista</h2>
        <p className="text-sm text-slate-500">Se guarda en este navegador.</p>
      </div>
      <label
        htmlFor="pref-descripciones"
        className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs px-5 py-4 cursor-pointer"
      >
        <Checkbox
          id="pref-descripciones"
          checked={mostrar}
          onCheckedChange={(v) => setMostrar(v === true)}
          className="mt-0.5"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-slate-900 dark:text-white">Mostrar descripción de los módulos</span>
          <span className="text-xs text-slate-500">El texto bajo el título de cada sección. Desmárcalo para ocultarlo.</span>
        </span>
      </label>
    </section>
  );
}
