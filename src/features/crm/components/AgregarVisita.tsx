import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ejecutar } from "@/shared/utils/ejecutar";
import { agregarVisita, type CrmVeterinaria } from "../api";

/**
 * Busca en el CRM la veterinaria que se visitó y la pasa al control comercial.
 * Toda visita sale de la base del CRM: aquí no se registra nada nuevo.
 */
export function AgregarVisita({
  candidatas,
  onCerrar,
  onHecho,
}: {
  /** Fichas del CRM que todavía no están en visitas. */
  candidatas: CrmVeterinaria[];
  onCerrar: () => void;
  onHecho: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [agregando, setAgregando] = useState<string | null>(null);

  const q = texto.trim().toLowerCase();
  const resultados = candidatas
    .filter((v) => !q || [v.nombre, v.codigo, v.distrito ?? ""].some((x) => x.toLowerCase().includes(q)))
    .slice(0, 30);

  const agregar = async (v: CrmVeterinaria) => {
    setAgregando(v.id);
    const ok = await ejecutar(() => agregarVisita(v.id), `${v.nombre} agregada a visitas.`, "No se pudo agregar la visita.");
    setAgregando(null);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar visita</DialogTitle>
        <DialogDescription>Busca la veterinaria en el CRM y márcala como visitada.</DialogDescription>
      </DialogHeader>
      <Input placeholder="Nombre, código o distrito" value={texto} onChange={(e) => setTexto(e.target.value)} className="h-9" />
      <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
        {resultados.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0 text-sm">
              <span className="font-mono text-xs text-slate-500">{v.codigo}</span> {v.nombre}
              {v.distrito && <span className="block text-xs text-slate-500">{v.distrito}</span>}
            </span>
            <Button variant="outline" size="sm" disabled={agregando !== null} onClick={() => agregar(v)}>
              {agregando === v.id ? "Agregando…" : "Agregar"}
            </Button>
          </li>
        ))}
        {resultados.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">
            Sin coincidencias. Si la veterinaria no está en el CRM, regístrala primero en CRM › Veterinarias.
          </li>
        )}
      </ul>
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar}>
          Cerrar
        </Button>
      </DialogFooter>
    </>
  );
}
