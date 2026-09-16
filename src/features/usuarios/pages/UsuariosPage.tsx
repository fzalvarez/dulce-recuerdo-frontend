import { useMemo, useState } from "react";
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  ShieldCheckIcon,
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/shared/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { notifySuccess } from "@/shared/utils";

// TODO: reemplazar por datos reales del módulo `usuarios` cuando se exponga el endpoint.
type Rol = "administrador" | "operador-central" | "coordinador-convenios" | "conductor";

const ROLES: { value: Rol; label: string; badgeClass: string }[] = [
  { value: "administrador", label: "Administrador", badgeClass: "bg-violet-100 text-violet-700" },
  { value: "operador-central", label: "Operador Central", badgeClass: "bg-brand-100 text-brand-700" },
  { value: "coordinador-convenios", label: "Coordinador de Convenios", badgeClass: "bg-emerald-100 text-emerald-700" },
  { value: "conductor", label: "Conductor / Logística", badgeClass: "bg-amber-100 text-amber-700" },
];

function rolMeta(rol: Rol) {
  return ROLES.find((r) => r.value === rol)!;
}

interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  rol: Rol;
  activo: boolean;
  ultimoAcceso: string;
}

const USUARIOS_INICIALES: Usuario[] = [
  {
    id: "u-1",
    nombres: "Marcos",
    apellidos: "Gutiérrez",
    username: "marcos.g",
    email: "marcos@dulcerecuerdo.pe",
    rol: "administrador",
    activo: true,
    ultimoAcceso: "Hoy, 09:12 AM",
  },
  {
    id: "u-2",
    nombres: "Paola",
    apellidos: "Reyes",
    username: "paola.r",
    email: "paola@dulcerecuerdo.pe",
    rol: "operador-central",
    activo: true,
    ultimoAcceso: "Hoy, 08:40 AM",
  },
  {
    id: "u-3",
    nombres: "Carlos",
    apellidos: "Reátegui",
    username: "carlos.r",
    email: "carlos@dulcerecuerdo.pe",
    rol: "coordinador-convenios",
    activo: true,
    ultimoAcceso: "Ayer, 18:20 PM",
  },
  {
    id: "u-4",
    nombres: "Jhon",
    apellidos: "Torres",
    username: "jhon.t",
    email: "jhon@dulcerecuerdo.pe",
    rol: "conductor",
    activo: true,
    ultimoAcceso: "Ayer, 15:05 PM",
  },
  {
    id: "u-5",
    nombres: "Rosa",
    apellidos: "Medina",
    username: "rosa.m",
    email: "rosa@dulcerecuerdo.pe",
    rol: "operador-central",
    activo: false,
    ultimoAcceso: "12 Oct, 11:30 AM",
  },
];

interface UsuarioForm {
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  rol: Rol;
  password: string;
  confirmPassword: string;
  activo: boolean;
}

const FORM_VACIO: UsuarioForm = {
  nombres: "",
  apellidos: "",
  username: "",
  email: "",
  rol: "operador-central",
  password: "",
  confirmPassword: "",
  activo: true,
};

function UsuarioModal({
  open,
  onOpenChange,
  usuario,
  onGuardar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onGuardar: (data: UsuarioForm) => void;
}) {
  const esEdicion = !!usuario;
  const [form, setForm] = useState<UsuarioForm>(FORM_VACIO);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [initedFor, setInitedFor] = useState<string | null>(null);

  const claveInit = usuario?.id ?? "nuevo";
  if (open && initedFor !== claveInit) {
    setForm(
      usuario
        ? {
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            username: usuario.username,
            email: usuario.email,
            rol: usuario.rol,
            password: "",
            confirmPassword: "",
            activo: usuario.activo,
          }
        : FORM_VACIO
    );
    setInitedFor(claveInit);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <UserPlusIcon className="size-5" />
          </div>
          <DialogTitle>{esEdicion ? "Editar Usuario" : "Nuevo Usuario del Sistema"}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {esEdicion
            ? "Actualiza los datos de acceso y el rol asignado."
            : "Crea una cuenta de acceso al panel de control para el equipo operativo."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                required
                value={form.nombres}
                onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                required
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Usuario (login)</Label>
            <Input
              id="username"
              required
              autoComplete="off"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rol">Rol / Perfil de Acceso</Label>
            <Select value={form.rol} onValueChange={(v) => setForm((f) => ({ ...f, rol: v as Rol }))}>
              <SelectTrigger id="rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">
                {esEdicion ? "Nueva Contraseña (opcional)" : "Contraseña"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPass ? "text" : "password"}
                  required={!esEdicion}
                  autoComplete="new-password"
                  className="pr-9"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarPass ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type={mostrarPass ? "text" : "password"}
                required={!esEdicion || form.password.length > 0}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <Checkbox
              checked={form.activo}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, activo: checked === true }))}
            />
            Cuenta activa (puede iniciar sesión)
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="operational">
              <ShieldCheckIcon className="size-4" />
              {esEdicion ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "todos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);

  const usuariosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      const coincideTexto =
        !query ||
        `${u.nombres} ${u.apellidos}`.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      const coincideRol = filtroRol === "todos" || u.rol === filtroRol;
      return coincideTexto && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  const totalActivos = usuarios.filter((u) => u.activo).length;

  const handleNuevo = () => {
    setUsuarioEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (u: Usuario) => {
    setUsuarioEditar(u);
    setModalOpen(true);
  };

  const handleGuardar = (data: UsuarioForm) => {
    if (usuarioEditar) {
      setUsuarios((list) =>
        list.map((u) =>
          u.id === usuarioEditar.id
            ? {
                ...u,
                nombres: data.nombres,
                apellidos: data.apellidos,
                username: data.username,
                email: data.email,
                rol: data.rol,
                activo: data.activo,
              }
            : u
        )
      );
      notifySuccess(`Usuario ${data.nombres} ${data.apellidos} actualizado correctamente.`);
    } else {
      const nuevo: Usuario = {
        id: `u-${Date.now()}`,
        nombres: data.nombres,
        apellidos: data.apellidos,
        username: data.username,
        email: data.email,
        rol: data.rol,
        activo: data.activo,
        ultimoAcceso: "Sin conexiones aún",
      };
      setUsuarios((list) => [nuevo, ...list]);
      notifySuccess(`Cuenta creada para ${data.nombres} ${data.apellidos}.`);
    }
  };

  const handleConfirmarEliminar = () => {
    if (!usuarioEliminar) return;
    setUsuarios((list) => list.filter((u) => u.id !== usuarioEliminar.id));
    notifySuccess(`Usuario ${usuarioEliminar.nombres} ${usuarioEliminar.apellidos} eliminado.`);
    setUsuarioEliminar(null);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Catálogos & Administración" }, { label: "Usuarios" }]} />

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Usuarios y Accesos
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Gestión de cuentas del equipo operativo: roles, permisos y estado de acceso al panel
            de control.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="operational" className="gap-1.5 h-10" onClick={handleNuevo}>
            <UserPlusIcon className="size-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Total de Usuarios
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{usuarios.length}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
              <UsersIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">Cuentas registradas en el panel</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Usuarios Activos
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1">{totalActivos}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheckIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">Con sesión habilitada actualmente</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-label uppercase tracking-wider text-slate-400 font-semibold">
                Roles Configurados
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{ROLES.length}</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
              <KeyRoundIcon className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">Administrador, Operador, Coordinador y Conductor</div>
        </div>
      </section>

      {/* Búsqueda + filtro de rol */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre, usuario o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filtro-rol" className="whitespace-nowrap">Rol:</Label>
          <Select value={filtroRol} onValueChange={(v) => setFiltroRol(v as typeof filtroRol)}>
            <SelectTrigger id="filtro-rol" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Tabla de usuarios */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-label uppercase tracking-wider">
                <th className="py-3 px-5 font-semibold">Usuario</th>
                <th className="py-3 px-4 font-semibold">Rol</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold">Último Acceso</th>
                <th className="py-3 px-5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuariosFiltrados.map((u) => {
                const rol = rolMeta(u.rol);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold uppercase shrink-0">
                          {u.nombres.charAt(0)}
                          {u.apellidos.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {u.nombres} {u.apellidos}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            @{u.username} · {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-label font-semibold", rol.badgeClass)}>
                        {rol.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label font-semibold",
                          u.activo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", u.activo ? "bg-emerald-500" : "bg-slate-400")} />
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">{u.ultimoAcceso}</td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleEditar(u)}>
                          <PencilIcon className="size-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Eliminar usuario"
                          onClick={() => setUsuarioEliminar(u)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                    No se encontraron usuarios con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <UsuarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        usuario={usuarioEditar}
        onGuardar={handleGuardar}
      />

      {/* Confirmación de eliminación */}
      <Dialog open={!!usuarioEliminar} onOpenChange={(open) => !open && setUsuarioEliminar(null)}>
        <DialogContent>
          <div className="flex flex-col items-center gap-2 text-center">
            <CircleAlertIcon className="text-red-500 size-8" />
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle>Eliminar Usuario</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Esta acción revocará el acceso al panel de forma inmediata para{" "}
              <strong className="text-slate-900 font-semibold">
                {usuarioEliminar?.nombres} {usuarioEliminar?.apellidos}
              </strong>
              . No se puede deshacer.
            </DialogDescription>
          </div>
          <DialogFooter>
            <Button variant="outline" className="flex-1" onClick={() => setUsuarioEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirmarEliminar}>
              <Trash2Icon className="size-4" />
              Eliminar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
