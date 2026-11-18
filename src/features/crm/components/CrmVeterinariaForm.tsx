import { useState } from "react";
import { CheckIcon, LoaderIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { ComboFiltro } from "@/shared/components/common/ComboFiltro";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cn } from "@/lib/utils";
import {
  crear,
  DISTRITOS_CRM,
  editar,
  geocodificar,
  type CrmVeterinaria,
  type CrmVeterinariaCuerpo,
  type Prioridad,
  type Ubicacion,
} from "../api";
import { MapaChico } from "./MapaChico";

const HORARIOS = ["24 horas", "Por confirmar", "Lun-Vie", "Lun-Sáb"];
const FUENTES = ["Web", "Google Maps", "ChatGPT", "Referido"];

type PrioridadOpcion = Prioridad | "SIN";
type UrgenciasOpcion = "SI" | "NO" | "SIN";

const TEXTOS = ["nombre", "ruc", "contacto", "telefono", "telefono2", "ruta", "direccion", "horario", "fuente", "web", "perfil", "estado_dato"] as const;
type CampoTexto = (typeof TEXTOS)[number];

const soloDigitos = (max: number) => (v: string) => v.replace(/\D/g, "").slice(0, max);
// Centro de Lima, si no se encuentra ni la dirección ni el distrito.
const LIMA: Ubicacion = { latitud: -12.0464, longitud: -77.0428 };
const esDistrito = (v: string | null | undefined): v is string => !!v && (DISTRITOS_CRM as readonly string[]).includes(v);

/** Alta y edición de una veterinaria del CRM. Solo el nombre es obligatorio. */
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
  const [prioridad, setPrioridad] = useState<PrioridadOpcion>(veterinaria?.prioridad ?? "SIN");
  const [urgencias, setUrgencias] = useState<UrgenciasOpcion>(
    veterinaria?.urgencias_24h == null ? "SIN" : veterinaria.urgencias_24h ? "SI" : "NO"
  );
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(
    veterinaria?.latitud != null && veterinaria.longitud != null
      ? { latitud: veterinaria.latitud, longitud: veterinaria.longitud }
      : null
  );
  // Punto en edición: sale de "Ubicar" o de "Ajustar"; se guarda solo al confirmarlo.
  const [propuesta, setPropuesta] = useState<Ubicacion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (k: CampoTexto, filtro?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = filtro ? filtro(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: valor }));
  };

  const campo = (
    k: CampoTexto,
    label: string,
    extra?: { lista?: string; placeholder?: string; digitos?: number; className?: string }
  ) => (
    <div className={cn("space-y-1", extra?.className)}>
      <Label htmlFor={`crm-${k}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`crm-${k}`}
        value={form[k]}
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
    setPropuesta(null);
    setAviso(null);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (propuesta) return setError("Confirma o cancela la ubicación del mapa antes de guardar.");
    if (form.ruc && form.ruc.length !== 11) return setError("El RUC debe tener 11 números.");
    setError(null);
    setGuardando(true);
    const texto = (k: CampoTexto) => form[k].trim() || null;
    const cuerpo: CrmVeterinariaCuerpo = {
      nombre: form.nombre.trim(),
      ruc: texto("ruc"),
      contacto: texto("contacto"),
      telefono: texto("telefono"),
      telefono2: texto("telefono2"),
      ruta: texto("ruta"),
      distrito,
      direccion: texto("direccion"),
      latitud: ubicacion?.latitud ?? null,
      longitud: ubicacion?.longitud ?? null,
      horario: texto("horario"),
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
        <DialogTitle>{veterinaria ? "Editar veterinaria" : "Nueva veterinaria"}</DialogTitle>
        <DialogDescription>Solo el nombre es obligatorio.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-x-3 gap-y-2.5 max-h-[72vh] overflow-y-auto px-0.5 pb-1">
        {campo("nombre", "Nombre *", { className: "col-span-2 sm:col-span-4" })}
        {campo("ruta", "Ruta", { placeholder: "R1, R2…", className: "col-span-2 sm:col-span-2" })}

        {campo("ruc", "RUC", { digitos: 11, placeholder: "11 números", className: "col-span-2 sm:col-span-2" })}
        {campo("contacto", "Persona de contacto", { placeholder: "Nombre y cargo", className: "col-span-2 sm:col-span-4" })}

        {campo("telefono", "Teléfono 1", { digitos: 15, className: "col-span-1 sm:col-span-2" })}
        {campo("telefono2", "Teléfono 2", { digitos: 15, className: "col-span-1 sm:col-span-2" })}
        {campo("horario", "Horario", { lista: "crm-horarios", placeholder: "24 horas, Lun-Vie…", className: "col-span-2 sm:col-span-2" })}

        <div className="col-span-2 sm:col-span-2 space-y-1">
          <Label htmlFor="crm-distrito" className="text-xs">
            Distrito
          </Label>
          <ComboFiltro
            id="crm-distrito"
            value={distrito}
            opciones={DISTRITOS_CRM}
            placeholder="Escribe: S, San…"
            onChange={(v) => {
              setDistrito(v);
            }}
          />
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
                <p className="flex items-center gap-1 text-xs text-emerald-700">
                  <CheckIcon className="size-3.5" />
                  Ubicación confirmada
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUbicacion(null)}>
                    Quitar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPropuesta(ubicacion)}>
                    Ajustar punto
                  </Button>
                </div>
              </div>
            </div>
          )
        )}

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
        </div>

        {campo("fuente", "Fuente", { lista: "crm-fuentes", placeholder: "Web, Google Maps…", className: "col-span-2 sm:col-span-2" })}
        {campo("web", "Web", { placeholder: "www.veterinaria.pe", className: "col-span-2 sm:col-span-4" })}

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

        <datalist id="crm-horarios">
          {HORARIOS.map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
        <datalist id="crm-fuentes">
          {FUENTES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
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
