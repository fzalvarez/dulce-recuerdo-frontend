import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { ejecutar } from "@/shared/utils/ejecutar";
import { crear, editar, type CrmVeterinaria, type CrmVeterinariaCuerpo, type Prioridad } from "../api";

const HORARIOS = ["24 horas", "Por confirmar", "Lun-Vie", "Lun-Sáb"];
const FUENTES = ["Web", "Google Maps", "ChatGPT", "Referido"];

type PrioridadOpcion = Prioridad | "SIN";
type UrgenciasOpcion = "SI" | "NO" | "SIN";

const TEXTOS = ["nombre", "telefono", "ruta", "distrito", "direccion", "horario", "fuente", "web", "perfil", "estado_dato"] as const;
type CampoTexto = (typeof TEXTOS)[number];

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
  const [prioridad, setPrioridad] = useState<PrioridadOpcion>(veterinaria?.prioridad ?? "SIN");
  const [urgencias, setUrgencias] = useState<UrgenciasOpcion>(
    veterinaria?.urgencias_24h == null ? "SIN" : veterinaria.urgencias_24h ? "SI" : "NO"
  );
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = (k: CampoTexto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const campo = (k: CampoTexto, label: string, extra?: { lista?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`crm-${k}`}>{label}</Label>
      <Input id={`crm-${k}`} value={form[k]} onChange={set(k)} list={extra?.lista} placeholder={extra?.placeholder} />
    </div>
  );

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    const texto = (k: CampoTexto) => form[k].trim() || null;
    const cuerpo: CrmVeterinariaCuerpo = {
      nombre: form.nombre.trim(),
      telefono: texto("telefono"),
      ruta: texto("ruta"),
      distrito: texto("distrito"),
      direccion: texto("direccion"),
      horario: texto("horario"),
      fuente: texto("fuente"),
      web: texto("web"),
      perfil: texto("perfil"),
      estado_dato: texto("estado_dato"),
      prioridad: prioridad === "SIN" ? null : prioridad,
      urgencias_24h: urgencias === "SIN" ? null : urgencias === "SI",
    };
    setGuardando(true);
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
        <DialogDescription>Solo el nombre es obligatorio. Lo demás se completa después.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
        <div className="sm:col-span-2">{campo("nombre", "Nombre *")}</div>
        {campo("telefono", "Teléfono")}
        {campo("ruta", "Ruta", { placeholder: "R1, R2…" })}
        {campo("distrito", "Distrito")}
        {campo("horario", "Horario", { lista: "crm-horarios", placeholder: "24 horas, Lun-Vie…" })}
        <div className="sm:col-span-2">{campo("direccion", "Dirección")}</div>

        <div className="space-y-1.5">
          <Label>Prioridad</Label>
          <BotonesOpcion<PrioridadOpcion>
            ariaLabel="Prioridad"
            value={prioridad}
            onChange={setPrioridad}
            opciones={[
              { value: "ALTA", label: "Alta" },
              { value: "MEDIA", label: "Media" },
              { value: "BAJA", label: "Baja" },
              { value: "SIN", label: "—" },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label>24H / Urgencias</Label>
          <BotonesOpcion<UrgenciasOpcion>
            ariaLabel="24H / Urgencias"
            value={urgencias}
            onChange={setUrgencias}
            opciones={[
              { value: "SI", label: "Sí" },
              { value: "NO", label: "No" },
              { value: "SIN", label: "Sin dato" },
            ]}
          />
        </div>

        {campo("web", "Web")}
        {campo("fuente", "Fuente", { lista: "crm-fuentes", placeholder: "Web, Google Maps…" })}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="crm-perfil">Perfil</Label>
          <Textarea id="crm-perfil" rows={2} value={form.perfil} onChange={set("perfil")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="crm-estado_dato">Estado del dato</Label>
          <Textarea
            id="crm-estado_dato"
            rows={2}
            placeholder="Teléfono por confirmar, dirección verificada…"
            value={form.estado_dato}
            onChange={set("estado_dato")}
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
