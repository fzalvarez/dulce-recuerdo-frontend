import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2Icon, ExternalLinkIcon, PencilIcon, PlusCircleIcon, SearchIcon, StethoscopeIcon, UploadIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { notifyError } from "@/shared/utils";
import { Paginador } from "@/shared/components/common/Paginador";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { Modal } from "@/features/casos/components/Dialogos";
import { soles } from "@/features/casos/utils/casos";
import * as C from "../api";
import { fechaDoc } from "../utils";

const POR_PAGINA = 25;

const ORIGEN: Record<C.OrigenCliente, { texto: string; clase: string; icono: typeof UserIcon }> = {
  TUTOR: { texto: "Tutor", clase: "bg-sky-50 text-sky-700", icono: UserIcon },
  VETERINARIA: { texto: "Veterinaria", clase: "bg-emerald-50 text-emerald-700", icono: StethoscopeIcon },
  EMPRESA: { texto: "Empresa", clase: "bg-amber-50 text-amber-800", icono: Building2Icon },
};

/**
 * Clientes de facturación: tutores, veterinarias del CRM y empresas en una sola lista, con lo que se les
 * ha emitido. Cada dato vive en su ficha (Clientes, CRM o aquí las empresas): no se copia.
 */
export function ClientesPanel({ puedeImportar }: { puedeImportar: boolean }) {
  const [pagina, setPagina] = useState(0);
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [origen, setOrigenBase] = useState<C.OrigenCliente | "todos">("todos");
  const [conComprobantes, setConComprobantesBase] = useState(false);
  const [editando, setEditando] = useState<C.ClienteFE | "nueva" | null>(null);
  const [importando, setImportando] = useState(false);

  const primera = useCallback(() => setPagina(0), []);
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto.trim() !== q) {
        setQ(texto.trim());
        primera();
      }
    }, 350);
    return () => clearTimeout(t);
  }, [texto, q, primera]);
  const setOrigen = (v: C.OrigenCliente | "todos") => {
    setOrigenBase(v);
    primera();
  };
  const setConComprobantes = (v: boolean) => {
    setConComprobantesBase(v);
    primera();
  };

  const recurso = useRecurso(
    () =>
      C.listarClientes({
        q: q || undefined,
        origen: origen === "todos" ? undefined : origen,
        con_comprobantes: conComprobantes || undefined,
        pagina: pagina + 1,
        por_pagina: POR_PAGINA,
      }),
    [q, origen, conComprobantes, pagina]
  );
  const datos = recurso.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-500 max-w-2xl">
          Todos a quienes se les puede emitir: tutores (por su DNI, carné o RUC propio), veterinarias aliadas (ficha del CRM) y empresas.
          Cada uno se edita en su ficha; las empresas, aquí.
        </p>
        <div className="flex gap-2">
          {puedeImportar && (
            <Button variant="outline" className="gap-1.5 h-10" onClick={() => setImportando(true)}>
              <UploadIcon className="size-4" />
              Importar de SUSII
            </Button>
          )}
          <Button variant="operational" className="gap-1.5 h-10" onClick={() => setEditando("nueva")}>
            <PlusCircleIcon className="size-4" />
            Nueva empresa
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input className="pl-9" placeholder="Nombre, razón social, DNI o RUC" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <BotonesOpcion
          ariaLabel="Tipo de cliente"
          value={origen}
          onChange={setOrigen}
          opciones={[
            { value: "todos", label: "Todos" },
            { value: "TUTOR", label: "Tutores" },
            { value: "VETERINARIA", label: "Veterinarias" },
            { value: "EMPRESA", label: "Empresas" },
          ]}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" className="size-4 accent-brand-500" checked={conComprobantes} onChange={(e) => setConComprobantes(e.target.checked)} />
          Solo con comprobantes
        </label>
      </div>

      {recurso.error && <p className="text-sm text-red-600">{recurso.error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm min-w-240">
          <thead className="bg-slate-50 dark:bg-white/5 text-label uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Contacto</th>
              <th className="px-4 py-3 font-semibold">Dirección</th>
              <th className="px-4 py-3 font-semibold text-right">Emitido</th>
              <th className="px-4 py-3 font-semibold text-right">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {(datos?.items ?? []).map((c) => {
              const o = ORIGEN[c.origen];
              const h = c.historial;
              return (
                <tr key={`${c.origen}-${c.id}`} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{c.nombre}</p>
                    {c.nombre_comercial && c.nombre_comercial !== c.nombre && <p className="text-xs text-slate-500">{c.nombre_comercial}</p>}
                    <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", o.clase)}>
                      <o.icono className="size-3" />
                      {o.texto}
                    </span>
                    {c.notas && <p className="mt-1 max-w-64 text-xs text-slate-500 line-clamp-2" title={c.notas}>{c.notas}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {c.numero_documento && (
                      <p>
                        <span className="text-xs text-slate-500">{c.tipo_documento} </span>
                        {c.numero_documento}
                      </p>
                    )}
                    {c.ruc && c.ruc !== c.numero_documento && (
                      <p>
                        <span className="text-xs text-slate-500">RUC </span>
                        {c.ruc}
                      </p>
                    )}
                    {c.estado_contribuyente && <p className="text-xs text-slate-500">SUNAT: {c.estado_contribuyente}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {c.telefono && <p>{c.telefono}</p>}
                    {c.email && <p className="break-all">{c.email}</p>}
                    {!c.telefono && !c.email && <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-64">{c.direccion ?? <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-right text-xs whitespace-nowrap">
                    {h.boletas || h.facturas ? (
                      <>
                        <p className="font-medium text-sm tabular-nums">{soles(h.total)}</p>
                        <p className="text-slate-500">
                          {h.boletas > 0 && `${h.boletas} boleta${h.boletas > 1 ? "s" : ""}`}
                          {h.boletas > 0 && h.facturas > 0 && " · "}
                          {h.facturas > 0 && `${h.facturas} factura${h.facturas > 1 ? "s" : ""}`}
                        </p>
                        <p className="text-slate-400">último {fechaDoc(h.ultimo)}</p>
                      </>
                    ) : (
                      <span className="text-slate-400">Sin comprobantes</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {c.origen === "EMPRESA" ? (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditando(c)}>
                        <PencilIcon className="size-3.5" />
                        Editar
                      </Button>
                    ) : (
                      <Link
                        to={c.origen === "TUTOR" ? "/clientes" : "/crm/veterinarias"}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                        title={c.origen === "TUTOR" ? "Se edita en Clientes" : "Se edita en la ficha del CRM"}
                      >
                        {c.origen === "TUTOR" ? "En Clientes" : "En el CRM"}
                        <ExternalLinkIcon className="size-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!recurso.cargando && datos && datos.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">Sin clientes con este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
        {datos && datos.total > 0 && <Paginador total={datos.total} pagina={pagina} onCambiar={setPagina} porPagina={POR_PAGINA} />}
      </div>

      <Modal open={editando !== null} onOpenChange={(o) => !o && setEditando(null)} ancho="sm:max-w-xl">
        {editando && (
          <EmpresaForm
            empresa={editando === "nueva" ? null : editando}
            onCerrar={() => setEditando(null)}
            onHecho={() => {
              setEditando(null);
              recurso.recargar();
            }}
          />
        )}
      </Modal>

      <Modal open={importando} onOpenChange={(o) => !o && setImportando(false)} ancho="sm:max-w-4xl">
        {importando && (
          <ImportarSusii onCerrar={() => setImportando(false)} onHecho={recurso.recargar} />
        )}
      </Modal>
    </div>
  );
}

function EmpresaForm({ empresa, onCerrar, onHecho }: { empresa: C.ClienteFE | null; onCerrar: () => void; onHecho: () => void }) {
  const [form, setForm] = useState({
    ruc: empresa?.ruc ?? "",
    razon_social: empresa?.nombre ?? "",
    nombre_comercial: empresa?.nombre_comercial ?? "",
    direccion: empresa?.direccion ?? "",
    email: empresa?.email ?? "",
    telefono: empresa?.telefono ?? "",
    estado_contribuyente: empresa?.estado_contribuyente ?? "",
    notas: empresa?.notas ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valor = (k: keyof typeof form) => form[k].trim() || null;
  const campo = (k: keyof typeof form, etiqueta: string, extra?: { className?: string; placeholder?: string; disabled?: boolean }) => (
    <div className={cn("space-y-1.5", extra?.className)}>
      <Label htmlFor={`emp-${k}`}>{etiqueta}</Label>
      <Input
        id={`emp-${k}`}
        value={form[k]}
        disabled={extra?.disabled}
        placeholder={extra?.placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [k]: k === "ruc" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value }))}
      />
    </div>
  );

  const guardar = async () => {
    if (!/^\d{11}$/.test(form.ruc)) return setError("El RUC tiene 11 dígitos.");
    if (!form.razon_social.trim()) return setError("Falta la razón social.");
    setError(null);
    setGuardando(true);
    const cuerpo = {
      razon_social: form.razon_social.trim(),
      nombre_comercial: valor("nombre_comercial"),
      direccion: valor("direccion"),
      email: valor("email"),
      telefono: valor("telefono"),
      estado_contribuyente: valor("estado_contribuyente"),
      notas: valor("notas"),
    };
    const ok = await ejecutar(
      () => (empresa ? C.editarEmpresa(empresa.id, cuerpo) : C.crearEmpresa({ ...cuerpo, ruc: form.ruc })),
      "Empresa guardada.",
      "No se pudo guardar la empresa."
    );
    setGuardando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{empresa ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
        <DialogDescription>
          Para clientes con RUC que no son tutores ni veterinarias del CRM (por ejemplo, la empresa que paga el servicio).
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campo("ruc", "RUC", { disabled: !!empresa, placeholder: "11 dígitos" })}
        {campo("estado_contribuyente", "Estado en SUNAT", { placeholder: "ACTIVO" })}
        {campo("razon_social", "Razón social", { className: "sm:col-span-2" })}
        {campo("nombre_comercial", "Nombre comercial", { className: "sm:col-span-2" })}
        {campo("direccion", "Dirección fiscal", { className: "sm:col-span-2" })}
        {campo("email", "Correo")}
        {campo("telefono", "Teléfono")}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="emp-notas">Notas</Label>
          <Textarea id="emp-notas" rows={3} value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
        </div>
      </div>
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

/** Importa el «Reporte de clientes» de SUSII: primero muestra lo que haría, luego se confirma. */
function ImportarSusii({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: () => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<C.ResultadoImportacion | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const procesar = async (aplicar: boolean) => {
    if (!archivo) return;
    setOcupado(true);
    try {
      const r = await C.importarClientes(archivo, aplicar);
      setPrevia(r);
      if (aplicar) onHecho();
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudo leer el archivo."));
    } finally {
      setOcupado(false);
    }
  };

  const cifras: [string, number][] = previa
    ? [
        ["Tutores completados", previa.tutores_actualizados],
        ["Tutores nuevos", previa.tutores_nuevos],
        ["Tutores con RUC propio", previa.tutores_con_ruc],
        ["Veterinarias completadas", previa.veterinarias_actualizadas],
        ["Empresas nuevas", previa.empresas_nuevas],
        ["Empresas completadas", previa.empresas_actualizadas],
        ["Sin cambios", previa.sin_cambios],
        ["Proveedores (no se importan)", previa.omitidos_proveedores],
        ["Sin documento (no se importan)", previa.omitidos_sin_documento],
      ]
    : [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Importar clientes de SUSII</DialogTitle>
        <DialogDescription>
          Sube el «Reporte de clientes» (CSV). Solo se completan datos vacíos: nada existente se pisa ni se duplica. Los proveedores
          quedan para Compras.
        </DialogDescription>
      </DialogHeader>
      <input
        type="file"
        accept=".csv,text/csv"
        className="text-sm"
        onChange={(e) => {
          setArchivo(e.target.files?.[0] ?? null);
          setPrevia(null);
        }}
      />
      {previa && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {previa.aplicado ? "Importación aplicada" : "Vista previa (todavía no se guardó nada)"} · {previa.leidas} filas leídas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cifras.map(([t, n]) => (
              <div key={t} className="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2">
                <p className="text-xs text-slate-500">{t}</p>
                <p className="text-lg font-semibold tabular-nums">{n}</p>
              </div>
            ))}
          </div>
          {previa.errores.length > 0 && (
            <ul className="text-xs text-red-600 list-disc pl-5">
              {previa.errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {previa.muestra.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-white/10">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 dark:bg-gray-900 text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5 text-left">Nombre</th>
                    <th className="px-3 py-1.5 text-left">Documento</th>
                    <th className="px-3 py-1.5 text-left">Qué se hace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {previa.muestra.map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">{m.nombre}</td>
                      <td className="px-3 py-1.5 tabular-nums whitespace-nowrap">{m.documento}</td>
                      <td className="px-3 py-1.5">
                        {m.accion}
                        {m.detalle && <span className="text-slate-500"> · {m.detalle}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={ocupado}>
          {previa?.aplicado ? "Cerrar" : "Cancelar"}
        </Button>
        {!previa?.aplicado && (
          <Button variant="outline" disabled={!archivo || ocupado} onClick={() => procesar(false)}>
            Ver qué haría
          </Button>
        )}
        {previa && !previa.aplicado && (
          <Button variant="operational" disabled={ocupado} onClick={() => procesar(true)}>
            {ocupado ? "Importando…" : "Aplicar importación"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
