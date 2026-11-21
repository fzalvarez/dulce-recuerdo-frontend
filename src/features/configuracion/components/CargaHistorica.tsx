import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ejecutar } from "@/shared/utils/ejecutar";
import { cargarHistorico, type ArchivosCarga, type ResumenCarga } from "../historico";

const CAMPOS: { clave: keyof ArchivosCarga; titulo: string; ayuda: string }[] = [
  { clave: "casos", titulo: "Casos limpios", ayuda: "listos_para_subir.csv" },
  { clave: "pagos2024", titulo: "Pagos 2024", ayuda: "pagos_2024.csv" },
  { clave: "pagos2025", titulo: "Pagos 2025", ayuda: "pagos_2025.csv" },
  { clave: "veterinarias", titulo: "Veterinarias", ayuda: "veterinarias_mapeo.csv" },
];

/** Carga de ventas históricas 2024–2025: primero se prueba (no escribe), luego se carga. Solo admin. */
export function CargaHistorica() {
  const [archivos, setArchivos] = useState<Partial<ArchivosCarga>>({});
  const [prueba, setPrueba] = useState<ResumenCarga | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<ResumenCarga | null>(null);

  const completos = CAMPOS.every((c) => archivos[c.clave]);

  const elegir = (clave: keyof ArchivosCarga, archivo: File | undefined) => {
    setArchivos((a) => ({ ...a, [clave]: archivo }));
    // Si cambian los archivos, la prueba anterior ya no sirve.
    setPrueba(null);
    setResultado(null);
    setConfirmando(false);
  };

  const ejecutarCarga = async (aplicar: boolean) => {
    if (!completos) return;
    setTrabajando(true);
    let respuesta: ResumenCarga | null = null;
    const ok = await ejecutar(
      async () => {
        respuesta = await cargarHistorico(archivos as ArchivosCarga, aplicar);
      },
      aplicar ? "Carga histórica terminada." : "Prueba terminada: revisa el resumen.",
      aplicar ? "No se pudo cargar. Nada se guardó." : "No se pudo probar la carga."
    );
    setTrabajando(false);
    setConfirmando(false);
    if (ok && respuesta) {
      if (aplicar) setResultado(respuesta);
      else setPrueba(respuesta);
    }
  };

  const resumen = resultado ?? prueba;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-white/10 p-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Ventas históricas 2024–2025</h2>
        <p className="text-sm text-slate-500">
          Sube los cuatro archivos limpios. Primero prueba: no escribe nada y muestra el resumen. Solo después
          carga en la base. Cargar dos veces no duplica casos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAMPOS.map((c) => (
          <div key={c.clave} className="space-y-1">
            <Label htmlFor={`hist-${c.clave}`} className="text-xs">
              {c.titulo} <span className="text-slate-400">({c.ayuda})</span>
            </Label>
            <input
              id={`hist-${c.clave}`}
              type="file"
              accept=".csv,text/csv"
              disabled={trabajando}
              onChange={(e) => elegir(c.clave, e.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm dark:text-slate-300"
            />
            {archivos[c.clave] && <p className="text-[11px] text-slate-500">Listo: {archivos[c.clave]?.name}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => ejecutarCarga(false)} disabled={!completos || trabajando}>
          {trabajando && !confirmando ? "Probando…" : "1. Probar (no escribe)"}
        </Button>
        {prueba && !resultado && !confirmando && (
          <Button variant="operational" onClick={() => setConfirmando(true)} disabled={trabajando}>
            2. Cargar en la base
          </Button>
        )}
        {confirmando && (
          <>
            <span className="text-sm text-slate-700">¿Cargar {prueba?.contadores.casos_creados ?? 0} casos en la base?</span>
            <Button variant="operational" onClick={() => ejecutarCarga(true)} disabled={trabajando}>
              {trabajando ? "Cargando…" : "Sí, cargar"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)} disabled={trabajando}>
              Cancelar
            </Button>
          </>
        )}
      </div>

      {resumen && (
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-white/5 p-3 text-xs text-slate-700 dark:text-slate-200">
          {resumen.lineas.join("\n")}
        </pre>
      )}
    </div>
  );
}
