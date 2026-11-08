import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Caso, MetodoPago, Modalidad, PlanId, Servicio } from "../types";
import { DISTRITOS, PLAN_NOMBRE } from "../data/tarifas";
import { VETERINARIAS } from "../data/veterinarias";
import { hoyISO, MODALIDAD_LABEL, SERVICIO_LABEL, soles, totalPagado } from "../utils/casos";


const METODO_LABEL: Record<MetodoPago, string> = { EFECTIVO: "Efectivo", YAPE: "Yape", POS: "POS (tarjeta)" };

export function Modal({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">{children}</DialogContent>
    </Dialog>
  );
}

// ---------- Registrar pago ----------

export function PagoDialog({
  caso,
  total,
  onOpenChange,
  onGuardar,
}: {
  caso: Caso | null;
  total: number;
  onOpenChange: (open: boolean) => void;
  onGuardar: (monto: number, metodo: MetodoPago) => void;
}) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && (
        <PagoForm
          caso={caso}
          total={total}
          onCancelar={() => onOpenChange(false)}
          onGuardar={(monto, metodo) => {
            onGuardar(monto, metodo);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

function PagoForm({
  caso,
  total,
  onCancelar,
  onGuardar,
}: {
  caso: Caso;
  total: number;
  onCancelar: () => void;
  onGuardar: (monto: number, metodo: MetodoPago) => void;
}) {
  const pagado = totalPagado(caso);
  const saldo = Math.max(0, total - pagado);
  const [monto, setMonto] = useState(saldo > 0 ? String(saldo) : "");
  const [metodo, setMetodo] = useState<MetodoPago>("YAPE");
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = () => {
    const n = Number(monto);
    if (!Number.isFinite(n) || n <= 0) return setError("El monto debe ser mayor a 0.");
    onGuardar(n, metodo);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar pago · {caso.mascota}</DialogTitle>
        <DialogDescription>
          Precio del servicio: {total > 0 ? soles(total) : "por confirmar"} · Pagado hasta ahora: {soles(pagado)}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pago-monto">Monto (S/)</Label>
            <Input id="pago-monto" type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pago-metodo">Forma de pago</Label>
            <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
              <SelectTrigger id="pago-metodo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {METODO_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Registrar pago
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Agendar ----------

export function AgendarDialog({
  caso,
  onOpenChange,
  onGuardar,
}: {
  caso: Caso | null;
  onOpenChange: (open: boolean) => void;
  onGuardar: (fecha: string, hora: string) => void;
}) {
  return (
    <Modal open={caso !== null} onOpenChange={onOpenChange}>
      {caso && (
        <AgendarForm
          caso={caso}
          onCancelar={() => onOpenChange(false)}
          onGuardar={(f, h) => {
            onGuardar(f, h);
            onOpenChange(false);
          }}
        />
      )}
    </Modal>
  );
}

function AgendarForm({
  caso,
  onCancelar,
  onGuardar,
}: {
  caso: Caso;
  onCancelar: () => void;
  onGuardar: (fecha: string, hora: string) => void;
}) {
  const [fecha, setFecha] = useState(caso.fechaServicio ?? hoyISO());
  const [hora, setHora] = useState(caso.horaServicio ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleGuardar = () => {
    if (!fecha) return setError("Elige la fecha del servicio.");
    if (!hora) return setError("Indica la hora del servicio.");
    onGuardar(fecha, hora);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agendar · {caso.mascota}</DialogTitle>
        <DialogDescription>
          {caso.modalidad === "DOMICILIO"
            ? "La hora define el recargo de traslado si cae en horario punta."
            : "Fecha y hora en que se realiza el servicio."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ag-fecha">Fecha</Label>
          <DatePicker id="ag-fecha" value={fecha} onChange={setFecha} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-hora">Hora</Label>
          <Input id="ag-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Agendar
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------- Nuevo caso ----------

export type NuevoCasoDatos = Omit<Caso, "id" | "codigo" | "pagos" | "ultimoContacto" | "estado">;

export function NuevoCasoDialog({
  open,
  onOpenChange,
  onGuardar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (datos: NuevoCasoDatos) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <NuevoCasoForm
        onCancelar={() => onOpenChange(false)}
        onGuardar={(d) => {
          onGuardar(d);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}

function NuevoCasoForm({
  onCancelar,
  onGuardar,
}: {
  onCancelar: () => void;
  onGuardar: (datos: NuevoCasoDatos) => void;
}) {
  const [tutor, setTutor] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mascota, setMascota] = useState("");
  const [especie, setEspecie] = useState("Canino");
  const [servicio, setServicio] = useState<Servicio>("CREMACION");
  const [modalidad, setModalidad] = useState<Modalidad>("PRESENCIAL");
  const [canal, setCanal] = useState<"directo" | "veterinaria">("directo");
  const [veterinaria, setVeterinaria] = useState("");
  const [peso, setPeso] = useState("");
  const [plan, setPlan] = useState<PlanId | "">("");
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");
  const [eutanasiaIncluida, setEutanasiaIncluida] = useState(false);
  const [complementoHuella, setComplementoHuella] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esCremacion = servicio === "CREMACION";
  const esDomicilio = modalidad === "DOMICILIO";

  const handleGuardar = () => {
    if (!tutor.trim()) return setError("Escribe el nombre del tutor.");
    if (!telefono.trim()) return setError("Escribe el teléfono del tutor.");
    if (!mascota.trim()) return setError("Escribe el nombre de la mascota.");
    if (canal === "veterinaria" && !veterinaria) return setError("Elige la veterinaria que refiere.");
    if (esDomicilio && !distrito) return setError("Para recojo a domicilio, elige el distrito.");
    const pesoNum = peso.trim() === "" ? undefined : Number(peso);
    if (pesoNum !== undefined && (!Number.isFinite(pesoNum) || pesoNum <= 0)) {
      return setError("El peso debe ser mayor a 0.");
    }
    onGuardar({
      tutor: tutor.trim(),
      telefono: telefono.trim(),
      mascota: mascota.trim(),
      especie,
      pesoKg: pesoNum,
      servicio,
      modalidad,
      plan: esCremacion && plan ? plan : undefined,
      eutanasiaIncluida: esCremacion && eutanasiaIncluida,
      complementoHuella: esCremacion && complementoHuella,
      distrito: esDomicilio ? distrito : undefined,
      direccion: direccion.trim() || undefined,
      canal,
      veterinaria: canal === "veterinaria" ? veterinaria : undefined,
      horaServicio: undefined,
      fechaServicio: undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuevo caso</DialogTitle>
        <DialogDescription>
          Lo mínimo para abrir el caso. El precio, el pago y la agenda se completan después.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nc-tutor">Nombre del tutor</Label>
            <Input id="nc-tutor" value={tutor} onChange={(e) => setTutor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-telefono">Teléfono</Label>
            <Input id="nc-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-mascota">Nombre de la mascota</Label>
            <Input id="nc-mascota" value={mascota} onChange={(e) => setMascota(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-especie">Especie</Label>
            <Select value={especie} onValueChange={setEspecie}>
              <SelectTrigger id="nc-especie" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Canino", "Felino", "Otro"].map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-servicio">Servicio</Label>
            <Select value={servicio} onValueChange={(v) => setServicio(v as Servicio)}>
              <SelectTrigger id="nc-servicio" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SERVICIO_LABEL) as Servicio[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SERVICIO_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-modalidad">Modalidad</Label>
            <Select value={modalidad} onValueChange={(v) => setModalidad(v as Modalidad)}>
              <SelectTrigger id="nc-modalidad" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODALIDAD_LABEL) as Modalidad[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODALIDAD_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nc-canal">Cómo llegó</Label>
            <Select value={canal} onValueChange={(v) => setCanal(v as "directo" | "veterinaria")}>
              <SelectTrigger id="nc-canal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="directo">Directo (WhatsApp)</SelectItem>
                <SelectItem value="veterinaria">Refiere veterinaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canal === "veterinaria" && (
            <div className="space-y-1.5">
              <Label htmlFor="nc-vet">Veterinaria</Label>
              <Select value={veterinaria} onValueChange={setVeterinaria}>
                <SelectTrigger id="nc-vet" className="w-full">
                  <SelectValue placeholder="Elegir" />
                </SelectTrigger>
                <SelectContent>
                  {VETERINARIAS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {esCremacion && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-peso">Peso (kg)</Label>
              <Input id="nc-peso" type="number" min={0} step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
                <SelectTrigger id="nc-plan" className="w-full">
                  <SelectValue placeholder="Por definir" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLAN_NOMBRE) as PlanId[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_NOMBRE[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {esDomicilio && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-distrito">Distrito</Label>
              <Select value={distrito} onValueChange={setDistrito}>
                <SelectTrigger id="nc-distrito" className="w-full">
                  <SelectValue placeholder="Elegir" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRITOS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-direccion">Dirección (opcional)</Label>
              <Input id="nc-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </div>
        )}

        {esCremacion && (
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-brand-500" checked={eutanasiaIncluida} onChange={(e) => setEutanasiaIncluida(e.target.checked)} />
              Incluye eutanasia
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-brand-500" checked={complementoHuella} onChange={(e) => setComplementoHuella(e.target.checked)} />
              Incluye Mi última huella
            </label>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={handleGuardar}>
          Abrir caso
        </Button>
      </DialogFooter>
    </>
  );
}
