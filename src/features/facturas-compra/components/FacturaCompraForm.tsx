import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BotonesOpcion } from "@/shared/components/common/BotonesOpcion";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { notifyError } from "@/shared/utils";
import { fechaCorta, hoyISO, soles } from "@/features/casos/utils/casos";
import { CATEGORIA_LABEL, type CategoriaGasto } from "@/features/finanzas/types";
import {
  abrirAdjunto,
  crearFactura,
  editarFactura,
  listarGastosRecientes,
  quitarAdjunto,
  subirAdjunto,
  TAMANO_ADJUNTO_MAX,
  TIPOS_ADJUNTO,
  type FacturaCompra,
} from "../api";

type Vinculo = "ninguno" | "nuevo" | "existente";

/** Alta y edición de una factura de compra, con su archivo (PDF o foto) adjunto. */
export function FacturaCompraForm({
  factura,
  onCerrar,
  onHecho,
}: {
  factura: FacturaCompra | null;
  onCerrar: () => void;
  onHecho: () => void;
}) {
  const [f, setF] = useState({
    numero_serie: factura?.numero_serie ?? "",
    fecha: factura?.fecha ?? hoyISO(),
    ruc_proveedor: factura?.ruc_proveedor ?? "",
    razon_social: factura?.razon_social ?? "",
    concepto: factura?.concepto ?? "",
    total: factura?.total ?? "",
    igv: factura?.igv ?? "",
  });
  const [vinculo, setVinculo] = useState<Vinculo>("ninguno");
  const [categoria, setCategoria] = useState<CategoriaGasto>("COMPRAS_VARIAS");
  const [gastoId, setGastoId] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [quitarArchivo, setQuitarArchivo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Gastos recientes: solo se usan si se vincula uno existente.
  const gastos = useRecurso(listarGastosRecientes, [factura?.id ?? "nueva"]);

  const campo = (k: keyof typeof f, valor: string) => setF((x) => ({ ...x, [k]: valor }));

  const validar = (): string | null => {
    if (!f.numero_serie.trim()) return "Escribe el número de serie, por ejemplo F001-00012345.";
    if (!/^\d{11}$/.test(f.ruc_proveedor.trim())) return "El RUC debe tener 11 números.";
    if (!f.razon_social.trim()) return "Escribe la razón social del proveedor.";
    if (!f.concepto.trim()) return "Escribe el concepto de la compra.";
    const total = Number(f.total);
    const igv = Number(f.igv);
    if (!(total > 0)) return "El total debe ser mayor que cero.";
    if (!(igv >= 0) || igv > total) return "El IGV no puede ser negativo ni mayor que el total.";
    if (vinculo === "existente" && !gastoId) return "Elige el gasto a vincular.";
    if (archivo) {
      if (!(TIPOS_ADJUNTO as readonly string[]).includes(archivo.type)) return "El archivo debe ser PDF, JPG, PNG o WEBP.";
      if (archivo.size > TAMANO_ADJUNTO_MAX) return "El archivo supera los 5 MB.";
    }
    return null;
  };

  const guardar = async () => {
    const aviso = validar();
    if (aviso) return setError(aviso);
    setError(null);
    setGuardando(true);
    const cuerpo = {
      numero_serie: f.numero_serie.trim(),
      fecha: f.fecha,
      ruc_proveedor: f.ruc_proveedor.trim(),
      razon_social: f.razon_social.trim(),
      concepto: f.concepto.trim(),
      total: Number(f.total).toFixed(2),
      igv: Number(f.igv).toFixed(2),
    };
    let idFactura = factura?.id ?? null;
    try {
      if (factura) {
        await editarFactura(factura.id, cuerpo);
      } else {
        const creada = await crearFactura({
          ...cuerpo,
          gasto_id: vinculo === "existente" ? gastoId : null,
          crear_gasto_categoria: vinculo === "nuevo" ? categoria : null,
        });
        idFactura = creada.id;
      }
    } catch (e) {
      setGuardando(false);
      return notifyError(getApiErrorMessage(e, "No se pudo guardar la factura."));
    }
    // La factura ya está guardada: el archivo se sube o se quita aparte.
    const idGuardada = idFactura;
    if (idGuardada && archivo) {
      await ejecutar(() => subirAdjunto(idGuardada, archivo), "Archivo adjuntado.", "La factura se guardó, pero no se pudo adjuntar el archivo.");
    } else if (factura && quitarArchivo && factura.tiene_adjunto) {
      await ejecutar(() => quitarAdjunto(factura.id), "Archivo quitado.", "No se pudo quitar el archivo.");
    }
    setGuardando(false);
    onHecho();
  };

  const verArchivo = async () => {
    if (!factura) return;
    try {
      await abrirAdjunto(factura.id);
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudo abrir el archivo."));
    }
  };

  const archivoActual = factura?.tiene_adjunto && !quitarArchivo && !archivo;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{factura ? "Editar factura de compra" : "Nueva factura de compra"}</DialogTitle>
        <DialogDescription>Registra el comprobante del proveedor y su archivo. Los montos incluyen IGV.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fc-serie">N.º de serie</Label>
          <Input id="fc-serie" value={f.numero_serie} onChange={(e) => campo("numero_serie", e.target.value)} placeholder="F001-00012345" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fc-fecha">Fecha</Label>
          <DatePicker id="fc-fecha" value={f.fecha} onChange={(v) => campo("fecha", v)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fc-ruc">RUC del proveedor</Label>
          <Input id="fc-ruc" inputMode="numeric" maxLength={11} value={f.ruc_proveedor} onChange={(e) => campo("ruc_proveedor", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fc-razon">Razón social</Label>
          <Input id="fc-razon" value={f.razon_social} onChange={(e) => campo("razon_social", e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fc-concepto">Concepto</Label>
          <Input id="fc-concepto" value={f.concepto} onChange={(e) => campo("concepto", e.target.value)} placeholder="Papel higiénico, guantes y desinfectante" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fc-total">Total (S/, con IGV)</Label>
          <Input id="fc-total" type="number" min={0} step="0.01" value={f.total} onChange={(e) => campo("total", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fc-igv">IGV (S/)</Label>
          <Input id="fc-igv" type="number" min={0} step="0.01" value={f.igv} onChange={(e) => campo("igv", e.target.value)} />
        </div>
      </div>

      {/* Gasto: al crear se elige; al editar se muestra el vínculo que ya tiene. */}
      <div className="space-y-2 rounded-lg border border-slate-200 dark:border-white/10 p-3">
        <Label className="text-xs">Gasto</Label>
        {factura ? (
          <p className="text-sm text-slate-600">{factura.gasto_id ? "Vinculada a un gasto registrado." : "Sin gasto vinculado."}</p>
        ) : (
          <>
            <BotonesOpcion<Vinculo>
              ariaLabel="Gasto de la factura"
              value={vinculo}
              onChange={setVinculo}
              columnas="grid-cols-3"
              opciones={[
                { value: "ninguno", label: "Sin gasto" },
                { value: "nuevo", label: "Crear gasto" },
                { value: "existente", label: "Vincular existente" },
              ]}
            />
            {vinculo === "nuevo" && (
              <div className="space-y-1.5">
                <Label htmlFor="fc-categoria">Categoría del gasto</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaGasto)}>
                  <SelectTrigger id="fc-categoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORIA_LABEL) as CategoriaGasto[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">El gasto se crea con el total y la fecha de la factura.</p>
              </div>
            )}
            {vinculo === "existente" && (
              <div className="space-y-1.5">
                <Label htmlFor="fc-gasto">Gasto</Label>
                <Select value={gastoId} onValueChange={setGastoId}>
                  <SelectTrigger id="fc-gasto" className="w-full">
                    <SelectValue placeholder={gastos.cargando ? "Cargando gastos…" : "Elegir gasto"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(gastos.data ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {fechaCorta(g.fecha)} · {g.concepto} · {soles(g.monto)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {gastos.data?.length === 0 && <p className="text-[11px] text-slate-500">No hay gastos en los últimos 180 días.</p>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Archivo: PDF o foto, máximo 5 MB. */}
      <div className="space-y-2">
        <Label className="text-xs">Archivo de la factura (PDF o foto, máx. 5 MB)</Label>
        {archivoActual && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-white/10 px-3 py-2 text-sm">
            <span className="truncate">{factura?.adjunto_nombre}</span>
            <span className="flex shrink-0 gap-1.5">
              <Button variant="outline" size="sm" onClick={verArchivo}>
                Ver
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setQuitarArchivo(true)}>
                Quitar
              </Button>
            </span>
          </div>
        )}
        {quitarArchivo && (
          <p className="text-xs text-amber-700">
            Se quitará el archivo al guardar.{" "}
            <button type="button" className="underline" onClick={() => setQuitarArchivo(false)}>
              Deshacer
            </button>
          </p>
        )}
        <input
          id="fc-archivo"
          type="file"
          accept={TIPOS_ADJUNTO.join(",")}
          onChange={(e) => {
            setArchivo(e.target.files?.[0] ?? null);
            setQuitarArchivo(false);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm dark:text-slate-300"
        />
        {archivo && <p className="text-xs text-slate-500">Se adjuntará: {archivo.name}</p>}
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
