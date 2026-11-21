import { useState } from "react";
import { PencilIcon, PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { MapaChico } from "@/features/crm/components/MapaChico";
import { crearSede, editarSede, listarSedes, type Sede, type SedeCuerpo } from "@/features/sedes/api";

/** Centro de Lima: punto de partida cuando la sede no tiene ubicación todavía. */
const LIMA = { latitud: -12.0464, longitud: -77.0428 };

/**
 * Sedes de Dulce Recuerdo. Las activas se dibujan con el logo sobre todos los mapas;
 * las que no están activas se guardan, pero no se muestran.
 */
export function SedesPanel() {
  const recurso = useRecurso(listarSedes);
  const [editando, setEditando] = useState<Sede | "nueva" | null>(null);
  const sedes = recurso.data ?? [];

  const alternarActiva = async (sede: Sede) => {
    const ok = await ejecutar(
      () => editarSede(sede.id, { activa: !sede.activa }),
      sede.activa ? "Sede oculta en los mapas." : "Sede visible en los mapas.",
      "No se pudo cambiar la sede."
    );
    if (ok) recurso.recargar();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Sedes</h2>
          <p className="text-sm text-slate-500">
            Puntos del negocio con el logo, que se ven sobre todos los mapas cuando están activas.
          </p>
        </div>
        <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
          <PlusCircleIcon className="size-4" />
          Nueva sede
        </Button>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-120">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Sede</th>
              <th className="px-5 py-3 font-semibold">Coordenadas</th>
              <th className="px-5 py-3 font-semibold">En el mapa</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {sedes.map((sede) => (
              <tr key={sede.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{sede.nombre}</p>
                  <p className="text-xs text-slate-500">{[sede.direccion, sede.distrito].filter(Boolean).join(" · ") || "Sin dirección"}</p>
                </td>
                <td className="px-5 py-3 text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {sede.latitud.toFixed(5)}, {sede.longitud.toFixed(5)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-label font-semibold",
                        sede.activa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {sede.activa ? "Visible" : "Oculta"}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => alternarActiva(sede)}>
                      {sede.activa ? "Ocultar" : "Mostrar"}
                    </Button>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(sede)}>
                    <PencilIcon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!recurso.cargando && sedes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Todavía no hay sedes. Crea la primera con «Nueva sede».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-lg">
        {editando && (
          <SedeForm
            sede={editando === "nueva" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              recurso.recargar();
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function SedeForm({ sede, onCerrar, onHecho }: { sede: Sede | null; onCerrar: () => void; onHecho: () => void }) {
  const [nombre, setNombre] = useState(sede?.nombre ?? "");
  const [direccion, setDireccion] = useState(sede?.direccion ?? "");
  const [distrito, setDistrito] = useState(sede?.distrito ?? "");
  const [punto, setPunto] = useState({ latitud: sede?.latitud ?? LIMA.latitud, longitud: sede?.longitud ?? LIMA.longitud });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    const cuerpo: SedeCuerpo = {
      nombre: nombre.trim(),
      direccion: direccion.trim() || null,
      distrito: distrito.trim() || null,
      latitud: punto.latitud,
      longitud: punto.longitud,
    };
    setError(null);
    setGuardando(true);
    const ok = await ejecutar(
      () => (sede ? editarSede(sede.id, cuerpo) : crearSede({ ...cuerpo, activa: true })),
      "Sede guardada.",
      "No se pudo guardar la sede."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{sede ? "Editar sede" : "Nueva sede"}</DialogTitle>
        <DialogDescription>Arrastra el punto o haz clic en el mapa para ubicar la sede.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sede-nombre">Nombre</Label>
          <Input id="sede-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Sede Surco" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sede-direccion">Dirección</Label>
          <Input id="sede-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sede-distrito">Distrito</Label>
          <Input id="sede-distrito" value={distrito} onChange={(e) => setDistrito(e.target.value)} />
        </div>
      </div>

      <MapaChico
        latitud={punto.latitud}
        longitud={punto.longitud}
        onMover={(p) => setPunto(p)}
        className="h-56"
      />
      <p className="text-xs text-slate-500">
        {punto.latitud.toFixed(5)}, {punto.longitud.toFixed(5)}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}
