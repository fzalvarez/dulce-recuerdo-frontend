import { useState } from "react";
import { AlertTriangleIcon, CheckIcon, LoaderIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { ComboFiltro } from "@/shared/components/common/ComboFiltro";
import { ejecutar } from "@/shared/utils/ejecutar";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/lib/utils";
import {
  convertirAliada,
  coincidencias,
  crear,
  DISTRITOS_CRM,
  editar,
  geocodificar,
  TIPOS,
  type Coincidencia,
  type CrmVeterinaria,
  type CrmVeterinariaCuerpo,
  type HorarioDia,
  type Prioridad,
  type TipoVeterinaria,
  type Ubicacion,
} from "../api";
import { formatoTelefono } from "../utils/formato";
import { HorarioEditor } from "./HorarioEditor";
import { MapaChico } from "./MapaChico";

const FUENTES = ["Web", "Google Maps", "ChatGPT", "VeterinariasPerú", "VetsPeruanas", "Referido"];
const SIN_TIPO = "ninguno";

type PrioridadOpcion = Prioridad | "SIN";
type UrgenciasOpcion = "SI" | "NO" | "SIN";

const TEXTOS = ["nombre", "razon_social", "ruc", "contacto", "telefono", "telefono2", "direccion", "fuente", "web", "perfil", "estado_dato"] as const;
type CampoTexto = (typeof TEXTOS)[number];

const soloDigitos = (max: number) => (v: string) => v.replace(/\D/g, "").slice(0, max);
// Centro de Lima, si no se encuentra ni la dirección ni el distrito.
const LIMA: Ubicacion = { latitud: -12.0464, longitud: -77.0428 };
const esDistrito = (v: string | null | undefined): v is string => !!v && (DISTRITOS_CRM as readonly string[]).includes(v);

/** Alta y edición de una veterinaria del CRM. Obligatorios: nombre y distrito (da el código). */
export function CrmVeterinariaForm({
  veterinaria,
  onCerrar,
  onHecho,
}: {
  veterinaria: CrmVeterinaria | null;
  onCerrar: () => void;
  onHecho: () => void;
}) {
  const [form, setForm] = useState<Record<CampoTexto, string>>(
    () => Object.fromEntries(TEXTOS.map((k) => [k, veterinaria?.[k] ?? ""])) as Record<CampoTexto, string>
  );
  const [distrito, setDistrito] = useState<string | null>(esDistrito(veterinaria?.distrito) ? veterinaria!.distrito! : null);
  const [tipo, setTipo] = useState<TipoVeterinaria | null>(veterinaria?.tipo ?? null);
  const [horario, setHorario] = useState<HorarioDia[] | null>(veterinaria?.horario ?? null);
  const [prioridad, setPrioridad] = useState<PrioridadOpcion>(veterinaria?.prioridad ?? "SIN");
  const [urgencias, setUrgencias] = useState<UrgenciasOpcion>(
    veterinaria?.urgencias_24h == null ? "SIN" : veterinaria.urgencias_24h ? "SI" : "NO"
  );
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(
    veterinaria?.latitud != null && veterinaria.longitud != null
      ? { latitud: veterinaria.latitud, longitud: veterinaria.longitud }
      : null
  );
  // Punto buscado automáticamente (ubicar aproximado): se ve distinto hasta confirmarlo.
  const [aprox, setAprox] = useState(veterinaria?.ubicacion_aprox ?? false);
  // Punto en edición: sale de "Ubicar" o de "Ajustar"; se guarda solo al confirmarlo.
  const [propuesta, setPropuesta] = useState<Ubicacion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  // Duplicados encontrados al guardar; con la lista a la vista, el segundo clic guarda igual.
  const [duplicados, setDuplicados] = useState<Coincidencia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoAliada, setConfirmandoAliada] = useState(false);
  // Solo root y admin convierten en aliada (spec crm-control-comercial, R9).
  const esAdmin = useAuthStore((s) => ["root", "admin"].includes(s.getUserRol()));
  // Una aliada se abre en solo lectura; «Editar» habilita todos los campos (spec crm-control-comercial, R10).
  const vinculada = veterinaria?.veterinaria_id != null;
  const [editando, setEditando] = useState(false);
  const editable = !vinculada || editando;

  // Crea la aliada desde la ficha guardada (no usa lo que haya escrito sin guardar).
  const convertir = async () => {
    if (!veterinaria) return;
    setGuardando(true);
    const ok = await ejecutar(
      () => convertirAliada(veterinaria.id),
      "Veterinaria aliada creada. Asígnale su convenio en Convenios Veterinarios.",
      "No se pudo convertir en aliada."
    );
    setGuardando(false);
    if (ok) {
      onHecho();
      onCerrar();
    }
  };

  const set =(k: CampoTexto, filtro?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = filtro ? filtro(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: valor }));
    if (k === "telefono" || k === "telefono2" || k === "ruc") setDuplicados(null);
  };

  const campo = (
    k: CampoTexto,
    label: string,
    extra?: { lista?: string; placeholder?: string; digitos?: number; telefono?: boolean; className?: string }
  ) => (
    <div className={cn("space-y-1", extra?.className)}>
      <Label htmlFor={`crm-${k}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`crm-${k}`}
        value={extra?.telefono ? formatoTelefono(form[k]) : form[k]}
        onChange={set(k, extra?.digitos ? soloDigitos(extra.digitos) : undefined)}
        list={extra?.lista}
        placeholder={extra?.placeholder}
        inputMode={extra?.digitos ? "numeric" : undefined}
        className="h-9"
      />
    </div>
  );

  // Busca la dirección y deja el punto listo para mover. Si no la encuentra, parte del distrito.
  const ubicar = async () => {
    const direccion = form.direccion.trim();
    if (!direccion) return;
    setBuscando(true);
    const exacta = await geocodificar(direccion, distrito).catch(() => null);
    const aprox = exacta ? null : distrito ? await geocodificar(distrito, null).catch(() => null) : null;
    setBuscando(false);
    setPropuesta(exacta ?? aprox ?? LIMA);
    setAviso(
      exacta
        ? null
        : aprox
          ? `No se encontró la dirección exacta: el punto está en ${distrito}. Muévelo al lugar correcto.`
          : "No se encontró la dirección. Mueve el punto al lugar correcto."
    );
  };

  const confirmarUbicacion = () => {
    setUbicacion(propuesta);
    setAprox(false);
    setPropuesta(null);
    setAviso(null);
  };

  const todo24h = !!horario?.every((d) => d.estado === "24H");

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!distrito) return setError("El distrito es obligatorio.");
    if (propuesta) return setError("Confirma o cancela la ubicación del mapa antes de guardar.");
    if (form.ruc && form.ruc.length !== 11) return setError("El RUC debe tener 11 números.");
    if (horario?.some((d) => d.estado === "ABIERTO" && (!d.abre || !d.cierra)))
      return setError("Completa la hora de apertura y cierre de los días abiertos.");
    setError(null);
    setGuardando(true);

    const texto = (k: CampoTexto) => form[k].trim() || null;
    const telefonos = [texto("telefono"), texto("telefono2")].filter((t): t is string => !!t);

    // Aviso de duplicados (R14): la primera vez muestra la lista; el segundo clic guarda igual.
    if (duplicados === null && (telefonos.length || texto("ruc"))) {
      const encontrados = await coincidencias(telefonos, texto("ruc"), veterinaria?.id).catch(() => []);
      if (encontrados.length) {
        setDuplicados(encontrados);
        setGuardando(false);
        return;
      }
    }

    const cuerpo: CrmVeterinariaCuerpo = {
      nombre: form.nombre.trim(),
      distrito,
      tipo,
      razon_social: texto("razon_social"),
      ruc: texto("ruc"),
      contacto: texto("contacto"),
      telefono: texto("telefono"),
      telefono2: texto("telefono2"),
      direccion: texto("direccion"),
      latitud: ubicacion?.latitud ?? null,
      longitud: ubicacion?.longitud ?? null,
      ubicacion_aprox: ubicacion ? aprox : false,
      horario,
      fuente: texto("fuente"),
      web: texto("web"),
      perfil: texto("perfil"),
      estado_dato: texto("estado_dato"),
      prioridad: prioridad === "SIN" ? null : prioridad,
      urgencias_24h: urgencias === "SIN" ? null : urgencias === "SI",
    };
    const ok = await ejecutar(
      () => (veterinaria ? editar(veterinaria.id, cuerpo) : crear(cuerpo)),
      veterinaria ? "Veterinaria actualizada." : "Veterinaria registrada.",
      "No se pudo guardar la veterinaria."
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
        <DialogTitle>
          {veterinaria ? "Editar veterinaria" : "Nueva veterinaria"}
          {veterinaria && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">{veterinaria.codigo}</span>}
        </DialogTitle>
        <DialogDescription>
          Obligatorios: nombre y distrito.{!veterinaria && " El código (p. ej. ATE-001) se asigna al guardar."}
          {vinculada &&
            (editando
              ? " Al guardar, también se actualizan nombre, teléfono y dirección de la aliada."
              : " Solo lectura: pulsa «Editar» para cambiar datos.")}
        </DialogDescription>
      </DialogHeader>

      {/* En solo lectura, el fieldset deshabilita todos los campos y botones de adentro. */}
      <fieldset disabled={!editable} className="contents">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-4 gap-y-3.5 max-h-[75vh] overflow-y-auto px-1 pb-1">
        {campo("nombre", "Nombre *", { className: "col-span-2 sm:col-span-6" })}

        <div className="col-span-2 sm:col-span-2 space-y-1">
          <Label htmlFor="crm-tipo" className="text-xs">
            Tipo
          </Label>
          <Select value={tipo ?? SIN_TIPO} onValueChange={(v) => setTipo(v === SIN_TIPO ? null : (v as TipoVeterinaria))}>
            <SelectTrigger id="crm-tipo" className="w-full h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_TIPO}>Sin definir</SelectItem>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {campo("razon_social", "Razón social", { placeholder: "EMPRESA S.A.C.", className: "col-span-2 sm:col-span-2" })}
        {campo("ruc", "RUC", { digitos: 11, placeholder: "11 números", className: "col-span-2 sm:col-span-2" })}

        {campo("contacto", "Persona de contacto", { placeholder: "Nombre y cargo", className: "col-span-2 sm:col-span-2" })}
        {campo("telefono", "Teléfono 1", { digitos: 15, telefono: true, placeholder: "999 999 999", className: "col-span-1 sm:col-span-2" })}
        {campo("telefono2", "Teléfono 2", { digitos: 15, telefono: true, placeholder: "01 234 5678", className: "col-span-1 sm:col-span-2" })}

        <div className="col-span-2 sm:col-span-2 space-y-1">
          <Label htmlFor="crm-distrito" className="text-xs">
            Distrito *
          </Label>
          <ComboFiltro id="crm-distrito" value={distrito} opciones={DISTRITOS_CRM} placeholder="Escribe: S, San…" onChange={setDistrito} />
        </div>
        <div className="col-span-2 sm:col-span-4 space-y-1">
          <Label htmlFor="crm-direccion" className="text-xs">
            Dirección
          </Label>
          <div className="flex gap-2">
            <Input id="crm-direccion" value={form.direccion} onChange={set("direccion")} placeholder="Av. Aviación 2450" className="h-9" />
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 gap-1.5"
              onClick={ubicar}
              disabled={!form.direccion.trim() || buscando}
              title="Buscar la dirección en el mapa"
            >
              {buscando ? <LoaderIcon className="size-4 animate-spin" /> : <MapPinIcon className="size-4" />}
              <span className="hidden sm:inline">Ubicar</span>
            </Button>
          </div>
        </div>

        {propuesta ? (
          <div className="col-span-2 sm:col-span-6 space-y-2">
            <MapaChico {...propuesta} onMover={setPropuesta} className="h-52" />
            {aviso && <p className="text-xs text-amber-700">{aviso}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">Arrastra el punto o haz clic en el mapa para corregirlo.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPropuesta(null);
                    setAviso(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" variant="operational" size="sm" className="gap-1.5" onClick={confirmarUbicacion}>
                  <CheckIcon className="size-4" />
                  Confirmar ubicación
                </Button>
              </div>
            </div>
          </div>
        ) : (
          ubicacion && (
            <div className="col-span-2 sm:col-span-6 space-y-2">
              <MapaChico {...ubicacion} className="h-36" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {aprox ? (
                  <p className="text-xs text-amber-700">Ubicación aproximada (buscada por dirección): ajusta el punto y confírmalo.</p>
                ) : (
                  <p className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckIcon className="size-3.5" />
                    Ubicación confirmada
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUbicacion(null);
                      setAprox(false);
                    }}
                  >
                    Quitar
                  </Button>
                  <Button type="button" variant={aprox ? "operational" : "outline"} size="sm" onClick={() => setPropuesta(ubicacion)}>
                    {aprox ? "Revisar y confirmar" : "Ajustar punto"}
                  </Button>
                </div>
              </div>
            </div>
          )
        )}

        <div className="col-span-2 sm:col-span-6 space-y-1 rounded-lg border border-slate-200 p-2.5">
          <Label className="text-xs">Horario</Label>
          <HorarioEditor value={horario} onChange={setHorario} />
        </div>

        <div className="col-span-2 sm:col-span-3 space-y-1">
          <Label className="text-xs">Prioridad</Label>
          <BotonesOpcion<PrioridadOpcion>
            ariaLabel="Prioridad"
            value={prioridad}
            onChange={setPrioridad}
            columnas="grid-cols-4"
            opciones={[
              { value: "ALTA", label: "Alta" },
              { value: "MEDIA", label: "Media" },
              { value: "BAJA", label: "Baja" },
              { value: "SIN", label: "—" },
            ]}
          />
        </div>
        <div className="col-span-2 sm:col-span-3 space-y-1">
          <Label className="text-xs">24H / Urgencias</Label>
          <BotonesOpcion<UrgenciasOpcion>
            ariaLabel="24H / Urgencias"
            value={urgencias}
            onChange={setUrgencias}
            columnas="grid-cols-3"
            opciones={[
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
              { value: "SIN", label: "Sin dato" },
            ]}
          />
          {todo24h && urgencias !== "SI" && (
            <button type="button" className="text-[11px] text-brand-600 hover:underline" onClick={() => setUrgencias("SI")}>
              El horario es 24 h todos los días: ¿marcar «Sí»?
            </button>
          )}
        </div>

        {campo("fuente", "Fuente", { lista: "crm-fuentes", placeholder: "Nombre o URL de donde salió el dato", className: "col-span-2 sm:col-span-3" })}
        {campo("web", "Web", { placeholder: "www.veterinaria.pe", className: "col-span-2 sm:col-span-3" })}

        <div className="col-span-2 sm:col-span-3 space-y-1">
          <Label htmlFor="crm-perfil" className="text-xs">
            Perfil
          </Label>
          <Textarea id="crm-perfil" rows={2} value={form.perfil} onChange={set("perfil")} className="min-h-0" />
        </div>
        <div className="col-span-2 sm:col-span-3 space-y-1">
          <Label htmlFor="crm-estado_dato" className="text-xs">
            Estado del dato
          </Label>
          <Textarea
            id="crm-estado_dato"
            rows={2}
            placeholder="Teléfono por confirmar…"
            value={form.estado_dato}
            onChange={set("estado_dato")}
            className="min-h-0"
          />
        </div>

        <datalist id="crm-fuentes">
          {FUENTES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>
      </fieldset>

      {duplicados && duplicados.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangleIcon className="size-3.5" />
            Posible duplicado
          </p>
          <ul className="mt-1 space-y-0.5">
            {duplicados.map((d) => (
              <li key={`${d.id}-${d.campo}`}>
                <span className="font-mono">{d.codigo}</span> {d.nombre} — mismo {d.campo === "ruc" ? "RUC" : "teléfono"} (
                {d.campo === "ruc" ? d.valor : formatoTelefono(d.valor)})
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        {vinculada ? (
          <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckIcon className="size-3.5" />
            Veterinaria aliada
          </span>
        ) : (
          veterinaria &&
          esAdmin &&
          (confirmandoAliada ? (
            <div className="mr-auto flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600">Crea la aliada con los datos guardados, sin convenio.</span>
              <Button variant="operational" size="sm" onClick={convertir} disabled={guardando}>
                Sí, convertir
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmandoAliada(false)} disabled={guardando}>
                No
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="mr-auto" onClick={() => setConfirmandoAliada(true)} disabled={guardando}>
              Convertir en aliada
            </Button>
          ))
        )}
        {vinculada && !editando ? (
          <>
            <Button variant="ghost" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button variant="operational" onClick={() => setEditando(true)}>
              Editar
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="operational" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando…" : duplicados?.length ? "Guardar igual" : "Guardar"}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}
