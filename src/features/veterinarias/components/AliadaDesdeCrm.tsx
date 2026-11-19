import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { ejecutar } from "@/shared/utils/ejecutar";
import { convertirAliada, listar, type CrmVeterinaria } from "@/features/crm/api";
import { formatoTelefono } from "@/features/crm/utils/formato";

/**
 * Alta de una veterinaria aliada: se busca en la base del CRM y se convierte.
 * No hay registro directo: toda aliada sale de una ficha del CRM (spec crm-control-comercial, R8).
 */
export function AliadaDesdeCrm({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: () => void }) {
  const fichas = useRecurso(() => listar(""));
  const [texto, setTexto] = useState("");
  const [elegida, setElegida] = useState<CrmVeterinaria | null>(null);
  const [creando, setCreando] = useState(false);

  // Solo fichas vigentes que todavía no son aliadas.
  const candidatas = (fichas.data ?? []).filter((f) => f.veterinaria_id === null && !f.ya_no_existe);
  const q = texto.trim().toLowerCase();
  const resultados = q
    ? candidatas.filter((f) => [f.nombre, f.codigo, f.distrito ?? ""].some((x) => x.toLowerCase().includes(q))).slice(0, 8)
    : [];

  const crear = async () => {
    if (!elegida) return;
    setCreando(true);
    const ok = await ejecutar(
      () => convertirAliada(elegida.id),
      `${elegida.nombre} es ahora veterinaria aliada. Asígnale su convenio.`,
      "No se pudo crear la aliada."
    );
    setCreando(false);
    if (ok) onHecho();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva veterinaria aliada</DialogTitle>
        <DialogDescription>Busca la veterinaria en el CRM. Se crea como aliada sin convenio; el convenio se asigna después.</DialogDescription>
      </DialogHeader>

      {elegida ? (
        <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3 text-sm space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs text-slate-500 mr-1.5">{elegida.codigo}</span>
              <span className="font-medium text-slate-900 dark:text-white">{elegida.nombre}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setElegida(null)} disabled={creando}>
              Cambiar
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {[elegida.direccion, elegida.distrito, formatoTelefono(elegida.telefono)].filter(Boolean).join(" · ") || "Sin dirección ni teléfono en el CRM"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="aliada-buscar">Nombre</Label>
          <Input
            id="aliada-buscar"
            placeholder="Escribe para buscar en el CRM…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-9"
          />
          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {resultados.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 text-sm">
                  <span className="font-mono text-xs text-slate-500 mr-1.5">{f.codigo}</span>
                  {f.nombre}
                  {f.distrito && <span className="block text-xs text-slate-500">{f.distrito}</span>}
                </span>
                <Button variant="outline" size="sm" onClick={() => setElegida(f)}>
                  Elegir
                </Button>
              </li>
            ))}
          </ul>
          {q && resultados.length === 0 && !fichas.cargando && (
            <p className="text-xs text-slate-500">
              No está en el CRM. Regístrala primero en{" "}
              <Link to="/crm/veterinarias" className="text-brand-600 hover:underline">
                CRM › Veterinarias
              </Link>
              .
            </p>
          )}
          {fichas.error && <p className="text-xs text-red-600">{fichas.error}</p>}
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar} disabled={creando}>
          Cancelar
        </Button>
        <Button variant="operational" onClick={crear} disabled={!elegida || creando}>
          {creando ? "Creando…" : "Crear aliada"}
        </Button>
      </DialogFooter>
    </>
  );
}
