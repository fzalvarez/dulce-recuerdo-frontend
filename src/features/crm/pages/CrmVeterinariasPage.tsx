import { useState } from "react";
import { ExternalLinkIcon, PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cn } from "@/lib/utils";
import { Modal } from "@/features/casos/components/Dialogos";
import { eliminar, listar, type CrmVeterinaria, type Prioridad } from "../api";
import { CrmVeterinariaForm } from "../components/CrmVeterinariaForm";

const TODAS = "TODAS";
const SIN_RUTA = "SIN_RUTA";

const PRIORIDAD: Record<Prioridad, { label: string; clase: string }> = {
  ALTA: { label: "Alta", clase: "bg-red-100 text-red-700" },
  MEDIA: { label: "Media", clase: "bg-amber-100 text-amber-700" },
  BAJA: { label: "Baja", clase: "bg-slate-100 text-slate-600" },
};

const enlaceWeb = (web: string) => (/^https?:\/\//i.test(web) ? web : `https://${web}`);

/** CRM › Veterinarias: la lista que el comercial visita, ordenada por ruta (spec crm-veterinarias). */
export default function CrmVeterinariasPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [ruta, setRuta] = useState<string>(TODAS);
  const recurso = useRecurso(() => listar(q), [q]);
  const [editando, setEditando] = useState<CrmVeterinaria | "nuevo" | null>(null);
  const [borrando, setBorrando] = useState<CrmVeterinaria | null>(null);

  const todas = recurso.data ?? [];
  const rutas = [...new Set(todas.map((v) => v.ruta).filter((r): r is string => !!r))];
  const hayVaciaRuta = todas.some((v) => !v.ruta);
  const filas = todas.filter((v) => ruta === TODAS || (ruta === SIN_RUTA ? !v.ruta : v.ruta === ruta));

  const borrar = async () => {
    if (!borrando) return;
    const ok = await ejecutar(() => eliminar(borrando.id), "Veterinaria eliminada.", "No se pudo eliminar la veterinaria.");
    setBorrando(null);
    if (ok) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "CRM" }, { label: "Veterinarias" }]} />
      <ModuleHeader
        title="Veterinarias a visitar"
        description="Ordenadas por ruta y distrito. Solo el nombre es obligatorio."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nuevo")}>
            <PlusCircleIcon className="size-4" />
            Nueva veterinaria
          </Button>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          className="relative w-full md:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(texto.trim());
          }}
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input className="pl-9" placeholder="Nombre, teléfono, dirección o distrito (Enter)" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </form>
        {rutas.length > 0 && (
          <BotonesOpcion<string>
            ariaLabel="Ruta"
            value={ruta}
            onChange={setRuta}
            opciones={[
              { value: TODAS, label: `Todas (${todas.length})` },
              ...rutas.map((r) => ({ value: r, label: r })),
              ...(hayVaciaRuta ? [{ value: SIN_RUTA, label: "Sin ruta" }] : []),
            ]}
          />
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[900px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Ruta</th>
              <th className="px-4 py-3 font-semibold">Veterinaria</th>
              <th className="px-4 py-3 font-semibold">Distrito / Dirección</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Horario</th>
              <th className="px-4 py-3 font-semibold">24H</th>
              <th className="px-4 py-3 font-semibold">Prioridad</th>
              <th className="px-4 py-3 font-semibold">Estado del dato</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filas.map((v) => (
              <tr key={v.id} className="align-top">
                <td className="px-4 py-3 font-semibold text-brand-600">{v.ruta ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                    {v.nombre}
                    {v.web && (
                      <a href={enlaceWeb(v.web)} target="_blank" rel="noreferrer" title={v.web} className="text-slate-400 hover:text-brand-500">
                        <ExternalLinkIcon className="size-3.5" />
                      </a>
                    )}
                  </div>
                  {v.perfil && <div className="text-xs text-slate-500 line-clamp-2">{v.perfil}</div>}
                  {v.fuente && <div className="text-[11px] text-slate-400">Fuente: {v.fuente}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{v.distrito ?? "—"}</div>
                  {v.direccion && <div className="text-xs text-slate-500">{v.direccion}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {v.telefono ? (
                    <a href={`tel:${v.telefono}`} className="hover:text-brand-500">
                      {v.telefono}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{v.horario ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{v.urgencias_24h == null ? "—" : v.urgencias_24h ? "Sí" : "No"}</td>
                <td className="px-4 py-3">
                  {v.prioridad ? (
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORIDAD[v.prioridad].clase)}>
                      {PRIORIDAD[v.prioridad].label}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[220px]">
                  <span className="line-clamp-3">{v.estado_dato ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setEditando(v)}>
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Eliminar" className="text-slate-400 hover:text-red-600" onClick={() => setBorrando(v)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {recurso.error && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-red-600">{recurso.error}</td>
              </tr>
            )}
            {!recurso.cargando && !recurso.error && filas.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-slate-400">Sin veterinarias.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-2xl">
        {editando && (
          <CrmVeterinariaForm
            veterinaria={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={recurso.recargar}
          />
        )}
      </Modal>

      <Modal open={borrando !== null} onOpenChange={(o) => !o && setBorrando(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar veterinaria</DialogTitle>
          <DialogDescription>{borrando?.nombre}. Se quita de la lista del CRM.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setBorrando(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={borrar}>
            Eliminar
          </Button>
        </DialogFooter>
      </Modal>
    </>
  );
}
