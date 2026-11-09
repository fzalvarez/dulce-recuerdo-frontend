/** Formato y manejo de meses para los reportes. Los cálculos viven en el backend. */

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Clave de mes "YYYY-MM" a partir de una fecha. */
export function claveMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export function desplazarMes(clave: string, delta: number): string {
  const [y, m] = clave.split("-").map(Number);
  return claveMes(new Date(y, m - 1 + delta, 1));
}

export function etiquetaMesCorta(clave: string): string {
  const [y, m] = clave.split("-").map(Number);
  return `${MESES_CORTOS[m - 1]} ${String(y).slice(2)}`;
}

export function etiquetaMesLarga(clave: string): string {
  const [y, m] = clave.split("-").map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

/** Variación con signo, para los reportes de crecimiento. */
export function formatPct(valor: number | null): string {
  if (valor === null) return "—";
  const signo = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${signo}${Math.abs(valor).toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;
}

/** Porcentaje de participación, sin signo. */
export function formatPorcentaje(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;
}

export function formatoSolesCorto(n: number): string {
  return `S/ ${Math.round(n).toLocaleString("es-PE")}`;
}
