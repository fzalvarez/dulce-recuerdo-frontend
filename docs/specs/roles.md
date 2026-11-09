# Spec: Roles y permisos por módulo

**Estado:** Propuesta
**Fecha:** 2026-11-08
**Pantalla en el front:** `/usuarios` (asignación de rol) y `/usuarios/roles` (permisos por rol)

## 1. Problema

Todos los usuarios del panel ven todos los módulos. El negocio necesita controlar a
qué módulos puede entrar cada persona según su función. Hoy el selector de rol en
Usuarios tiene cuatro perfiles con nombres que no corresponden a lo que se usa en la
operación.

## 2. Alcance

**Incluye:**
- Cuatro roles fijos: `root`, `admin`, `operador1`, `operador2`.
- Desde Usuarios, un botón "Roles y permisos" lleva a la pantalla de roles
  (`/usuarios/roles`). Ahí, para cada rol se marca a qué módulos puede entrar.
  No hay módulo de menú aparte para roles: administrar roles es parte de Usuarios.
- Cada usuario tiene exactamente un rol (selector en Usuarios).
- El menú lateral muestra solo los módulos del rol de la sesión.
- Si un usuario abre por URL un módulo que su rol no incluye, no ve su contenido.

**No incluye (por ahora):**
- Crear, renombrar o borrar roles. Son cuatro y están fijos.
- Permisos dentro de un módulo (por ejemplo, ver pero no editar). El permiso es de
  entrar o no entrar al módulo.
- Varios roles por usuario.
- Verificación en el servidor. Mientras no exista API, la protección es solo de la
  interfaz y no sustituye a la validación del backend.

## 3. Reglas de negocio

- **R1 Roles fijos:** existen exactamente cuatro roles: `root`, `admin`, `operador1` y
  `operador2`. No se pueden agregar, renombrar ni eliminar.
- **R2 Módulos por rol:** cada rol tiene una lista de módulos a los que puede entrar.
  Se cambia en la pantalla Roles. Un rol puede quedar sin módulos.
- **R3 Módulo protegido de root:** `root` siempre conserva el módulo *Usuarios*, que
  es donde se administran roles. Esa casilla aparece marcada y bloqueada, para que
  nunca quede sin forma de administrar el acceso.
- **R4 Un rol por usuario:** cada usuario tiene un solo rol. Al crear o editar un
  usuario se elige entre los cuatro roles.
- **R5 Menú:** el menú lateral muestra solo los módulos del rol de la sesión. Un grupo
  sin módulos visibles no se muestra.
- **R6 Acceso por URL:** si la ruta pertenece a un módulo que el rol no incluye, la
  pantalla no muestra el contenido. Se redirige al primer módulo permitido. Si el rol
  no tiene ninguno, se muestra el aviso "sin módulos asignados".
- **R7 Rol de la sesión:** el rol llega en el token de sesión (claim `rol`). Si el
  token no trae un rol válido, la sesión no tiene módulos.
- **R8 Cambios:** los cambios de la pantalla Roles se guardan con un botón. Al
  descartar, se vuelve al último estado guardado.

## 4. Modelo de datos

**Rol** (fijo, no editable salvo sus módulos)

| Campo | Tipo | Nulo | Restricción | Motivo |
|---|---|---|---|---|
| `id` | texto | no | `root`, `admin`, `operador1` o `operador2` | Identificador del rol |
| `nombre` | texto | no | fijo: Root, Admin, Operador 1, Operador 2 | Etiqueta visible |
| `modulos` | lista de ids de módulo | no | puede estar vacía; `root` incluye siempre *Usuarios* | Acceso por rol |

**Módulo** (catálogo fijo en código)

| Id | Nombre en el menú | Ruta | Grupo |
|---|---|---|---|
| `dashboard` | Dashboard | `/` | General |
| `casos` | Casos & Servicios | `/casos` | Despedidas |
| `agenda` | Agenda & Rutas | `/agenda` | Despedidas |
| `veterinarias` | Convenios Veterinarios | `/veterinarias` | Despedidas |
| `entregas` | Entregas | `/entregas` | Despedidas |
| `clientes` | Clientes | `/clientes` | Atención Veterinaria |
| `mascotas` | Mascotas | `/mascotas` | Atención Veterinaria |
| `finanzas` | Ingresos y Gastos | `/finanzas` | Finanzas |
| `reportes` | Reportes | `/reportes` | Reportes |
| `servicios` | Servicios | `/servicios` | Catálogos & Administración |
| `planes` | Planes | `/planes` | Catálogos & Administración |
| `inventario` | Inventario | `/inventario` | Catálogos & Administración |
| `activos` | Activos | `/activos` | Catálogos & Administración |
| `vehiculos` | Vehículo | `/vehiculos` | Catálogos & Administración |
| `usuarios` | Usuarios (incluye Roles y permisos) | `/usuarios` | Catálogos & Administración |
| `configuracion` | Configuración | `/configuracion` | General |

**Usuario** (cambio): el campo `rol` pasa de los cuatro perfiles anteriores a
`root`, `admin`, `operador1` u `operador2`.

**Valores iniciales de ejemplo** (se ajustan en la pantalla Roles):
- `root`: todos los módulos.
- `admin`: todos los módulos.
- `operador1`: Dashboard, Casos, Agenda, Entregas, Clientes, Mascotas, Inventario.
- `operador2`: Dashboard, Agenda, Entregas, Vehículo.

## 5. Contrato con la API (backend)

Propuesta. Debe validarse con el backend antes de conectar.

| Método | Ruta | Request | Response | Errores |
|---|---|---|---|---|
| GET | `/roles` | — | lista de roles con `id`, `nombre`, `modulos` | 401 |
| PUT | `/roles/{id}/modulos` | `{ modulos: string[] }` | rol actualizado | 401, 403, 422 |
| GET | `/usuarios` | — | usuarios con `rol` | 401 |
| POST/PUT | `/usuarios` | `rol` ∈ {root, admin, operador1, operador2} | usuario | 401, 403, 422 |

- El token de sesión debe incluir el claim `rol`.
- El servidor debe validar el permiso en cada endpoint de cada módulo (R6 solo
  protege la interfaz).

## 6. Criterios de aceptación

- [ ] Dado que estoy en Usuarios, cuando pulso "Roles y permisos", entonces abro
      `/usuarios/roles` y veo `root`, `admin`, `operador1` y `operador2`, sin botón para
      agregar roles.
- [ ] Dado que estoy en Roles y marco o desmarco módulos de un rol y guardo, entonces el
      cambio queda aplicado y se muestra una confirmación.
- [ ] Dado que cambié módulos y no guardé, cuando pulso Descartar, entonces vuelven los
      valores guardados.
- [ ] Dado el rol `root`, cuando intento desmarcar *Usuarios*, entonces la casilla está
      bloqueada.
- [ ] Dado un usuario `operador2`, cuando entra al panel, entonces el menú solo muestra
      Dashboard, Agenda, Entregas y Vehículo.
- [ ] Dado un usuario `operador2`, cuando escribe `/finanzas` en la barra de direcciones,
      entonces no ve el contenido de Finanzas y es redirigido a su primer módulo.
- [ ] Dado un rol sin módulos, cuando inicia sesión, entonces ve el aviso "sin módulos
      asignados" y el menú está vacío.
- [ ] Dado que creo o edito un usuario, cuando abro el selector de rol, entonces solo
      aparecen los cuatro roles fijos.

## 7. Preguntas abiertas

- ¿El rol `root` puede tener más restricciones, o siempre tiene todos los módulos
  salvo el protegido (R3)?
- ¿Quién puede cambiar los módulos de `root`? Hoy solo quien tiene acceso a Usuarios.
- ¿El claim se llama `rol` en el token del backend? Hoy no existe API de autenticación.

## 8. Impacto en la documentación

- `docs/ESTADO.md`: actualizar `/usuarios` y agregar `/usuarios/roles`.
- `docs/specs/README.md`: agregar esta spec al índice.
- Backend `docs/FRONTEND_SPEC.md`: agregar roles, claim `rol` y endpoints de la sección 5.
- Backend `docs/DECISIONS.md`: registrar la decisión de roles fijos.
