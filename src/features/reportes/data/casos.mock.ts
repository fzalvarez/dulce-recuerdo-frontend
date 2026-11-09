import type { CasoReportable, PlanId } from "../types";

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

export const NOMBRE_PLAN: Record<PlanId, string> = {
  clasico: "Dulce Recuerdo Clásico",
  eco: "Dulce Recuerdo Eco",
  paz: "Dulce Recuerdo Paz",
  "sin-clasificar": "Sin clasificar",
};

export const PLANES_ORDEN: PlanId[] = ["clasico", "eco", "paz", "sin-clasificar"];

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

const PLANES_PESO: [PlanId, number][] = [
  ["clasico", 45],
  ["eco", 30],
  ["paz", 17],
  ["sin-clasificar", 8],
];

// Distribución de pesos: la mayoría son perros medianos y grandes.
const RANGOS_PESO_PESO: [string, number][] = [
  ["0-5", 14],
  ["5-15", 30],
  ["15-25", 24],
  ["25-35", 20],
  ["35+", 12],
];

const LIMITES_RANGO: Record<string, [number, number]> = {
  "0-5": [0.5, 5],
  "5-15": [5.1, 15],
  "15-25": [15.1, 25],
  "25-35": [25.1, 35],
  "35+": [35.1, 60],
};

/** Total de cremaciones y cuántas fueron referidas por veterinarias, por mes. */
const SERIE_MENSUAL: Record<string, { total: number[]; veterinaria: number[] }> = {
  "2023": {
    total: [17, 19, 21, 18, 20, 23, 25, 24, 22, 20, 19, 23],
    veterinaria: [9, 10, 11, 10, 11, 12, 13, 13, 12, 11, 10, 12],
  },
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

function elegirPonderado<T extends string>(rnd: () => number, opciones: [T, number][]): T {
  const total = opciones.reduce((acc, [, peso]) => acc + peso, 0);
  let r = rnd() * total;
  for (const [valor, peso] of opciones) {
    r -= peso;
    if (r < 0) return valor;
  }
  return opciones[opciones.length - 1][0];
}

function generarPesoKg(rnd: () => number): number {
  const rango = elegirPonderado(rnd, RANGOS_PESO_PESO);
  const [min, max] = LIMITES_RANGO[rango];
  return Math.round((min + rnd() * (max - min)) * 10) / 10;
}

// MAQUETA: afinidad de cada distrito con las veterinarias (más alta = más referidos).
// Determina qué distritos tienen más clientes por veterinaria y cuáles casi solo particulares.
const AFINIDAD_VETERINARIA: Record<string, number> = {
  Barranco: 2.2,
  Miraflores: 1.8,
  "San Isidro": 1.4,
  "Jesús María": 0.8,
  Surco: 0.9,
  "San Borja": 1.0,
  "Pueblo Libre": 1.0,
  "Magdalena del Mar": 0.9,
  Lince: 0.6,
  "San Miguel": 0.7,
  "La Molina": 0.5,
  "Los Olivos": 0.4,
};

// MAQUETA: factor de demanda de 2026 por distrito. Otros años no cambian.
const CRECIMIENTO_2026: Record<string, number> = {
  "La Molina": 2.2,
  "Los Olivos": 2.5,
  Lince: 1.8,
  Miraflores: 0.7,
};

function pesosDistrito(anio: string): [string, number][] {
  return DISTRITOS_PESO.map(([d, peso]) => [d, anio === "2026" ? peso * (CRECIMIENTO_2026[d] ?? 1) : peso]);
}

function generarCasos(): CasoReportable[] {
  const rnd = crearPrng(20260701);
  const pesosVet: [string, number][] = VETERINARIAS_REFERIDORAS.map((v) => [v.id, v.peso]);
  const casos: CasoReportable[] = [];
  let n = 0;

  for (const [anio, serie] of Object.entries(SERIE_MENSUAL)) {
    const pesosDist = pesosDistrito(anio);
    serie.total.forEach((total, i) => {
      const mes = `${anio}-${String(i + 1).padStart(2, "0")}`;
      const diaMax = mes === ULTIMO_MES_CON_DATOS ? 7 : 28;
      const vet = serie.veterinaria[i];

      const base = Array.from({ length: total }, () => {
        const dia = 1 + Math.floor(rnd() * diaMax);
        const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
        const distrito = elegirPonderado(rnd, pesosDist);
        const plan = elegirPonderado(rnd, PLANES_PESO);
        const presencial = rnd() < 0.4;
        const eutanasia = rnd() < 0.25;
        const pesoKg = generarPesoKg(rnd);
        return { fecha, distrito, plan, presencial, eutanasia, pesoKg };
      });

      // Elegir los casos de veterinaria con probabilidad según la afinidad del distrito.
      const claves = base.map((b) => Math.pow(rnd(), 1 / (AFINIDAD_VETERINARIA[b.distrito] ?? 1)));
      const orden = claves.map((_, idx) => idx).sort((a, b) => claves[b] - claves[a]);
      const esVet = new Set(orden.slice(0, vet));

      base.forEach((b, idx) => {
        n += 1;
        const id = `c-${n}`;
        if (esVet.has(idx)) {
          casos.push({ id, ...b, canal: "veterinaria", veterinariaId: elegirPonderado(rnd, pesosVet) });
        } else {
          casos.push({ id, ...b, canal: "particular" });
        }
      });
    });
  }
  return casos;
}

export const CASOS_EJEMPLO: CasoReportable[] = generarCasos();
