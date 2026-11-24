import { useMemo, useState } from "react";
import { EyeIcon, PencilIcon, PlusCircleIcon, ReceiptIcon, SearchIcon, TagIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { ModuleHeader } from "@/shared/components/common/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "@/features/casos/components/Dialogos";
import { Link } from "react-router-dom";
import { soles } from "@/features/casos/utils/casos";
import * as V from "../api";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { AliadaDesdeCrm } from "../components/AliadaDesdeCrm";
import { FichaAliada } from "../components/FichaAliada";

type Dialogo =
  | { tipo: "nueva" }
  | { tipo: "editar"; vet: V.Veterinaria }
  | { tipo: "precios"; vet: V.Veterinaria };

/** Veterinarias aliadas: convenio, precio propio y facturación (specs tarifas y facturacion). */
export default function VeterinariasPage() {
  const recurso = useRecurso(V.cargar);
  const [busqueda, setBusqueda] = useState("");
  const [ventas, setVentas] = useState<"TODAS" | "SIN" | "CON">("TODAS");
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [ficha, setFicha] = useState<V.Veterinaria | null>(null);
  const cerrar = () => setDialogo(null);

  const datos = recurso.data;
  const convenios = useMemo(() => new Map((datos?.catalogo.convenios ?? []).map((c) => [c.id, c.nombre])), [datos]);
  const marcas = useMemo(() => new Map((datos?.marcas ?? []).map((m) => [m.id, m.nombre])), [datos]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos?.veterinarias ?? []).filter(
      (v) =>
        (!q || v.nombre.toLowerCase().includes(q)) &&
        (ventas === "TODAS" || (ventas === "CON" ? (v.ventas_realizadas ?? 0) > 0 : (v.ventas_realizadas ?? 0) === 0))
    );
  }, [datos, busqueda, ventas]);
  const porCobrar = (datos?.porCobrar ?? []).reduce((acc, f) => acc + Number(f.total), 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "Despedidas" }, { label: "Convenios Veterinarios" }]} />
      <ModuleHeader
        title="Veterinarias aliadas"
        description="La veterinaria cobra al cliente; Dulce Recuerdo le factura a su precio de convenio cuando el admin decide."
        actions={
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setDialogo({ tipo: "nueva" })}>
            <PlusCircleIcon className="size-4" />
            Nueva veterinaria
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi titulo="Veterinarias" valor={String(datos?.veterinarias.length ?? "—")} />
        <Kpi titulo="Activas" valor={String(datos?.veterinarias.filter((v) => v.estado === "ACTIVA").length ?? "—")} />
        <Kpi titulo="Facturas por cobrar" valor={datos ? `${datos.porCobrar.length} · ${soles(porCobrar)}` : "—"} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar veterinaria" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <BotonesOpcion<"TODAS" | "SIN" | "CON">
          ariaLabel="Filtrar por ventas"
          value={ventas}
          onChange={setVentas}
          opciones={[
            { value: "TODAS", label: "Todas" },
            { value: "SIN", label: "Sin ventas" },
            { value: "CON", label: "Con ventas" },
          ]}
        />
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Veterinaria</th>
              <th className="px-5 py-3 font-semibold">Contacto</th>
              <th className="px-5 py-3 font-semibold">Planes</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {visibles.map((v) => (
              <tr key={v.id}>
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {v.crm_codigo && <span className="font-mono text-xs text-slate-400 mr-1.5">{v.crm_codigo}</span>}
                  {v.nombre}
                  {v.direccion && <span className="block text-xs text-slate-500">{v.direccion}</span>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {[v.telefono, v.email].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-5 py-3">
                  {v.marca_id ? (
                    marcas.get(v.marca_id) ?? "—"
                  ) : v.tipo_convenio_id ? (
                    convenios.get(v.tipo_convenio_id) ?? "—"
                  ) : (
                    <span className="text-amber-700 text-xs">Sin convenio ni sub-marca</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-label font-semibold", v.estado === "ACTIVA" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                    {v.estado === "ACTIVA" ? "Activa" : "Inactiva"}
                  </span>
                  {/* Acuerdo firmado (aliada) vs. con al menos una venta realizada o entregada. */}
                  <span
                    className={cn(
                      "ml-1.5 px-2 py-0.5 rounded-full text-label font-semibold",
                      (v.ventas_realizadas ?? 0) > 0 ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {(v.ventas_realizadas ?? 0) > 0 ? `Con ventas · ${v.ventas_realizadas}` : "Sin ventas"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    {v.crm_id && (
                      <Button variant="outline" size="sm" onClick={() => setFicha(v)}>
                        <EyeIcon className="size-4" />
                        Ficha
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" title="Editar convenio y estado" onClick={() => setDialogo({ tipo: "editar", vet: v })}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Precio propio" onClick={() => setDialogo({ tipo: "precios", vet: v })}>
                      <TagIcon className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/veterinarias/${v.id}/facturacion`}>
                        <ReceiptIcon className="size-4" />
                        Facturación
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!recurso.cargando && visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Sin veterinarias.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Datos completos del CRM: solo lectura hasta pulsar «Editar» (spec crm-control-comercial, R10). */}
      <Modal open={ficha !== null} onOpenChange={(o) => !o && setFicha(null)} ancho="sm:max-w-5xl">
        {ficha?.crm_id && <FichaAliada crmId={ficha.crm_id} onCerrar={() => setFicha(null)} onHecho={recurso.recargar} />}
      </Modal>

      <Modal open={dialogo !== null} onOpenChange={(o) => !o && cerrar()} ancho="sm:max-w-2xl">
        {dialogo?.tipo === "nueva" && <AliadaDesdeCrm onCerrar={cerrar} onHecho={() => { recurso.recargar(); cerrar(); }} />}
        {dialogo?.tipo === "editar" && datos && (
          <VetForm vet={dialogo.vet} catalogo={datos.catalogo} marcas={datos.marcas} onCerrar={cerrar} onHecho={() => { recurso.recargar(); cerrar(); }} />
        )}
        {dialogo?.tipo === "precios" && datos && <PreciosPropios vet={dialogo.vet} catalogo={datos.catalogo} onCerrar={cerrar} />}
      </Modal>
    </>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs p-5">
      <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">{titulo}</span>
      <span className="block text-2xl font-bold text-slate-900 dark:text-white mt-1">{valor}</span>
    </div>
  );
}

/** Edición de una aliada. El alta no existe aquí: toda aliada sale de una ficha del CRM (AliadaDesdeCrm). */
function VetForm({
  vet,
  catalogo,
  marcas,
  onCerrar,
  onHecho,
}: {
  vet: V.Veterinaria;
  catalogo: V.Catalogo;
  marcas: V.Marca[];
  onCerrar: () => void;
  onHecho: () => void;
}) {
  const [f, setF] = useState({
    nombre: vet.nombre,
    telefono: vet.telefono ?? "",
    email: vet.email ?? "",
    direccion: vet.direccion ?? "",
    observaciones: vet.observaciones ?? "",
    tipo_convenio_id: vet.tipo_convenio_id ?? "",
    marca_id: vet.marca_id ?? "",
    activa: vet.estado === "ACTIVA",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const texto = (k: "nombre" | "telefono" | "email" | "direccion" | "observaciones", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`vt-${k}`}>{label}</Label>
      <Input
        id={`vt-${k}`}
        value={f[k]}
        // Nombre, teléfono y dirección vienen de la ficha del CRM: se cambian allí (spec crm-control-comercial, R12).
        disabled={vet.crm_codigo !== null && (V.CAMPOS_DE_FICHA as readonly string[]).includes(k)}
        onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
      />
    </div>
  );

  const guardar = async () => {
    if (!f.nombre.trim()) return setError("Escribe el nombre.");
    const cuerpo: V.VeterinariaCuerpo = {
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim() || null,
      email: f.email.trim() || null,
      direccion: f.direccion.trim() || null,
      observaciones: f.observaciones.trim() || null,
      // Convenio o sub-marca, nunca ambos (spec tarifas, R14).
      tipo_convenio_id: f.marca_id ? null : f.tipo_convenio_id || null,
      marca_id: f.marca_id || null,
      estado: f.activa ? "ACTIVA" : "INACTIVA",
    };
    setGuardando(true);
    const ok = await ejecutar(() => V.editar(vet.id, cuerpo), "Veterinaria guardada.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar veterinaria</DialogTitle>
        <DialogDescription>Usa convenio o sub-marca. Sin ninguno no se puede calcular el precio de sus casos.</DialogDescription>
      </DialogHeader>
      {vet.crm_codigo && (
        <p className="rounded-md bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          Nombre, teléfono y dirección vienen de la ficha CRM <span className="font-mono">{vet.crm_codigo}</span>. Se cambian en CRM › Veterinarias.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {texto("nombre", "Nombre")}
        <div className="space-y-1.5">
          <Label htmlFor="vt-convenio">Tipo de convenio</Label>
          <Select disabled={!!f.marca_id} value={f.tipo_convenio_id || "ninguno"} onValueChange={(v) => setF((x) => ({ ...x, tipo_convenio_id: v === "ninguno" ? "" : v }))}>
            <SelectTrigger id="vt-convenio" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguno">Sin convenio</SelectItem>
              {catalogo.convenios.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                  {!c.activo ? " (inactivo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vt-marca">Sub-marca</Label>
          <Select
            disabled={!!f.tipo_convenio_id}
            value={f.marca_id || "ninguna"}
            onValueChange={(v) => setF((x) => ({ ...x, marca_id: v === "ninguna" ? "" : v }))}
          >
            <SelectTrigger id="vt-marca" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguna">Ninguna</SelectItem>
              {marcas
                .filter((m) => m.activa || m.id === vet.marca_id)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre}
                    {!m.activa ? " (inactiva)" : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {f.tipo_convenio_id && <p className="text-[11px] text-slate-500">Quita el convenio para asignar una sub-marca.</p>}
        </div>
        {texto("telefono", "Teléfono")}
        {texto("email", "Correo")}
        {texto("direccion", "Dirección")}
        {texto("observaciones", "Observaciones")}
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-brand-500" checked={f.activa} onChange={(e) => setF((x) => ({ ...x, activa: e.target.checked }))} />
        Activa (sus casos se agendan sin pago del cliente)
      </label>
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

function PreciosPropios({ vet, catalogo, onCerrar }: { vet: V.Veterinaria; catalogo: V.Catalogo; onCerrar: () => void }) {
  const actual = useRecurso(() => V.preciosPropios(vet.id), [vet.id]);
  if (actual.error) return <p className="text-sm text-red-600">{actual.error}</p>;
  if (!actual.data) return <p className="text-sm text-slate-500">Cargando…</p>;
  // Solo los planes que le corresponden: los de su sub-marca, o los principales (spec tarifas, R15).
  const planes = catalogo.planes.filter((p) => p.marca_id === (vet.marca_id ?? null));
  return <PreciosPropiosForm vet={vet} catalogo={{ ...catalogo, planes }} actual={actual.data} onCerrar={onCerrar} />;
}

function PreciosPropiosForm({ vet, catalogo, actual, onCerrar }: { vet: V.Veterinaria; catalogo: V.Catalogo; actual: Record<string, Record<string, string>>; onCerrar: () => void }) {
  const [valores, setValores] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(catalogo.planes.map((p) => [p.id, Object.fromEntries(catalogo.rangos.map((r) => [r.id, actual[p.id]?.[r.id] != null ? String(Number(actual[p.id][r.id])) : ""]))]))
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const precios: Record<string, Record<string, string | null>> = {};
    for (const p of catalogo.planes) {
      precios[p.id] = {};
      for (const r of catalogo.rangos) {
        const t = valores[p.id][r.id].trim();
        if (t === "") {
          precios[p.id][r.id] = null;
          continue;
        }
        const n = Number(t);
        if (!Number.isFinite(n) || n < 0) return setError(`Precio inválido en ${p.nombre}.`);
        precios[p.id][r.id] = n.toFixed(2);
      }
    }
    setGuardando(true);
    const ok = await ejecutar(() => V.guardarPreciosPropios(vet.id, precios), "Precio propio guardado.", "No se pudo guardar.");
    setGuardando(false);
    if (ok) onCerrar();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Precio propio · {vet.nombre}</DialogTitle>
        <DialogDescription>Opcional. Donde quede vacío se usa el precio de su tipo de convenio.</DialogDescription>
      </DialogHeader>
      {catalogo.planes.map((p) => (
        <div key={p.id} className="flex flex-col gap-1">
          <span className="text-sm font-medium">{p.nombre}</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {catalogo.rangos.map((r) => (
              <div key={r.id} className="space-y-1">
                <Label htmlFor={`pp-${p.id}-${r.id}`} className="text-xs">{r.etiqueta}</Label>
                <Input
                  id={`pp-${p.id}-${r.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="convenio"
                  value={valores[p.id][r.id]}
                  onChange={(e) => setValores((x) => ({ ...x, [p.id]: { ...x[p.id], [r.id]: e.target.value } }))}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
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
