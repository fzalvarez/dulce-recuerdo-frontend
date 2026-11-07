import type { CasoReportable } from "../types";

// TODO: reemplazar por datos reales cuando el back exponga GET /reportes/cremaciones.
// Datos sintéticos: los totales mensuales son fijos y los casos se generan con una
// semilla fija, así que cada carga produce exactamente los mismos reportes.

export const VETERINARIAS_REFERIDORAS = [
  { id: "petcare-sur", nombre: "PetCare Sur", peso: 30 },
  { id: "san-borja", nombre: "Clínica Veterinaria San Borja", peso: 22 },
  { id: "miraflores", nombre: "Veterinaria Miraflores Centro", peso: 15 },
  { id: "animal-heart", nombre: "Animal Heart Surco", peso: 13 },
  { id: "pet-planet", nombre: "Clínica Pet Planet", peso: 9 },
  { id: "la-molina", nombre: "Clínica Veterinaria La Molina", peso: 6 },
  { id: "los-olivos", nombre: "Veterinaria Los Olivos Norte", peso: 5 },
];

export const NOMBRE_VETERINARIA: Record<string, string> = Object.fromEntries(
  VETERINARIAS_REFERIDORAS.map((v) => [v.id, v.nombre])
);

const DISTRITOS_PESO: [string, number][] = [
  ["Santiago de Surco", 16],
  ["San Borja", 13],
  ["La Molina", 11],
  ["San Isidro", 10],
  ["Miraflores", 9],
  ["Barranco", 6],
  ["Jesús María", 5],
  ["Lince", 4],
  ["Pueblo Libre", 4],
  ["Magdalena del Mar", 3],
  ["San Miguel", 3],
  ["Los Olivos", 2],
];

/** Total de cremaciones y cuántas fueron referidas por veterinarias, por mes. */
const SERIE_MENSUAL: Record<string, { total: number[]; veterinaria: number[] }> = {
  "2024": {
    total: [19, 21, 24, 22, 25, 27, 30, 28, 26, 24, 23, 27],
    veterinaria: [10, 11, 13, 12, 14, 15, 17, 15, 14, 13, 12, 14],
  },
  "2025": {
    total: [24, 27, 31, 26, 30, 34, 38, 35, 33, 29, 27, 31],
    veterinaria: [15, 17, 19, 16, 18, 21, 24, 22, 20, 18, 17, 19],
  },
  // Noviembre 2026 está en curso: solo hay casos hasta el día 7.
  "2026": {
    total: [36, 33, 41, 39, 44, 47, 49, 46, 50, 53, 18],
    veterinaria: [22, 20, 25, 24, 27, 29, 30, 28, 31, 33, 7],
  },
};

export const ULTIMO_MES_CON_DATOS = "2026-11";

function crearPrng(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

function elegirPonderado(rnd: () => number, opciones: [string, number][]): string {
  const total = opciones.reduce((acc, [, peso]) => acc + peso, 0);
  let r = rnd() * total;
  for (const [valor, peso] of opciones) {
    r -= peso;
    if (r < 0) return valor;
  }
  return opciones[opciones.length - 1][0];
}

function generarCasos(): CasoReportable[] {
  const rnd = crearPrng(20260701);
  const pesosVet: [string, number][] = VETERINARIAS_REFERIDORAS.map((v) => [v.id, v.peso]);
  const casos: CasoReportable[] = [];
  let n = 0;

  for (const [anio, serie] of Object.entries(SERIE_MENSUAL)) {
    serie.total.forEach((total, i) => {
      const mes = `${anio}-${String(i + 1).padStart(2, "0")}`;
      const diaMax = mes === ULTIMO_MES_CON_DATOS ? 7 : 28;
      const vet = serie.veterinaria[i];
      for (let k = 0; k < total; k++) {
        const dia = 1 + Math.floor(rnd() * diaMax);
        const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
        const distrito = elegirPonderado(rnd, DISTRITOS_PESO);
        n += 1;
        if (k < vet) {
          casos.push({
            id: `c-${n}`,
            fecha,
            canal: "veterinaria",
            veterinariaId: elegirPonderado(rnd, pesosVet),
            distrito,
          });
        } else {
          casos.push({ id: `c-${n}`, fecha, canal: "particular", distrito });
        }
      }
    });
  }
  return casos;
}

export const CASOS_EJEMPLO: CasoReportable[] = generarCasos();
