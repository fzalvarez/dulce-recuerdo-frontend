import { useMemo } from "react";

export interface Parte {
  etiqueta: string;
  valor: number;
  /** Valor CSS, ej. "var(--serie-1)". */
  color: string;
}

/** Dona: muestra cómo se reparte un total. Separación de 1,5 px entre partes. */
export function Dona({ partes, centro, subcentro }: { partes: Parte[]; centro: string; subcentro?: string }) {
  const total = partes.reduce((acc, p) => acc + p.valor, 0);
  const radio = 42;
  const longitud = 2 * Math.PI * radio;

  const segmentos = useMemo(() => {
    const tramos = partes.map((p) => (total > 0 ? (p.valor / total) * longitud : 0));
    const inicios = tramos.map((_, i) => tramos.slice(0, i).reduce((acc, t) => acc + t, 0));
    return partes.map((p, i) => ({ ...p, dash: Math.max(0, tramos[i] - 1.5), offset: -inicios[i] }));
  }, [partes, total, longitud]);

  return (
    <div className="relative w-36 h-36 shrink-0" role="img" aria-label={`${centro}. ${partes.map((p) => `${p.etiqueta} ${p.valor}`).join(", ")}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="var(--grid)" strokeWidth="12" />
        {total > 0 &&
          segmentos.map((s) => (
            <circle
              key={s.etiqueta}
              cx="50"
              cy="50"
              r={radio}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${s.dash} ${longitud}`}
              strokeDashoffset={s.offset}
            />
          ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-[var(--ink)] tabular-nums leading-none">{centro}</span>
        {subcentro && <span className="text-[11px] text-[var(--ink-2)] mt-1">{subcentro}</span>}
      </div>
    </div>
  );
}

/** Leyenda de una dona o de una barra segmentada: color, nombre y valor con su porcentaje. */
export function Leyenda({ partes }: { partes: Parte[] }) {
  const total = partes.reduce((acc, p) => acc + p.valor, 0);
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {partes.map((p) => (
        <li key={p.etiqueta} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} aria-hidden />
          <span className="text-[var(--ink-2)] flex-1">{p.etiqueta}</span>
          <span className="font-semibold text-[var(--ink)] tabular-nums">{p.valor}</span>
          <span className="text-xs text-[var(--muted)] tabular-nums w-12 text-right">
            {total > 0 ? `${Math.round((p.valor / total) * 100)}%` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Barra segmentada: un solo total dividido en partes. Sin números dentro: la leyenda los da. */
export function BarraSegmentada({ partes }: { partes: Parte[] }) {
  const total = partes.reduce((acc, p) => acc + p.valor, 0);
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--grid)]" role="img" aria-label={partes.map((p) => `${p.etiqueta} ${p.valor}`).join(", ")}>
      {total > 0 &&
        partes.map((p) => (
          <div key={p.etiqueta} className="h-full" style={{ width: `${(p.valor / total) * 100}%`, background: p.color }} />
        ))}
    </div>
  );
}

/** Líneas diarias: este mes contra el mismo tramo del mes anterior. Puntos finales de 8 px. */
export function LineasDiarias({
  actual,
  previo,
  etiquetaActual,
  etiquetaPrevio,
}: {
  actual: number[];
  previo: number[];
  etiquetaActual: string;
  etiquetaPrevio: string;
}) {
  const ancho = 300;
  const alto = 120;
  const pad = 8;
  const n = Math.max(actual.length, 2);
  const max = Math.max(1, ...actual, ...previo);

  const punto = (valor: number, i: number) => {
    const x = pad + (i * (ancho - 2 * pad)) / (n - 1);
    const y = alto - pad - (valor / max) * (alto - 2 * pad);
    return { x, y };
  };
  const trazo = (serie: number[]) => serie.map((v, i) => punto(v, i)).map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const ultimo = (serie: number[]) => (serie.length ? punto(serie[serie.length - 1], serie.length - 1) : null);

  const pa = ultimo(actual);
  const pp = ultimo(previo);

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-auto" role="img" aria-label={`${etiquetaActual} frente a ${etiquetaPrevio}`}>
        <line x1={pad} x2={ancho - pad} y1={alto - pad} y2={alto - pad} stroke="var(--baseline)" strokeWidth="1" />
        <line x1={pad} x2={ancho - pad} y1={pad} y2={pad} stroke="var(--grid)" strokeWidth="1" />
        <path d={trazo(previo)} fill="none" stroke="var(--serie-2)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={trazo(actual)} fill="none" stroke="var(--serie-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pp && <circle cx={pp.x} cy={pp.y} r="4" fill="var(--serie-2)" stroke="var(--surface)" strokeWidth="2" />}
        {pa && <circle cx={pa.x} cy={pa.y} r="4" fill="var(--serie-1)" stroke="var(--surface)" strokeWidth="2" />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-2)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--serie-1)" }} aria-hidden />
          {etiquetaActual}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--serie-2)" }} aria-hidden />
          {etiquetaPrevio}
        </span>
      </div>
    </div>
  );
}
