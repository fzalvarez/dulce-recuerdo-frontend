import { CASOS_EJEMPLO } from "../../reportes/data/casos.mock";
import type { CasoReportable, PlanId } from "../../reportes/types";
import { CASOS_INICIALES } from "../../casos/legacy/casos.mock";
import { ACTIVOS_EJEMPLO } from "../../activos/data/activos.mock";
import type { Caso, EstadoMostrado } from "../../casos/legacy/types";
import { diasEntre, estadoMostrado, estadoPago, calcularPrecio, hoyISO } from "../../casos/legacy/casos";
import { calcularAbastecimiento } from "../../reportes/utils/abastecimiento";
import { calcularVeterinarias } from "../../reportes/utils/rendimientoVeterinarias";
import { calcularOportunidades } from "../../reportes/utils/oportunidades";
import { desplazarMes, rangoDePeso, ventanaMeses } from "../../reportes/utils/reportes";
import { PRECIO_PLAN } from "../../casos/legacy/tarifas";

export type Nivel = "critico" | "atencion" | "info";

export interface Mensaje {
  nivel: Nivel;
  titulo: string;
  detalle: string;
}

export interface Resumen {
  cremaciones: number;
  cobrado: number;
  particulares: number;
  veterinarias: number;
}

const PRECIO_DE = (c: CasoReportable): number =>
  c.plan === "sin-clasificar" || c.pesoKg === undefined ? 0 : PRECIO_PLAN[c.plan][rangoDePeso(c.pesoKg)];

/** Suma cremaciones, cobros y canal de los casos cuya fecha está en [desde, hasta]. */
export function resumenPeriodo(casos: CasoReportable[], desde: string, hasta: string): Resumen {
  const r: Resumen = { cremaciones: 0, cobrado: 0, particulares: 0, veterinarias: 0 };
  for (const c of casos) {
    if (c.fecha >= desde && c.fecha <= hasta) {
      r.cremaciones += 1;
      if (c.canal === "veterinaria") r.veterinarias += 1;
      else r.particulares += 1;
    }
    if (c.fechaCobro >= desde && c.fechaCobro <= hasta) r.cobrado += PRECIO_DE(c);
  }
  return r;
}

/** Cremaciones por día de un mes, desde el día 1 hasta `hasta`, con el mismo tramo del mes anterior. */
export function serieDiaria(casos: CasoReportable[], mes: string, diaHasta: number) {
  const anterior = desplazarMes(mes, -1);
  const contar = (m: string) => {
    const dias = Array.from({ length: diaHasta }, () => 0);
    for (const c of casos) {
      if (c.fecha.slice(0, 7) !== m) continue;
      const d = Number(c.fecha.slice(8, 10));
      if (d >= 1 && d <= diaHasta) dias[d - 1] += 1;
    }
    return dias;
  };
  return { actual: contar(mes), previo: contar(anterior) };
}

function lunesDe(hoy: string): string {
  const d = new Date(`${hoy}T00:00:00`);
  const dia = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dia);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface DatosDashboard {
  hoy: string;
  hoyDia: number;
  diasDelMes: number;
  dia: { agenda: Caso[] };
  semana: { actual: Resumen; previa: Resumen; ini: string; fin: string };
  mes: { actual: Resumen; previo: Resumen; proyeccion: number; serie: { actual: number[]; previo: number[] } };
  pipeline: Record<EstadoMostrado, number>;
  planesMes: { plan: PlanId; cremaciones: number }[];
  mensajes: Mensaje[];
}

export function calcularDashboard(hoy: string = hoyISO()): DatosDashboard {
  const hoyDia = Number(hoy.slice(8, 10));
  const mesActual = hoy.slice(0, 7);
  const [y, m] = mesActual.split("-").map(Number);
  const diasDelMes = new Date(y, m, 0).getDate();

  // Semana en curso: lunes hasta hoy. Semana anterior: los 7 días previos completos.
  const lunes = lunesDe(hoy);
  const semanaPrevaIni = sumarDias(lunes, -7);
  const semanaPrevaFin = sumarDias(lunes, -1);

  // Mes en curso: día 1 hasta hoy. Mes anterior: el mismo tramo.
  const mesPrevio = desplazarMes(mesActual, -1);
  const mesPrevioHasta = `${mesPrevio}-${String(Math.min(hoyDia, new Date(Number(mesPrevio.slice(0, 4)), Number(mesPrevio.slice(5, 7)), 0).getDate())).padStart(2, "0")}`;

  const mesAct = resumenPeriodo(CASOS_EJEMPLO, `${mesActual}-01`, hoy);
  const diasTranscurridos = Math.max(1, hoyDia);
  const proyeccion = Math.round((mesAct.cremaciones / diasTranscurridos) * diasDelMes);

  // Pipeline y agenda del día, desde los casos abiertos.
  const pipeline: Record<EstadoMostrado, number> = {
    EN_CONVERSACION: 0, AGENDADO: 0, REALIZADO: 0, ENTREGADO: 0, ABANDONADO: 0,
  };
  for (const c of CASOS_INICIALES) pipeline[estadoMostrado(c, hoy)] += 1;
  const agenda = CASOS_INICIALES.filter((c) => c.fechaServicio === hoy).sort((a, b) =>
    (a.horaServicio ?? "").localeCompare(b.horaServicio ?? "")
  );

  // Planes vendidos en el mes en curso.
  const porPlan: Record<PlanId, number> = { clasico: 0, paz: 0, eco: 0, "sin-clasificar": 0 };
  for (const c of CASOS_EJEMPLO) if (c.fecha >= `${mesActual}-01` && c.fecha <= hoy) porPlan[c.plan] += 1;
  const planesMes = (Object.keys(porPlan) as PlanId[])
    .map((plan) => ({ plan, cremaciones: porPlan[plan] }))
    .filter((p) => p.cremaciones > 0)
    .sort((a, b) => b.cremaciones - a.cremaciones);

  // Alertas: mismas reglas que en Reportes, sin duplicar lógica.
  const ventana6 = ventanaMeses("2026-10", 6);
  const ventana6Prev = ventanaMeses("2026-10", 12).slice(0, 6);
  const casosPeriodo6 = CASOS_EJEMPLO.filter((c) => ventana6.includes(c.fecha.slice(0, 7)));
  const abast = calcularAbastecimiento({ casos: CASOS_EJEMPLO, casosPeriodo: casosPeriodo6, finClave: "2026-10", longitud: 6 });
  const vets = calcularVeterinarias(CASOS_EJEMPLO, ventana6, ventana6Prev);
  const opor = calcularOportunidades(CASOS_EJEMPLO, ventana6, ventana6Prev);

  const mensajes: Mensaje[] = [];

  const criticos = abast.filas.filter((f) => f.estado === "critico");
  if (criticos.length > 0) {
    mensajes.push({
      nivel: "critico",
      titulo: `${criticos.length} ${criticos.length === 1 ? "insumo se agota" : "insumos se agotan"} antes de que llegue un pedido`,
      detalle: criticos.map((f) => f.insumo.nombre).join(", "),
    });
  }
  const atencion = abast.filas.filter((f) => f.estado === "atencion");
  if (atencion.length > 0) {
    mensajes.push({
      nivel: "atencion",
      titulo: `${atencion.length} ${atencion.length === 1 ? "insumo" : "insumos"} con poca cobertura`,
      detalle: atencion.map((f) => f.insumo.nombre).join(", "),
    });
  }

  for (const c of CASOS_INICIALES) {
    const estado = estadoMostrado(c, hoy);
    const total = calcularPrecio(c).total;
    if (estado === "EN_CONVERSACION" && c.pagos.length > 0) {
      mensajes.push({ nivel: "atencion", titulo: `Pagó y falta agendar: ${c.mascota}`, detalle: `${c.tutor} · ${estadoPago(c, total) === "PAGADO" ? "pagado" : "pago parcial"}` });
    }
    if (estado === "REALIZADO") {
      mensajes.push({ nivel: "atencion", titulo: `Falta entregar la urna: ${c.mascota}`, detalle: `${c.tutor} · servicio realizado` });
    }
  }

  for (const a of ACTIVOS_EJEMPLO) {
    if (a.estado === "reparacion") {
      mensajes.push({ nivel: "info", titulo: `En reparación: ${a.nombre}`, detalle: `${a.cantidad} ud. · ${a.ubicacion}` });
    }
    if (a.proximaRevision && a.estado !== "baja") {
      const dias = diasEntre(hoy, a.proximaRevision);
      if (dias < 0) {
        mensajes.push({ nivel: "critico", titulo: `Revisión vencida: ${a.nombre}`, detalle: `Venció el ${a.proximaRevision}` });
      } else if (dias <= 30) {
        mensajes.push({ nivel: "atencion", titulo: `Revisión próxima: ${a.nombre}`, detalle: `En ${dias} días` });
      }
    }
  }

  for (const f of vets.filas.filter((x) => x.caida)) {
    mensajes.push({ nivel: "atencion", titulo: `${f.nombre} pierde actividad`, detalle: "Conviene contactarla para revisar derivaciones." });
  }
  for (const f of opor.filas.filter((x) => x.oportunidad).slice(0, 1)) {
    mensajes.push({ nivel: "info", titulo: `Oportunidad en ${f.distrito}`, detalle: "Demanda o crecimiento con pocas veterinarias." });
  }

  const orden: Record<Nivel, number> = { critico: 0, atencion: 1, info: 2 };
  mensajes.sort((a, b) => orden[a.nivel] - orden[b.nivel]);

  return {
    hoy,
    hoyDia,
    diasDelMes,
    dia: { agenda },
    semana: {
      actual: resumenPeriodo(CASOS_EJEMPLO, lunes, hoy),
      previa: resumenPeriodo(CASOS_EJEMPLO, semanaPrevaIni, semanaPrevaFin),
      ini: lunes,
      fin: hoy,
    },
    mes: {
      actual: mesAct,
      previo: resumenPeriodo(CASOS_EJEMPLO, `${mesPrevio}-01`, mesPrevioHasta),
      proyeccion,
      serie: serieDiaria(CASOS_EJEMPLO, mesActual, hoyDia),
    },
    pipeline,
    planesMes,
    mensajes,
  };
}
