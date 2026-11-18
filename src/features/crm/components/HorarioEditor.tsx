import { CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DIAS, type HorarioDia } from "../api";
import { DIA_CORTO } from "../utils/formato";

type Estado = HorarioDia["estado"];

const semana = (f: (dia: (typeof DIAS)[number], i: number) => Omit<HorarioDia, "dia">): HorarioDia[] =>
  DIAS.map((dia, i) => ({ dia, ...f(dia, i) }));

const abierto = (abre: string, cierra: string) => ({ estado: "ABIERTO" as const, abre, cierra });
const cerrado = { estado: "CERRADO" as const, abre: null, cierra: null };

const ATAJOS: { label: string; horario: () => HorarioDia[] }[] = [
  { label: "Lun–Sáb 9–19 · Dom cerrado", horario: () => semana((_, i) => (i < 6 ? abierto("09:00", "19:00") : cerrado)) },
  {
    label: "Lun–Vie 9–18 · Sáb 9–13",
    horario: () => semana((_, i) => (i < 5 ? abierto("09:00", "18:00") : i === 5 ? abierto("09:00", "13:00") : cerrado)),
  },
  { label: "Todos 9–20", horario: () => semana(() => abierto("09:00", "20:00")) },
  { label: "24 h todos los días", horario: () => semana(() => ({ estado: "24H", abre: null, cierra: null })) },
];

const ESTADOS: { value: Estado; label: string }[] = [
  { value: "ABIERTO", label: "Abre" },
  { value: "24H", label: "24 h" },
  { value: "CERRADO", label: "Cerrado" },
];

/**
 * Horario por día (spec crm-veterinarias, R13). `null` = sin publicar / por confirmar.
 * Atajos para los casos comunes y "copiar el lunes" para no repetir.
 */
export function HorarioEditor({ value, onChange }: { value: HorarioDia[] | null; onChange: (h: HorarioDia[] | null) => void }) {
  const cambiarDia = (i: number, cambio: Partial<HorarioDia>) => {
    if (!value) return;
    onChange(
      value.map((d, j) => {
        if (j !== i) return d;
        const nuevo = { ...d, ...cambio };
        if (nuevo.estado !== "ABIERTO") return { ...nuevo, abre: null, cierra: null };
        return { ...nuevo, abre: nuevo.abre ?? "09:00", cierra: nuevo.cierra ?? "19:00" };
      })
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ATAJOS.map((a) => (
          <Button key={a.label} type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange(a.horario())}>
            {a.label}
          </Button>
        ))}
        <Button
          type="button"
          variant={value ? "ghost" : "outline"}
          size="sm"
          className={cn("h-7 px-2 text-xs", !value && "border-brand-500 bg-brand-50 text-brand-700")}
          onClick={() => onChange(null)}
        >
          Sin publicar
        </Button>
      </div>

      {value ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
          {value.map((d, i) => (
            <div key={d.dia} className="flex items-center gap-1.5">
              <span className="w-8 text-xs font-medium text-slate-600">{DIA_CORTO[d.dia]}</span>
              <div className="flex overflow-hidden rounded-md border border-slate-200">
                {ESTADOS.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => cambiarDia(i, { estado: e.value })}
                    className={cn(
                      "px-1.5 py-1 text-[11px] font-medium",
                      d.estado === e.value ? "bg-brand-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {d.estado === "ABIERTO" && (
                <>
                  <Input type="time" value={d.abre ?? ""} onChange={(e) => cambiarDia(i, { abre: e.target.value })} className="h-7 w-22 px-1.5 text-xs" />
                  <span className="text-xs text-slate-400">a</span>
                  <Input type="time" value={d.cierra ?? ""} onChange={(e) => cambiarDia(i, { cierra: e.target.value })} className="h-7 w-22 px-1.5 text-xs" />
                </>
              )}
              {i === 0 && (
                <button
                  type="button"
                  title="Copiar el lunes a todos los días"
                  className="ml-auto text-slate-400 hover:text-brand-600"
                  onClick={() => onChange(value.map((x) => ({ ...value[0], dia: x.dia })))}
                >
                  <CopyIcon className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Sin horario publicado. Elige un atajo para empezar y ajusta cada día.</p>
      )}
    </div>
  );
}
