import { useState } from "react";
import { LoaderIcon, MapPinIcon } from "lucide-react";
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
type Busqueda = "inactiva" | "buscando" | "no-encontrada";

const TEXTOS = ["nombre", "telefono", "telefono2", "ruta", "direccion", "horario", "fuente", "web", "perfil", "estado_dato"] as const;
type CampoTexto = (typeof TEXTOS)[number];

const soloDigitos = (v: string) => v.replace(/\D/g, "").slice(0, 15);
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
  const [busqueda, setBusqueda] = useState<Busqueda>("inactiva");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (k: CampoTexto, filtro?: (v: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = filtro ? filtro(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: valor }));
    // Si cambia la dirección, la ubicación anterior ya no vale.
    if (k === "direccion") {
      setUbicacion(null);
      setBusqueda("inactiva");
    }
  };

  const campo = (
    k: CampoTexto,
    label: string,
    extra?: { lista?: string; placeholder?: string; telefono?: boolean; className?: string }
  ) => (
    <div className={cn("space-y-1", extra?.className)}>
      <Label htmlFor={`crm-${k}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`crm-${k}`}
        value={form[k]}
        onChange={set(k, extra?.telefono ? soloDigitos : undefined)}
        list={extra?.lista}
        placeholder={extra?.placeholder}
        inputMode={extra?.telefono ? "numeric" : undefined}
        className="h-9"
      />
    </div>
  );

  const ubicar = async (): Promise<Ubicacion | null> => {
    const direccion = form.direccion.trim();
    if (!direccion) return null;
    setBusqueda("buscando");
    const encontrada = await geocodificar(direccion, distrito).catch(() => null);
    setUbicacion(encontrada);
    setBusqueda(encontrada ? "inactiva" : "no-encontrada");
    return encontrada;
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    setGuardando(true);
    // Al guardar una dirección nueva, se busca en el mapa (si no se encuentra, se guarda igual).
    const punto = ubicacion ?? (form.direccion.trim() ? await ubicar() : null);
    const texto = (k: CampoTexto) => form[k].trim() || null;
    const cuerpo: CrmVeterinariaCuerpo = {
      nombre: form.nombre.trim(),
      telefono: texto("telefono"),
      telefono2: texto("telefono2"),
      ruta: texto("ruta"),
      distrito,
      direccion: texto("direccion"),
      latitud: punto?.latitud ?? null,
      longitud: punto?.longitud ?? null,
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

        {campo("telefono", "Teléfono 1", { telefono: true, className: "col-span-1 sm:col-span-2" })}
        {campo("telefono2", "Teléfono 2", { telefono: true, className: "col-span-1 sm:col-span-2" })}
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
              if (v === distrito) return;
              setDistrito(v);
              setUbicacion(null);
              setBusqueda("inactiva");
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
              disabled={!form.direccion.trim() || busqueda === "buscando"}
              title="Buscar la dirección en el mapa"
            >
              {busqueda === "buscando" ? <LoaderIcon className="size-4 animate-spin" /> : <MapPinIcon className="size-4" />}
              <span className="hidden sm:inline">Ubicar</span>
            </Button>
          </div>
        </div>

        {(ubicacion || busqueda === "no-encontrada") && (
          <div className="col-span-2 sm:col-span-6">
            {ubicacion ? (
              <MapaChico {...ubicacion} className="h-40" />
            ) : (
              <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                No se encontró la dirección en el mapa. Revisa la dirección o el distrito; se puede guardar igual.
              </p>
            )}
          </div>
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
