import { useState } from "react";
import { MailIcon, MapPinIcon, PencilIcon, PhoneIcon, PlusIcon, Trash2Icon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notifySuccess } from "@/shared/utils";
import type { Proveedor } from "../types";

type DatosProveedor = Omit<Proveedor, "id">;

export function ProveedoresDialog({
  open,
  nombreItem,
  proveedores,
  onOpenChange,
  onActualizar,
}: {
  open: boolean;
  nombreItem: string;
  proveedores: Proveedor[];
  onOpenChange: (open: boolean) => void;
  onActualizar: (lista: Proveedor[]) => void;
}) {
  const [formulario, setFormulario] = useState<{ proveedor: Proveedor | null } | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const guardar = (datos: DatosProveedor, id?: string) => {
    // Solo un proveedor principal por insumo.
    const base = datos.principal ? proveedores.map((p) => ({ ...p, principal: false })) : proveedores;
    const nuevo: Proveedor = { ...datos, id: id ?? `prov-${Date.now()}` };
    const lista = id ? base.map((p) => (p.id === id ? nuevo : p)) : [...base, nuevo];
    // Si no queda ningún principal, el primero pasa a serlo.
    const conPrincipal = lista.some((p) => p.principal) ? lista : lista.map((p, i) => ({ ...p, principal: i === 0 }));
    onActualizar(conPrincipal);
    setFormulario(null);
    notifySuccess(id ? "Proveedor actualizado." : "Proveedor agregado.");
  };

  const eliminar = (id: string) => {
    if (confirmandoId !== id) return setConfirmandoId(id);
    const restantes = proveedores.filter((p) => p.id !== id);
    const conPrincipal =
      restantes.length > 0 && !restantes.some((p) => p.principal)
        ? restantes.map((p, i) => ({ ...p, principal: i === 0 }))
        : restantes;
    onActualizar(conPrincipal);
    setConfirmandoId(null);
    notifySuccess("Proveedor eliminado.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setFormulario(null);
          setConfirmandoId(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <TruckIcon className="size-5" />
          </div>
          <DialogTitle>Proveedores de {nombreItem}</DialogTitle>
        </DialogHeader>
        <DialogDescription>Quién vende este insumo y cómo contactarlo.</DialogDescription>

        {formulario ? (
          <ProveedorForm
            key={formulario.proveedor?.id ?? "nuevo"}
            proveedor={formulario.proveedor}
            onCancelar={() => setFormulario(null)}
            onGuardar={(datos) => guardar(datos, formulario.proveedor?.id)}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {proveedores.length === 0 && (
              <p className="text-sm text-slate-500">Todavía no hay proveedores registrados para este insumo.</p>
            )}
            {proveedores.map((p) => (
              <article key={p.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{p.empresa}</span>
                    {p.principal && (
                      <span className="px-2 py-0.5 rounded-full text-label font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setFormulario({ proveedor: p })}>
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant={confirmandoId === p.id ? "destructive" : "ghost"}
                      size="sm"
                      onClick={() => eliminar(p.id)}
                    >
                      <Trash2Icon className="size-3.5" />
                      {confirmandoId === p.id ? "Confirmar" : "Eliminar"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {p.contacto && <span>Contacto: {p.contacto}</span>}
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 text-slate-400" /> {p.telefono}
                    {p.celular && <span className="text-slate-400">· WhatsApp {p.celular}</span>}
                  </span>
                  {p.correo && (
                    <span className="inline-flex items-center gap-1.5">
                      <MailIcon className="size-3.5 text-slate-400" /> {p.correo}
                    </span>
                  )}
                  {p.direccion && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 text-slate-400" /> {p.direccion}
                    </span>
                  )}
                  {p.diasEntrega !== undefined && <span>Entrega: {p.diasEntrega} días</span>}
                </div>
                {p.notas && <p className="text-xs text-slate-500">{p.notas}</p>}
              </article>
            ))}
            <div>
              <Button variant="outline" size="sm" onClick={() => setFormulario({ proveedor: null })}>
                <PlusIcon className="size-3.5" />
                Agregar proveedor
              </Button>
            </div>
          </div>
        )}

        {formulario === null && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProveedorForm({
  proveedor,
  onCancelar,
  onGuardar,
}: {
  proveedor: Proveedor | null;
  onCancelar: () => void;
  onGuardar: (datos: DatosProveedor) => void;
}) {
  const [empresa, setEmpresa] = useState(proveedor?.empresa ?? "");
  const [contacto, setContacto] = useState(proveedor?.contacto ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [celular, setCelular] = useState(proveedor?.celular ?? "");
  const [correo, setCorreo] = useState(proveedor?.correo ?? "");
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? "");
  const [dias, setDias] = useState(proveedor?.diasEntrega !== undefined ? String(proveedor.diasEntrega) : "");
  const [principal, setPrincipal] = useState(proveedor?.principal ?? false);
  const [notas, setNotas] = useState(proveedor?.notas ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = () => {
    if (!empresa.trim()) return setError("Escribe el nombre de la empresa.");
    if (!telefono.trim()) return setError("Escribe un teléfono de contacto.");
    if (correo.trim() && !/^\S+@\S+\.\S+$/.test(correo.trim())) {
      return setError("El correo no tiene un formato válido.");
    }
    const d = dias.trim() === "" ? undefined : Number(dias);
    if (d !== undefined && (!Number.isInteger(d) || d < 0)) {
      return setError("Los días de entrega deben ser un número entero, 0 o mayor.");
    }
    onGuardar({
      empresa: empresa.trim(),
      contacto: contacto.trim() || undefined,
      telefono: telefono.trim(),
      celular: celular.trim() || undefined,
      correo: correo.trim() || undefined,
      direccion: direccion.trim() || undefined,
      diasEntrega: d,
      principal,
      notas: notas.trim() || undefined,
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="prov-empresa">Empresa</Label>
          <Input id="prov-empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-contacto">Persona de contacto</Label>
          <Input id="prov-contacto" value={contacto} onChange={(e) => setContacto(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-telefono">Teléfono</Label>
          <Input id="prov-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-celular">WhatsApp (opcional)</Label>
          <Input id="prov-celular" value={celular} onChange={(e) => setCelular(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-correo">Correo</Label>
          <Input id="prov-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="prov-direccion">Dirección</Label>
          <Input id="prov-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prov-dias">Días de entrega</Label>
          <Input id="prov-dias" type="number" min={0} step={1} value={dias} onChange={(e) => setDias(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="size-4 accent-brand-500"
            checked={principal}
            onChange={(e) => setPrincipal(e.target.checked)}
          />
          Proveedor principal
        </label>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="prov-notas">Notas (condiciones, horarios, forma de pago)</Label>
          <Textarea id="prov-notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          {proveedor ? "Guardar cambios" : "Agregar proveedor"}
        </Button>
      </DialogFooter>
    </>
  );
}
