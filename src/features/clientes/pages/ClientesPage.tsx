import { useState } from "react";
import { PencilIcon, PlusCircleIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import api from "@/shared/lib/axios";
import { Modal } from "@/features/casos/components/Dialogos";
import type { Cliente } from "@/features/casos/types";
import { Paginador, POR_PAGINA } from "@/shared/components/common/Paginador";
import type { Pagina } from "@/shared/types/pagina";

interface ClienteCuerpo {
  nombre_completo: string;
  telefono: string;
  dni: string | null;
  email: string | null;
  direccion: string | null;
  tipo_documento: "DNI" | "CE" | "PASAPORTE";
  ruc: string | null;
  notas: string | null;
}

const NOMBRE_DOC = { DNI: "DNI", CE: "Carné de extranjería", PASAPORTE: "Pasaporte" } as const;

/** Una página de clientes. La búsqueda y la paginación las hace el servidor. */
async function listar(q: string, pagina: number): Promise<Pagina<Cliente>> {
  const { data } = await api.get<Pagina<Cliente>>("/clientes/pagina", {
    params: { ...(q ? { q } : {}), limite: POR_PAGINA, offset: pagina * POR_PAGINA },
  });
  return data;
}

/** Ficha de tutores (spec ficha-cliente-mascota). Se busca por DNI, nombre o mascota. */
export default function ClientesPage() {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(0);
  const recurso = useRecurso(() => listar(q, pagina), [q, pagina]);
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
          setPagina(0);
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
              <th className="px-5 py-3 font-semibold">Documento</th>
              <th className="px-5 py-3 font-semibold">Contacto</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(recurso.data?.items ?? []).map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{c.nombre_completo}</td>
                <td className="px-5 py-3">
                  {c.dni ? (
                    <>
                      <span className="text-xs text-slate-500">{c.tipo_documento && c.tipo_documento !== "DNI" ? `${c.tipo_documento} ` : ""}</span>
                      {c.dni}
                    </>
                  ) : (
                    "—"
                  )}
                  {c.ruc && <span className="block text-xs text-slate-500">RUC {c.ruc}</span>}
                </td>
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
            {!recurso.cargando && !recurso.error && recurso.data?.total === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {recurso.data && (
        <Paginador
          total={recurso.data.total}
          pagina={pagina}
          onCambiar={setPagina}
          className="rounded-b-xl border border-t-0 border-slate-200/90 dark:border-white/10"
        />
      )}

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
    ruc: cliente?.ruc ?? "",
    notas: cliente?.notas ?? "",
  });
  const [tipoDoc, setTipoDoc] = useState<ClienteCuerpo["tipo_documento"]>(cliente?.tipo_documento ?? "DNI");
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
    if (tipoDoc === "DNI" && form.dni.trim() && !/^\d{8}$/.test(form.dni.trim())) return setError("El DNI tiene 8 dígitos.");
    if (form.ruc.trim() && !/^10\d{9}$/.test(form.ruc.trim())) return setError("El RUC de una persona tiene 11 dígitos y empieza con 10.");
    const cuerpo: ClienteCuerpo = {
      nombre_completo: form.nombre_completo.trim(),
      telefono: form.telefono.trim(),
      dni: form.dni.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      tipo_documento: tipoDoc,
      ruc: form.ruc.trim() || null,
      notas: form.notas.trim() || null,
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
        <DialogDescription>El documento no se puede repetir. Estos datos se usan al emitir su boleta o factura.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("nombre_completo", "Nombre completo")}
        {campo("telefono", "Teléfono")}
        <div className="space-y-1.5">
          <Label htmlFor="cl-tipodoc">Documento de identidad</Label>
          <div className="flex gap-2">
            <select
              id="cl-tipodoc"
              className="h-9 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-2 text-sm"
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value as ClienteCuerpo["tipo_documento"])}
            >
              {(Object.keys(NOMBRE_DOC) as ClienteCuerpo["tipo_documento"][]).map((t) => (
                <option key={t} value={t}>
                  {NOMBRE_DOC[t]}
                </option>
              ))}
            </select>
            <Input
              aria-label="Número de documento"
              inputMode={tipoDoc === "DNI" ? "numeric" : "text"}
              maxLength={tipoDoc === "DNI" ? 8 : 20}
              value={form.dni}
              onChange={(e) => setForm((f) => ({ ...f, dni: tipoDoc === "DNI" ? e.target.value.replace(/\D/g, "") : e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cl-ruc">RUC propio (opcional)</Label>
          <Input
            id="cl-ruc"
            inputMode="numeric"
            maxLength={11}
            placeholder="10…, si pide factura a su nombre"
            value={form.ruc}
            onChange={(e) => setForm((f) => ({ ...f, ruc: e.target.value.replace(/\D/g, "") }))}
          />
        </div>
        {campo("email", "Correo", "email")}
        {campo("direccion", "Dirección")}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cl-notas">Notas</Label>
          <Textarea id="cl-notas" rows={2} value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
        </div>
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
