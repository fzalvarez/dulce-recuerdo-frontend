import { obtener } from "@/features/crm/api";
import { CrmVeterinariaForm } from "@/features/crm/components/CrmVeterinariaForm";
import { useRecurso } from "@/shared/hooks/useRecurso";

/**
 * Ficha completa de una aliada: datos del CRM en solo lectura. «Editar» habilita todos los campos
 * (spec crm-control-comercial, R10). Así no se mueve una aliada por accidente.
 */
export function FichaAliada({ crmId, onCerrar, onHecho }: { crmId: string; onCerrar: () => void; onHecho: () => void }) {
  const ficha = useRecurso(() => obtener(crmId), [crmId]);
  if (ficha.error) return <p className="text-sm text-red-600">{ficha.error}</p>;
  if (!ficha.data) return <p className="text-sm text-slate-500">Cargando…</p>;
  return <CrmVeterinariaForm veterinaria={ficha.data} onCerrar={onCerrar} onHecho={onHecho} />;
}
