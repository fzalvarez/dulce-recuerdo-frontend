import { useState } from "react";
import { PackageCheckIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import api from "@/shared/lib/axios";
import { Modal } from "@/features/casos/components/Dialogos";
import type { CasoFila } from "@/features/casos/types";
import { combinarFechaHora, fechaHora, hoyISO, soles } from "@/features/casos/utils/casos";

async function pendientes(): Promise<CasoFila[]> {
  const { data } = await api.get<CasoFila[]>("/entregas/pendientes");
  return data;
}

async function entregar(casoId: string, fecha: string): Promise<void> {
  await api.post(`/entregas/${casoId}`, { fecha });
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
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Mascota y tutor</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
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
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">Cargando entregas…</td>
                </tr>
              )}
              {recurso.error && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-red-600">{recurso.error}</td>
                </tr>
              )}
              {!recurso.cargando && !recurso.error && filas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No hay entregas pendientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={elegido !== null} onOpenChange={(o) => !o && setElegido(null)}>
        {elegido && <EntregaForm caso={elegido} onCerrar={() => setElegido(null)} onHecho={recurso.recargar} />}
      </Modal>
    </>
  );
}

function EntregaForm({ caso, onCerrar, onHecho }: { caso: CasoFila; onCerrar: () => void; onHecho: () => void }) {
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    const ok = await ejecutar(
      () => entregar(caso.id, combinarFechaHora(fecha, hora)),
      `Entrega de ${caso.mascota} registrada.`,
      "No se pudo registrar la entrega."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Entregar · {caso.mascota}</DialogTitle>
        <DialogDescription>
          {caso.tutor}
          {Number(caso.saldo) > 0 ? ` · Queda un saldo de ${soles(caso.saldo)}` : ""}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="en-fecha">Fecha</Label>
          <DatePicker id="en-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="en-hora">Hora</Label>
          <Input id="en-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Confirmar entrega"}
        </Button>
      </DialogFooter>
    </>
  );
}
