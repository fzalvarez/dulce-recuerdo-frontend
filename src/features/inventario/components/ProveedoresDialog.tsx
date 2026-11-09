import { useState } from "react";
import { PencilIcon, PlusCircleIcon, StarIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import * as I from "../api";
import type { Articulo, Proveedor } from "../types";

/** Proveedores de un artículo. Solo uno es el principal: su plazo se usa en Abastecimiento. */
export function ProveedoresContenido({ articulo }: { articulo: Articulo }) {
  const lista = useRecurso(() => I.proveedores(articulo.id), [articulo.id]);
  const [editando, setEditando] = useState<Proveedor | "nuevo" | null>(null);

  if (editando) {
    return (
      <ProveedorForm
        articulo={articulo}
        proveedor={editando === "nuevo" ? null : editando}
        onCerrar={() => setEditando(null)}
        onHecho={() => {
          lista.recargar();
          setEditando(null);
        }}
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Proveedores · {articulo.nombre}</DialogTitle>
        <DialogDescription>El plazo de entrega del principal se usa para avisar a tiempo cuándo pedir.</DialogDescription>
      </DialogHeader>
      {lista.error && <p className="text-sm text-red-600">{lista.error}</p>}
      <ul className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
        {lista.data?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="font-medium inline-flex items-center gap-1">
                {p.principal && <StarIcon className="size-3.5 text-amber-500" aria-label="Principal" />}
                {p.empresa}
              </span>
              <span className="block text-xs text-slate-500">
                {[p.contacto, p.telefono, p.celular, p.correo].filter(Boolean).join(" · ")}
                {p.dias_entrega != null ? ` · entrega en ${p.dias_entrega} días` : ""}
              </span>
            </span>
            <span className="inline-flex gap-1">
              <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => setEditando(p)}>
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Eliminar"
                className="text-slate-400 hover:text-red-600"
                onClick={async () => (await ejecutar(() => I.eliminarProveedor(articulo.id, p.id), "Proveedor eliminado.", "No se pudo eliminar.")) && lista.recargar()}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </span>
          </li>
        ))}
        {lista.data?.length === 0 && <li className="py-2 text-slate-400">Sin proveedores.</li>}
      </ul>
      <DialogFooter>
        <Button variant="operational" onClick={() => setEditando("nuevo")}>
          <PlusCircleIcon className="size-4" />
          Agregar proveedor
        </Button>
      </DialogFooter>
    </>
  );
}

function ProveedorForm({ articulo, proveedor, onCerrar, onHecho }: { articulo: Articulo; proveedor: Proveedor | null; onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({
    empresa: proveedor?.empresa ?? "",
    contacto: proveedor?.contacto ?? "",
    telefono: proveedor?.telefono ?? "",
    celular: proveedor?.celular ?? "",
    correo: proveedor?.correo ?? "",
    direccion: proveedor?.direccion ?? "",
    dias_entrega: proveedor?.dias_entrega != null ? String(proveedor.dias_entrega) : "",
    notas: proveedor?.notas ?? "",
    principal: proveedor?.principal ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  type Texto = Exclude<keyof typeof f, "principal">;
  const campo = (k: Texto, label: string, tipo = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`pv-${k}`}>{label}</Label>
      <Input id={`pv-${k}`} type={tipo} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );

  const guardar = async () => {
    if (!f.empresa.trim() || !f.telefono.trim()) return setError("Empresa y teléfono son obligatorios.");
    const dias = f.dias_entrega.trim() === "" ? null : Number(f.dias_entrega);
    if (dias !== null && (!Number.isInteger(dias) || dias < 0)) return setError("Los días de entrega deben ser un entero.");
    const t = (s: string) => s.trim() || null;
    const cuerpo: I.ProveedorCuerpo = {
      empresa: f.empresa.trim(),
      contacto: t(f.contacto),
      telefono: f.telefono.trim(),
      celular: t(f.celular),
      correo: t(f.correo),
      direccion: t(f.direccion),
      dias_entrega: dias,
      notas: t(f.notas),
      principal: f.principal,
    };
    setGuardando(true);
    const ok = await ejecutar(
      () => (proveedor ? I.editarProveedor(articulo.id, proveedor.id, cuerpo) : I.crearProveedor(articulo.id, cuerpo)),
      "Proveedor guardado.",
      "No se pudo guardar."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{proveedor ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        <DialogDescription>{articulo.nombre}</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("empresa", "Empresa")}
        {campo("contacto", "Contacto")}
        {campo("telefono", "Teléfono")}
        {campo("celular", "Celular / WhatsApp")}
        {campo("correo", "Correo", "email")}
        {campo("dias_entrega", "Días de entrega", "number")}
        <div className="sm:col-span-2">{campo("direccion", "Dirección")}</div>
        <div className="sm:col-span-2">{campo("notas", "Notas")}</div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.principal} onChange={(e) => setF((x) => ({ ...x, principal: e.target.checked }))} />
        Proveedor principal
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
      </DialogFooter>
    </>
  );
}
