import { useState } from "react";
import { PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
import type { Cliente } from "@/features/casos/types";

interface ClienteCuerpo {
  nombre_completo: string;
  telefono: string;
  dni: string | null;
  email: string | null;
  direccion: string | null;
}

async function listar(q: string): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>("/clientes", { params: q ? { q } : {} });
  return data;
}

/** Ficha de tutores (spec ficha-cliente-mascota). Se busca por DNI, nombre o mascota. */
export default function ClientesPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const recurso = useRecurso(() => listar(q), [q]);
  const [editando, setEditando] = useState<Cliente | "nuevo" | null>(null);
  const [borrando, setBorrando] = useState<Cliente | null>(null);

  const borrar = async () => {
    if (!borrando) return;
    const ok = await ejecutar(() => api.delete(`/clientes/${borrando.id}`), "Cliente eliminado.", "No se pudo eliminar el cliente.");
    setBorrando(null);
    if (ok) recurso.recargar();
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Fichas" }, { label: "Clientes" }]} />
      <ModuleHeader
        title="Clientes"
        description="Tutores registrados. La ficha se reutiliza en cada caso."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nuevo")}>
            <PlusCircleIcon className="size-4" />
            Nuevo cliente
          </Button>
        }
      />

      <form
        className="relative max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(texto.trim());
        }}
      >
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input className="pl-9" placeholder="DNI, nombre, teléfono o mascota (Enter)" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[640px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Nombre</th>
              <th className="px-5 py-3 font-semibold">DNI</th>
              <th className="px-5 py-3 font-semibold">Contacto</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(recurso.data ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{c.nombre_completo}</td>
                <td className="px-5 py-3">{c.dni ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {c.telefono}
                  {c.email ? ` · ${c.email}` : ""}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setEditando(c)}>
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Eliminar" className="text-slate-400 hover:text-red-600" onClick={() => setBorrando(c)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {recurso.error && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-red-600">{recurso.error}</td>
              </tr>
            )}
            {!recurso.cargando && !recurso.error && recurso.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
        {editando && (
          <ClienteForm
            cliente={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={recurso.recargar}
          />
        )}
      </Modal>

      <Modal open={borrando !== null} onOpenChange={(o) => !o && setBorrando(null)}>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            {borrando?.nombre_completo}. Un cliente con casos no se puede eliminar.
          </DialogDescription>
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

function ClienteForm({ cliente, onCerrar, onHecho }: { cliente: Cliente | null; onCerrar: () => void; onHecho: () => void }) {
  const [form, setForm] = useState({
    nombre_completo: cliente?.nombre_completo ?? "",
    telefono: cliente?.telefono ?? "",
    dni: cliente?.dni ?? "",
    email: cliente?.email ?? "",
    direccion: cliente?.direccion ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const campo = (k: keyof typeof form, label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`cl-${k}`}>{label}</Label>
      <Input id={`cl-${k}`} type={tipo} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
    </div>
  );

  const guardar = async () => {
    if (!form.nombre_completo.trim() || !form.telefono.trim()) return setError("Nombre y teléfono son obligatorios.");
    const cuerpo: ClienteCuerpo = {
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono.trim(),
      dni: form.dni.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
    };
    setGuardando(true);
    const ok = await ejecutar(
      () => (cliente ? api.patch(`/clientes/${cliente.id}`, cuerpo) : api.post("/clientes", cuerpo)),
      cliente ? "Cliente actualizado." : "Cliente registrado.",
      "No se pudo guardar el cliente."
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
        <DialogTitle>{cliente ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>El DNI no se puede repetir.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("nombre_completo", "Nombre completo")}
        {campo("telefono", "Teléfono")}
        {campo("dni", "DNI")}
        {campo("email", "Correo", "email")}
        <div className="sm:col-span-2">{campo("direccion", "Dirección")}</div>
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
