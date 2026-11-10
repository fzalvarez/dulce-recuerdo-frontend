import { useState } from "react";
import { SearchIcon } from "lucide-react";
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
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import * as casosApi from "../api";
import type { Calculo, Cliente, Mascota, MetodoPago, Modalidad, Opciones, Servicio } from "../types";
import {
  combinarFechaHora,
  hoyISO,
  METODO_LABEL,
  MODALIDAD_LABEL,
  montoValido,
  SERVICIO_LABEL,
  soles,
} from "../utils/casos";
import { ejecutar } from "@/shared/utils/ejecutar";
import { Modal } from "./Dialogos";

export function NuevoCasoDialog({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreado: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} ancho="sm:max-w-4xl">
      {open && <NuevoCasoCarga onCerrar={() => onOpenChange(false)} onCreado={onCreado} />}
    </Modal>
  );
}

function NuevoCasoCarga({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: () => void }) {
  const opciones = useRecurso(casosApi.opciones);
  if (opciones.error) return <p className="text-sm text-red-600">{opciones.error}</p>;
  if (!opciones.data) return <p className="text-sm text-slate-500">Cargando opciones…</p>;
  return <NuevoCasoForm opciones={opciones.data} onCerrar={onCerrar} onCreado={onCreado} />;
}

function Campo({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Opcion<T extends string>({
  id,
  value,
  onChange,
  items,
  placeholder,
}: {
  id: string;
  value: T | "";
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder ?? "Elegir"} />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 dark:border-white/10 p-4">
      <h3 className="text-label font-semibold uppercase tracking-wider text-slate-500">{titulo}</h3>
      {children}
    </section>
  );
}

function NuevoCasoForm({ opciones, onCerrar, onCreado }: { opciones: Opciones; onCerrar: () => void; onCreado: () => void }) {
  // Ficha
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Cliente[] | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaId, setMascotaId] = useState<string>("");
  const [nuevoTutor, setNuevoTutor] = useState({ nombre: "", telefono: "", dni: "" });
  const [nuevaMascota, setNuevaMascota] = useState({ nombre: "", especie: "Canino" });
  const crearTutor = cliente === null && resultados !== null;
  const crearMascota = crearTutor || mascotaId === "nueva";

  // Servicio
  const [servicio, setServicio] = useState<Servicio>("CREMACION");
  const [modalidad, setModalidad] = useState<Modalidad>("PRESENCIAL");
  const [planId, setPlanId] = useState("");
  const [peso, setPeso] = useState("");
  const [eutanasia, setEutanasia] = useState(false);
  const [complementos, setComplementos] = useState<string[]>([]);
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");
  const [canal, setCanal] = useState<"directo" | "veterinaria">("directo");
  const [vetId, setVetId] = useState("");

  // Agenda, precio y pago
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [calculo, setCalculo] = useState<Calculo | null>(null);
  const [ajuste, setAjuste] = useState({ precio: "", motivo: "" });
  const [pago, setPago] = useState<{ monto: string; metodo: MetodoPago }>({ monto: "", metodo: "YAPE" });

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const esCremacion = servicio === "CREMACION";
  const esDomicilio = modalidad === "DOMICILIO";
  const esVet = canal === "veterinaria";

  const buscar = async () => {
    setError(null);
    try {
      setResultados(await casosApi.buscarClientes(q.trim()));
      setCliente(null);
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo buscar."));
    }
  };

  const elegirCliente = async (c: Cliente) => {
    setCliente(c);
    setMascotaId("");
    try {
      const lista = await casosApi.mascotasDe(c.id);
      setMascotas(lista);
      setMascotaId(lista.length === 1 ? lista[0].id : lista.length === 0 ? "nueva" : "");
      if (lista.length === 1 && lista[0].peso_kg) setPeso(String(lista[0].peso_kg));
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudieron cargar las mascotas."));
    }
  };

  const datosServicio = (): casosApi.DatosServicio | string => {
    const pesoNum = Number(peso);
    if (!Number.isFinite(pesoNum) || pesoNum <= 0) return "Indica el peso de la mascota.";
    if (esCremacion && !planId) return "Elige el plan.";
    if (esDomicilio && !distrito) return "Para domicilio, elige el distrito.";
    if (esVet && !vetId) return "Elige la veterinaria que refiere.";
    return {
      servicio,
      plan_id: esCremacion ? planId : null,
      peso_kg: pesoNum,
      eutanasia_incluida: esCremacion && eutanasia,
      complementos,
      modalidad,
      veterinaria_id: esVet ? vetId : null,
    };
  };

  const calcularPrecio = async () => {
    const d = datosServicio();
    if (typeof d === "string") return setError(d);
    setError(null);
    try {
      setCalculo(await casosApi.calcular({ ...d, distrito: esDomicilio ? distrito : undefined, hora: hora || undefined }));
    } catch (e) {
      setCalculo(null);
      setError(getApiErrorMessage(e, "No se pudo calcular el precio."));
    }
  };

  const guardar = async () => {
    // Validaciones antes de tocar la API.
    if (crearTutor && (!nuevoTutor.nombre.trim() || !nuevoTutor.telefono.trim())) {
      return setError("Escribe el nombre y el teléfono del tutor.");
    }
    if (!crearTutor && !cliente) return setError("Busca y elige al tutor, o regístralo.");
    if (crearMascota && !nuevaMascota.nombre.trim()) return setError("Escribe el nombre de la mascota.");
    if (!crearMascota && !mascotaId) return setError("Elige la mascota.");
    const d = datosServicio();
    if (typeof d === "string") return setError(d);
    if (esDomicilio && !direccion.trim()) return setError("Para domicilio, escribe la dirección.");
    if (!fecha || !hora) return setError("Indica la fecha y la hora del servicio.");
    const dur = Number(duracion);
    if (!Number.isInteger(dur) || dur <= 0) return setError("La duración debe ser un número de minutos.");
    let pagoInicial: { monto: string; metodo: MetodoPago } | null = null;
    if (pago.monto.trim()) {
      const m = montoValido(pago.monto);
      if (!m) return setError("El pago inicial debe ser mayor a 0.");
      pagoInicial = { monto: m, metodo: pago.metodo };
    } else if (!esVet) {
      return setError("Para agendar hace falta un pago, total o parcial.");
    }
    let precioAjustado: string | undefined;
    if (ajuste.precio.trim()) {
      const p = montoValido(ajuste.precio, { permitirCero: true });
      if (p === null) return setError("El precio ajustado no es válido.");
      if (!ajuste.motivo.trim()) return setError("Indica el motivo del ajuste de precio.");
      precioAjustado = p;
    }

    setError(null);
    setGuardando(true);
    const ok = await ejecutar(
      async () => {
        let clienteId = cliente?.id;
        if (crearTutor) {
          clienteId = (
            await casosApi.crearCliente({
              nombre_completo: nuevoTutor.nombre.trim(),
              telefono: nuevoTutor.telefono.trim(),
              dni: nuevoTutor.dni.trim() || undefined,
            })
          ).id;
        }
        let mascotaFinal = mascotaId;
        if (crearMascota) {
          mascotaFinal = (
            await casosApi.crearMascota({
              cliente_id: clienteId!,
              nombre: nuevaMascota.nombre.trim(),
              especie: nuevaMascota.especie,
              peso_kg: d.peso_kg,
            })
          ).id;
        }
        await casosApi.registrar({
          ...d,
          cliente_id: clienteId!,
          mascota_id: mascotaFinal,
          canal_origen: esVet ? "VETERINARIA_REFERIDORA" : "CLIENTE_DIRECTO",
          direccion_origen: direccion.trim() || undefined,
          distrito_origen: distrito || undefined,
          inicio: combinarFechaHora(fecha, hora),
          duracion_minutos: dur,
          pago_inicial: pagoInicial,
          precio_ajustado: precioAjustado,
          motivo_ajuste: precioAjustado ? ajuste.motivo.trim() : undefined,
        });
      },
      "Caso registrado y agendado.",
      "No se pudo registrar el caso."
    );
    setGuardando(false);
    if (ok) {
      onCreado();
      onCerrar();
    }
  };

  const vetSeleccionada = opciones.veterinarias.find((v) => v.id === vetId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuevo caso</DialogTitle>
        <DialogDescription>
          Registra un servicio contratado: ficha, servicio, fecha y pago inicial. El precio lo calcula el sistema.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <Seccion titulo="Tutor y mascota">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Tutor</span>
              {!cliente && (
                <div className="flex gap-2">
                  <Input
                    aria-label="Buscar tutor"
                    placeholder="DNI, nombre del tutor o de la mascota"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        buscar();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={buscar}>
                    <SearchIcon className="size-4" />
                    Buscar
                  </Button>
                </div>
              )}

              {!cliente && resultados && resultados.length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 dark:border-white/10 max-h-40 overflow-y-auto">
                  {resultados.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5" onClick={() => elegirCliente(c)}>
                        <span className="font-medium">{c.nombre_completo}</span>
                        <span className="text-xs text-slate-500"> · {c.telefono}{c.dni ? ` · DNI ${c.dni}` : ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {cliente && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-white/10 px-3 py-2 text-sm">
                  <span>
                    <strong>{cliente.nombre_completo}</strong> · {cliente.telefono}
                    {cliente.dni ? ` · DNI ${cliente.dni}` : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setCliente(null); setMascotas([]); setMascotaId(""); }}>
                    Cambiar
                  </Button>
                </div>
              )}

              {crearTutor && (
                <>
                  <p className="text-xs text-slate-500">
                    {resultados?.length ? "¿No está en la lista? Regístralo:" : "Sin resultados. Registra al tutor:"}
                  </p>
                  <Campo id="nt-nombre" label="Nombre completo">
                    <Input id="nt-nombre" value={nuevoTutor.nombre} onChange={(e) => setNuevoTutor((t) => ({ ...t, nombre: e.target.value }))} />
                  </Campo>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo id="nt-tel" label="Teléfono">
                      <Input id="nt-tel" value={nuevoTutor.telefono} onChange={(e) => setNuevoTutor((t) => ({ ...t, telefono: e.target.value }))} />
                    </Campo>
                    <Campo id="nt-dni" label="DNI (opcional)">
                      <Input id="nt-dni" value={nuevoTutor.dni} onChange={(e) => setNuevoTutor((t) => ({ ...t, dni: e.target.value }))} />
                    </Campo>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Mascota</span>
              {!cliente && !crearTutor && (
                <p className="text-xs text-slate-500">Primero busca al tutor: la mascota se elige de su ficha o se registra.</p>
              )}

              {cliente && mascotas.length > 0 && (
                <Opcion
                  id="nc-mascota"
                  value={mascotaId}
                  onChange={setMascotaId}
                  placeholder="Elegir mascota"
                  items={[
                    ...mascotas.map((m) => ({ value: m.id, label: `${m.nombre} · ${m.especie}` })),
                    { value: "nueva", label: "Otra mascota (registrar)" },
                  ]}
                />
              )}

              {(crearTutor || (cliente && crearMascota)) && (
                <div className="grid grid-cols-2 gap-3">
                  <Campo id="nm-nombre" label="Nombre">
                    <Input id="nm-nombre" value={nuevaMascota.nombre} onChange={(e) => setNuevaMascota((m) => ({ ...m, nombre: e.target.value }))} />
                  </Campo>
                  <Campo id="nm-especie" label="Especie">
                    <Opcion
                      id="nm-especie"
                      value={nuevaMascota.especie}
                      onChange={(v) => setNuevaMascota((m) => ({ ...m, especie: v }))}
                      items={["Canino", "Felino", "Otro"].map((e) => ({ value: e, label: e }))}
                    />
                  </Campo>
                </div>
              )}
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Servicio">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Campo id="nc-servicio" label="Servicio">
              <Opcion
                id="nc-servicio"
                value={servicio}
                onChange={(v) => { setServicio(v); setCalculo(null); }}
                items={(Object.keys(SERVICIO_LABEL) as Servicio[]).map((s) => ({ value: s, label: SERVICIO_LABEL[s] }))}
              />
            </Campo>
            <Campo id="nc-modalidad" label="Modalidad">
              <Opcion
                id="nc-modalidad"
                value={modalidad}
                onChange={(v) => { setModalidad(v); setCalculo(null); }}
                items={(Object.keys(MODALIDAD_LABEL) as Modalidad[]).map((m) => ({ value: m, label: MODALIDAD_LABEL[m] }))}
              />
            </Campo>
            <Campo id="nc-peso" label="Peso (kg)">
              <Input id="nc-peso" type="number" min={0} step="0.1" value={peso} onChange={(e) => { setPeso(e.target.value); setCalculo(null); }} />
            </Campo>
            {esCremacion && (
              <Campo id="nc-plan" label="Plan">
                <Opcion
                  id="nc-plan"
                  value={planId}
                  onChange={(v) => { setPlanId(v); setCalculo(null); }}
                  items={opciones.planes.map((p) => ({ value: p.id, label: p.nombre }))}
                  placeholder={opciones.planes.length ? "Elegir" : "No hay planes activos"}
                />
              </Campo>
            )}
          </div>

          {(esCremacion || opciones.complementos.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
              {esCremacion && (
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="size-4 accent-brand-500" checked={eutanasia} onChange={(e) => { setEutanasia(e.target.checked); setCalculo(null); }} />
                  Incluye eutanasia
                </label>
              )}
              {opciones.complementos.map((c) => (
                <label key={c.id} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-500"
                    checked={complementos.includes(c.id)}
                    onChange={(e) => {
                      setComplementos((l) => (e.target.checked ? [...l, c.id] : l.filter((x) => x !== c.id)));
                      setCalculo(null);
                    }}
                  />
                  {c.nombre} ({soles(c.precio)})
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-3">
              <Campo id="nc-distrito" label={esDomicilio ? "Distrito" : "Distrito (opcional)"}>
                <Opcion
                  id="nc-distrito"
                  value={distrito}
                  onChange={(v) => { setDistrito(v); setCalculo(null); }}
                  items={opciones.distritos.map((d) => ({ value: d, label: d }))}
                  placeholder={opciones.distritos.length ? "Elegir" : "Sin zonas configuradas"}
                />
              </Campo>
              {esDomicilio && (
                <Campo id="nc-direccion" label="Dirección">
                  <Input id="nc-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </Campo>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Campo id="nc-canal" label="Cómo llegó">
                <Opcion
                  id="nc-canal"
                  value={canal}
                  onChange={(v) => { setCanal(v); setCalculo(null); }}
                  items={[
                    { value: "directo", label: "Directo (WhatsApp)" },
                    { value: "veterinaria", label: "Refiere veterinaria" },
                  ]}
                />
              </Campo>
              {esVet && (
                <Campo id="nc-vet" label="Veterinaria">
                  <Opcion
                    id="nc-vet"
                    value={vetId}
                    onChange={(v) => { setVetId(v); setCalculo(null); }}
                    items={opciones.veterinarias.map((v) => ({ value: v.id, label: v.nombre }))}
                  />
                </Campo>
              )}
              {vetSeleccionada && !vetSeleccionada.tiene_convenio && (
                <p className="text-xs text-amber-700">Esta veterinaria no tiene tipo de convenio: el precio no se podrá calcular.</p>
              )}
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Fecha y hora">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo id="nc-fecha" label="Fecha">
              <DatePicker id="nc-fecha" value={fecha} onChange={setFecha} />
            </Campo>
            <Campo id="nc-hora" label="Hora">
              <Input id="nc-hora" type="time" value={hora} onChange={(e) => { setHora(e.target.value); setCalculo(null); }} />
            </Campo>
            <Campo id="nc-duracion" label="Duración (min)">
              <Input id="nc-duracion" type="number" min={15} step={15} value={duracion} onChange={(e) => setDuracion(e.target.value)} />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Precio y pago">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] items-end gap-3">
            <Button variant="outline" onClick={calcularPrecio}>
              Calcular precio
            </Button>
            <Campo id="nc-ajuste" label="Precio a mano (opcional)">
              <Input id="nc-ajuste" type="number" min={0} step="0.01" value={ajuste.precio} onChange={(e) => setAjuste((a) => ({ ...a, precio: e.target.value }))} />
            </Campo>
            <Campo id="nc-motivo" label="Motivo del ajuste">
              <Input
                id="nc-motivo"
                value={ajuste.motivo}
                disabled={ajuste.precio.trim() === ""}
                placeholder={ajuste.precio.trim() === "" ? "Solo si pones precio a mano" : ""}
                onChange={(e) => setAjuste((a) => ({ ...a, motivo: e.target.value }))}
              />
            </Campo>
          </div>
          {calculo && (
            <div className="text-sm">
              {calculo.lineas.map((l) => (
                <div key={l.concepto} className="flex justify-between py-0.5">
                  <span className="text-slate-500">{l.concepto}</span>
                  <span>{soles(l.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 dark:border-white/10 mt-1 pt-1 font-semibold">
                <span>Total</span>
                <span>{soles(calculo.total)}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo id="nc-pago" label={esVet ? "Pago inicial (opcional: paga la veterinaria)" : "Pago inicial (S/)"}>
              <Input id="nc-pago" type="number" min={0} step="0.01" value={pago.monto} onChange={(e) => setPago((p) => ({ ...p, monto: e.target.value }))} />
            </Campo>
            <Campo id="nc-metodo" label="Forma de pago">
              <Opcion
                id="nc-metodo"
                value={pago.metodo}
                onChange={(v) => setPago((p) => ({ ...p, metodo: v }))}
                items={(Object.keys(METODO_LABEL) as MetodoPago[]).map((m) => ({ value: m, label: METODO_LABEL[m] }))}
              />
            </Campo>
          </div>
        </Seccion>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={guardar} disabled={guardando}>
          {guardando ? "Registrando…" : "Registrar caso"}
        </Button>
      </DialogFooter>
    </>
  );
}
