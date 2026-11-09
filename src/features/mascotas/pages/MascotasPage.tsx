import { useMemo, useState } from "react";
import { PencilIcon, SearchIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import api from "@/shared/lib/axios";
import { Modal } from "@/features/casos/components/Dialogos";
import type { Cliente, Mascota } from "@/features/casos/types";

async function cargar(q: string): Promise<{ mascotas: Mascota[]; clientes: Cliente[] }> {
  const [m, c] = await Promise.all([
    api.get<Mascota[]>("/mascotas", { params: q ? { q } : {} }),
    api.get<Cliente[]>("/clientes"),
  ]);
  return { mascotas: m.data, clientes: c.data };
}

/** Mascotas registradas. Se crean junto al caso o desde la ficha del cliente. */
export default function MascotasPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const recurso = useRecurso(() => cargar(q), [q]);
  const [editando, setEditando] = useState<Mascota | null>(null);
  const tutores = useMemo(
    () => new Map((recurso.data?.clientes ?? []).map((c) => [c.id, c.nombre_completo])),
    [recurso.data]
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Fichas" }, { label: "Mascotas" }]} />
      <ModuleHeader title="Mascotas" description="Datos de cada mascota. Se registran al crear un caso." />

      <form
        className="relative max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(texto.trim());
        }}
      >
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input className="pl-9" placeholder="Nombre de la mascota (Enter)" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Mascota</th>
              <th className="px-5 py-3 font-semibold">Tutor</th>
              <th className="px-5 py-3 font-semibold">Datos</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(recurso.data?.mascotas ?? []).map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {m.nombre} <span className="text-xs text-slate-500">· {m.especie}</span>
                </td>
                <td className="px-5 py-3">{tutores.get(m.cliente_id) ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {[m.raza, m.sexo, m.color, m.peso_kg ? `${m.peso_kg} kg` : null].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setEditando(m)}>
                    <PencilIcon className="size-3.5" />
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {recurso.error && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-red-600">{recurso.error}</td>
              </tr>
            )}
            {!recurso.cargando && !recurso.error && recurso.data?.mascotas.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
        {editando && <MascotaForm mascota={editando} onCerrar={() => setEditando(null)} onHecho={recurso.recargar} />}
      </Modal>
    </>
  );
}

function MascotaForm({ mascota, onCerrar, onHecho }: { mascota: Mascota; onCerrar: () => void; onHecho: () => void }) {
  const [form, setForm] = useState({
    nombre: mascota.nombre,
    especie: mascota.especie,
    raza: mascota.raza ?? "",
    sexo: mascota.sexo ?? "",
    color: mascota.color ?? "",
    peso_kg: mascota.peso_kg != null ? String(mascota.peso_kg) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const campo = (k: keyof typeof form, label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`ma-${k}`}>{label}</Label>
      <Input id={`ma-${k}`} type={tipo} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
    </div>
  );

  const guardar = async () => {
    if (!form.nombre.trim() || !form.especie.trim()) return setError("Nombre y especie son obligatorios.");
    const peso = form.peso_kg.trim() ? Number(form.peso_kg) : null;
    if (peso !== null && (!Number.isFinite(peso) || peso <= 0)) return setError("El peso debe ser mayor a 0.");
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        api.patch(`/mascotas/${mascota.id}`, {
          nombre: form.nombre.trim(),
          especie: form.especie.trim(),
          raza: form.raza.trim() || null,
          sexo: form.sexo.trim() || null,
          color: form.color.trim() || null,
          peso_kg: peso,
        }),
      "Mascota actualizada.",
      "No se pudo guardar la mascota."
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
        <DialogTitle>Editar mascota</DialogTitle>
        <DialogDescription>El peso de cada servicio se guarda en el caso.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("nombre", "Nombre")}
        {campo("especie", "Especie")}
        {campo("raza", "Raza")}
        {campo("sexo", "Sexo")}
        {campo("color", "Color")}
        {campo("peso_kg", "Peso (kg)", "number")}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
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
