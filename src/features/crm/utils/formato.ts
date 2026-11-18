import { DIAS, TIPOS, type HorarioDia, type TipoVeterinaria } from "../api";

/** Solo visual: celular `982 874 438`, fijo de Lima `01 354 5655`; el resto, de a 3. */
export function formatoTelefono(digitos: string | null | undefined): string {
  if (!digitos) return "";
  if (digitos.startsWith("01") && digitos.length === 9) return `01 ${digitos.slice(2, 5)} ${digitos.slice(5)}`;
  return digitos.replace(/(\d{3})(?=\d)/g, "$1 ");
}

export const nombreTipo = (t: TipoVeterinaria | null) => TIPOS.find((x) => x.value === t)?.label ?? null;

export const DIA_CORTO: Record<(typeof DIAS)[number], string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

const textoDia = (d: HorarioDia) =>
  d.estado === "24H" ? "24 h" : d.estado === "CERRADO" ? "cerrado" : `${d.abre}–${d.cierra}`;

/** "Lun–Sáb 09:00–19:00 · Dom cerrado". Agrupa días seguidos con el mismo horario. */
export function resumenHorario(h: HorarioDia[] | null): string | null {
  if (!h?.length) return null;
  if (h.every((d) => d.estado === "24H")) return "24 horas, todos los días";
  const grupos: { desde: HorarioDia; hasta: HorarioDia; texto: string }[] = [];
  for (const d of h) {
    const texto = textoDia(d);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.hasta = d;
    else grupos.push({ desde: d, hasta: d, texto });
  }
  return grupos
    .map((g) => `${DIA_CORTO[g.desde.dia]}${g.desde === g.hasta ? "" : `–${DIA_CORTO[g.hasta.dia]}`} ${g.texto}`)
    .join(" · ");
}
