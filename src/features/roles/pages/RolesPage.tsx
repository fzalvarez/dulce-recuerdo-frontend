import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, LoaderIcon, ShieldCheckIcon } from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { notifyError, notifySuccess } from "@/shared/utils";
import { useRecurso } from "@/shared/hooks/useRecurso";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { usuarioActual } from "@/features/auth/api";
import { MODULOS, MODULOS_PROTEGIDOS, ROLES } from "../data/roles";
import { guardarModulosRol, listarRoles } from "../api";
import type { ModuloId, RolId } from "../types";
import { aplicarProtegidos } from "../utils/permisos";

const GRUPOS = [...new Set(MODULOS.map((m) => m.grupo))];

type PorRol = Record<RolId, ModuloId[]>;

function mismosModulos(a: ModuloId[], b: ModuloId[]) {
  return a.length === b.length && a.every((m) => b.includes(m));
}

/** Permisos por rol: qué módulos puede abrir cada rol (spec roles.md). Se guardan en el backend. */
export default function RolesPage() {
  const roles = useRecurso(listarRoles);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Catálogos & Administración" },
          { label: "Usuarios" },
          { label: "Roles y permisos" },
        ]}
      />
      {roles.error && <p className="text-sm text-red-600">{roles.error}</p>}
      {roles.cargando && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderIcon className="size-4 animate-spin" /> Cargando roles…
        </p>
      )}
      {roles.data && (
        <MatrizRoles
          key={JSON.stringify(roles.data)}
          guardado={Object.fromEntries(
            ROLES.map((r) => [r.id, aplicarProtegidos(r.id, roles.data!.find((x) => x.id === r.id)?.modulos ?? [])])
          ) as PorRol}
          onGuardado={roles.recargar}
        />
      )}
    </>
  );
}

function MatrizRoles({ guardado, onGuardado }: { guardado: PorRol; onGuardado: () => void }) {
  const navigate = useNavigate();
  const setModulosSesion = useAuthStore((s) => s.setModulos);
  const [borrador, setBorrador] = useState<PorRol>(guardado);
  const [guardando, setGuardando] = useState(false);

  const hayCambios = ROLES.some((r) => !mismosModulos(borrador[r.id], guardado[r.id]));

  const alternar = (rol: RolId, modulo: ModuloId) => {
    if (MODULOS_PROTEGIDOS[rol]?.includes(modulo)) return;
    setBorrador((b) => {
      const actuales = b[rol];
      const siguientes = actuales.includes(modulo)
        ? actuales.filter((m) => m !== modulo)
        : [...actuales, modulo];
      return { ...b, [rol]: aplicarProtegidos(rol, siguientes) };
    });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      for (const r of ROLES) {
        if (!mismosModulos(borrador[r.id], guardado[r.id])) await guardarModulosRol(r.id, borrador[r.id]);
      }
      // Si cambió el rol propio, el menú se actualiza al instante.
      setModulosSesion((await usuarioActual()).modulos);
      notifySuccess("Permisos de roles guardados.");
      onGuardado();
    } catch (e) {
      notifyError(getApiErrorMessage(e, "No se pudieron guardar los permisos."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Roles y permisos
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Marca a qué módulos puede entrar cada rol. Los cuatro roles son fijos; cada usuario
            tiene uno solo.
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 h-10 shrink-0" onClick={() => navigate("/usuarios")}>
          <ArrowLeftIcon className="size-4" />
          Volver a Usuarios
        </Button>
      </div>

      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Módulo</th>
              {ROLES.map((r) => (
                <th key={r.id} scope="col" className="px-3 py-3 font-semibold text-center w-28">
                  <span className="block text-slate-700 normal-case tracking-normal text-sm">
                    {r.nombre}
                  </span>
                  <span className="block text-[11px] font-normal normal-case tracking-normal text-slate-400">
                    {borrador[r.id].length} de {MODULOS.length}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {GRUPOS.map((grupo) => (
              <GrupoFilas key={grupo} grupo={grupo} borrador={borrador} alternar={alternar} />
            ))}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
          <p className="text-xs text-slate-500">
            {hayCambios ? "Hay cambios sin guardar." : "Sin cambios pendientes."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setBorrador(guardado)} disabled={!hayCambios || guardando}>
              Descartar
            </Button>
            <Button variant="operational" onClick={guardar} disabled={!hayCambios || guardando}>
              <ShieldCheckIcon className="size-4" />
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function GrupoFilas({
  grupo,
  borrador,
  alternar,
}: {
  grupo: string;
  borrador: PorRol;
  alternar: (rol: RolId, modulo: ModuloId) => void;
}) {
  return (
    <>
      <tr>
        <th
          scope="rowgroup"
          colSpan={ROLES.length + 1}
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-white"
        >
          {grupo}
        </th>
      </tr>
      {MODULOS.filter((m) => m.grupo === grupo).map((modulo) => (
        <tr key={modulo.id} className="hover:bg-slate-50/60">
          <td className="px-4 py-2.5 text-slate-800">{modulo.nombre}</td>
          {ROLES.map((r) => {
            const protegido = !!MODULOS_PROTEGIDOS[r.id]?.includes(modulo.id);
            const marcado = borrador[r.id].includes(modulo.id);
            return (
              <td key={r.id} className="px-3 py-2.5 text-center">
                <span className="inline-flex" title={protegido ? "Siempre incluido para este rol" : undefined}>
                  <Checkbox
                    checked={marcado}
                    disabled={protegido}
                    aria-label={`${modulo.nombre} para ${r.nombre}`}
                    onCheckedChange={() => alternar(r.id, modulo.id)}
                  />
                </span>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
