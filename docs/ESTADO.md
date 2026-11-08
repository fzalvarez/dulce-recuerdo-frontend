# Estado de las pantallas — dulce-recuerdo-frontend

Actualizado el 2026-11-07.

- **Ejemplo:** la pantalla funciona con datos en memoria (`data/*.mock.ts`). No hay API conectada.
- **Placeholder:** la pantalla todavía dice "en construcción".
- **Spec:** archivo en `docs/specs/` que describe la pantalla. "Sin spec" = todavía no se documentó.

| Ruta | Módulo | Estado | Spec | Depende de (backend) |
|---|---|---|---|---|
| `/` | Dashboard | Placeholder | Sin spec | Casos, agenda, entregas |
| `/casos` | Casos & Servicios | Ejemplo, flujo simplificado 2026-11-08 | [casos.md](specs/casos.md) | `casos` (back pendiente) |
| `/agenda` | Agenda & Rutas | Ejemplo | Sin spec | `agenda` |
| `/veterinarias` | Convenios Veterinarios | Ejemplo | Sin spec | `veterinarias`, `liquidaciones` |
| `/entregas` | Entregas | Placeholder | Sin spec | `entregas` |
| `/clientes` | Clientes | Placeholder | Sin spec | `clientes` |
| `/mascotas` | Mascotas | Placeholder | Sin spec | `mascotas` |
| `/servicios` | Servicios | Placeholder | Sin spec | `servicios` |
| `/planes` | Planes y precios | Ejemplo, rediseñada 2026-11-08 | [planes.md](specs/planes.md) | `planes` (precios por peso pendientes) |
| `/finanzas` | Ingresos y Gastos | Ejemplo | [finanzas.md](specs/finanzas.md) | `gastos`, casos (pendiente) |
| `/reportes` | Reportes | Ejemplo (datos sintéticos) | [reportes.md](specs/reportes.md) | `GET /reportes/cremaciones` (pendiente) |
| `/inventario` | Inventario | Ejemplo | [inventario.md](specs/inventario.md) | Sin backend |
| `/activos` | Activos | Ejemplo | [activos.md](specs/activos.md) | Sin backend |
| `/vehiculos` | Vehículo | Ejemplo, integrado con Finanzas | [vehiculo.md](specs/vehiculo.md) | `vehiculos`, eventos (pendiente) |
| `/usuarios` | Usuarios | Ejemplo | Sin spec | Sin backend (auth) |
| `/configuracion` | Configuración | Placeholder | Sin spec | — |
| `/signin` | Inicio de sesión | Simulado (`DEV_TOKEN`) | Sin spec | Auth (no existe) |

## Pendiente

- Escribir spec de las pantallas marcadas "Sin spec" antes de conectarlas al backend.
- Conectar primero las pantallas que ya tienen endpoint (clientes, mascotas, servicios, planes, casos).
- Decidir qué pasa con SOAT y CITV del vehículo (hoy son datos fijos).
