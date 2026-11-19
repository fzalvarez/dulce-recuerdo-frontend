import { useState } from "react";
import { EyeIcon, HandshakeIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { fechaCorta } from "@/features/casos/utils/casos";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  actualizarPasos,
  convertirAliada,
  listar,
  listarVisitas,
  quitarVisita,
  type CrmVeterinaria,
} from "../api";
import { AgregarVisita } from "../components/AgregarVisita";
import { CrmVeterinariaForm } from "../components/CrmVeterinariaForm";
import { formatoTelefono } from "../utils/formato";

type Filtro = "TODAS" | "SIN_INTERES" | "INTERESADAS" | "ALIADAS";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "TODAS", label: "Todas" },
  { value: "SIN_INTERES", label: "Sin interés" },
  { value: "INTERESADAS", label: "Interesadas" },
  { value: "ALIADAS", label: "Aliadas" },
];

const coincideFiltro = (v: CrmVeterinaria, filtro: Filtro) => {
  if (filtro === "TODAS") return true;
  if (filtro === "ALIADAS") return v.veterinaria_id !== null;
  if (v.veterinaria_id !== null) return false;
  return filtro === "INTERESADAS" ? v.interesada_at !== null : v.interesada_at === null;
};

/** CRM › Control comercial: visitas, pasos confirmados y conversión en veterinaria aliada (spec crm-control-comercial). */
export default function CrmControlComercialPage() {
  const visitas = useRecurso(listarVisitas);
  // Fichas que aún no se visitaron: para «Agregar visita».
  const fichas = useRecurso(() => listar(""));
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [agregando, setAgregando] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState<CrmVeterinaria | null>(null);
  const [quitando, setQuitando] = useState<CrmVeterinaria | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [viendo, setViendo] = useState<CrmVeterinaria | null>(null);
  // Solo root y admin convierten en aliada (spec crm-control-comercial, R9).
  const esAdmin = useAuthStore((s) => ["root", "admin"].includes(s.getUserRol()));

  const todas = visitas.data ?? [];
  const visibles = todas.filter((v) => coincideFiltro(v, filtro));
  const candidatas = (fichas.data ?? []).filter((f) => f.visitada_at === null && !f.ya_no_existe);

  const recargar = () => {
    visitas.recargar();
    fichas.recargar();
  };

  const marcar = async (v: CrmVeterinaria, pasos: { info_entregada?: boolean; interesada?: boolean }) => {
    await ejecutar(() => actualizarPasos(v.id, pasos), "Paso actualizado.", "No se pudo actualizar el paso.");
    visitas.recargar();
  };

  const convertir = async () => {
    if (!convirtiendo) return;
    setTrabajando(true);
    const ok = await ejecutar(
      () => convertirAliada(convirtiendo.id),
      `${convirtiendo.nombre} es ahora veterinaria aliada. Asígnale su convenio en Convenios Veterinarios.`,
      "No se pudo convertir en aliada."
    );
    setTrabajando(false);
    setConvirtiendo(null);
    if (ok) recargar();
  };

  const quitar = async () => {
    if (!quitando) return;
    setTrabajando(true);
    const ok = await ejecutar(() => quitarVisita(quitando.id), "Quitada de visitas.", "No se pudo quitar la visita.");
    setTrabajando(false);
    setQuitando(null);
    if (ok) recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "CRM" }, { label: "Control comercial" }]} />
      <ModuleHeader
        title="Control comercial"
        description="Veterinarias visitadas. Confirma que entregaste la información y si quieren trabajar con nosotros; luego conviértela en aliada."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setAgregando(true)}>
            <PlusCircleIcon className="size-4" />
            Agregar visita
          </Button>
        }
      />

      <BotonesOpcion<Filtro> ariaLabel="Filtrar por estado" value={filtro} onChange={setFiltro} opciones={FILTROS} columnas="grid-cols-2 sm:grid-cols-4" />

      {visitas.error && <p className="text-sm text-red-600">{visitas.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Veterinaria</th>
              <th className="px-5 py-3 font-semibold">Visitada</th>
              <th className="px-5 py-3 font-semibold text-center">Info entregada</th>
              <th className="px-5 py-3 font-semibold text-center">Interesada</th>
              <th className="px-5 py-3 font-semibold text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {visibles.map((v) => {
              const aliada = v.veterinaria_id !== null;
              return (
                <tr key={v.id}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    <span className="font-mono text-xs text-slate-500 mr-1.5">{v.codigo}</span>
                    {v.nombre}
                    {v.ya_no_existe && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">Ya no existe</span>}
                    <span className="block text-xs text-slate-500">
                      {[v.distrito, formatoTelefono(v.telefono)].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">{fechaCorta(v.visitada_at)}</td>
                  <td className="px-5 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Información entregada: ${v.nombre}`}
                      className="size-4 accent-brand-500"
                      checked={v.info_entregada_at !== null}
                      disabled={aliada}
                      onChange={(e) => marcar(v, { info_entregada: e.target.checked })}
                    />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Interesada: ${v.nombre}`}
                      className="size-4 accent-brand-500"
                      checked={v.interesada_at !== null}
                      disabled={aliada || v.info_entregada_at === null}
                      title={v.info_entregada_at === null ? "Primero marca que entregaste la información" : undefined}
                      onChange={(e) => marcar(v, { interesada: e.target.checked })}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end items-center gap-1.5">
                      {aliada ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-label font-semibold bg-emerald-50 text-emerald-700">Aliada</span>
                      ) : (
                        <>
                          {esAdmin && (
                            <Button
                              variant="operational"
                              size="sm"
                              className="gap-1.5"
                              disabled={v.interesada_at === null}
                              title={v.interesada_at === null ? "Convierte cuando confirme que quiere trabajar con nosotros" : undefined}
                              onClick={() => setConvirtiendo(v)}
                            >
                              <HandshakeIcon className="size-4" />
                              Convertir en aliada
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" title="Quitar de visitas" onClick={() => setQuitando(v)}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setViendo(v)}>
                        <EyeIcon className="size-4" />
                        Ver ficha
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!visitas.cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  {todas.length === 0 ? "Todavía no hay visitas. Agrega la primera con «Agregar visita»." : "Sin veterinarias con este estado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={agregando} onOpenChange={(o) => !o && setAgregando(false)} ancho="sm:max-w-lg">
        {agregando && (
          <AgregarVisita
            candidatas={candidatas}
            onCerrar={() => setAgregando(false)}
            onHecho={() => {
              recargar();
            }}
          />
        )}
      </Modal>

      {/* Ficha completa: de solo lectura si ya es aliada (se edita con «Editar»). */}
      <Modal open={viendo !== null} onOpenChange={(o) => !o && setViendo(null)} ancho="sm:max-w-5xl">
        {viendo && <CrmVeterinariaForm veterinaria={viendo} onCerrar={() => setViendo(null)} onHecho={recargar} />}
      </Modal>

      <Modal open={convirtiendo !== null} onOpenChange={(o) => !o && setConvirtiendo(null)}>
        <DialogHeader>
          <DialogTitle>Convertir en veterinaria aliada</DialogTitle>
          <DialogDescription>
            Se crea «{convirtiendo?.nombre}» como aliada, sin convenio. Su porcentaje se asigna después, en Convenios Veterinarios.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setConvirtiendo(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button variant="operational" onClick={convertir} disabled={trabajando}>
            {trabajando ? "Convirtiendo…" : "Convertir"}
          </Button>
        </DialogFooter>
      </Modal>

      <Modal open={quitando !== null} onOpenChange={(o) => !o && setQuitando(null)}>
        <DialogHeader>
          <DialogTitle>Quitar de visitas</DialogTitle>
          <DialogDescription>
            {quitando?.nombre}. Se borran sus pasos; la ficha del CRM sigue existiendo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setQuitando(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={quitar} disabled={trabajando}>
            Quitar
          </Button>
        </DialogFooter>
      </Modal>
    </>
  );
}
