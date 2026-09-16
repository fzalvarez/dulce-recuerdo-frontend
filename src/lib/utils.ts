import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge no conoce nuestros tokens de tamaño de fuente custom
// (ej. `text-label`, definidos en index.css). Sin este registro, los
// confunde con la clase de color de texto (`text-color`) cuando aparecen
// juntas en un mismo cn(...) y descarta una de las dos silenciosamente.
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-label"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
