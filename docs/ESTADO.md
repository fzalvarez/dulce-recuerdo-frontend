# Estado de las pantallas — dulce-recuerdo-frontend

Actualizado el 2026-11-09 (Fase 9: conexión con el backend).

**Todas las pantallas leen y guardan en la API del backend.** No quedan datos de ejemplo
en el código. La reglas de negocio (precios, estados, reportes, alertas) las calcula el
backend; el front solo muestra y envía.

Verificado con `tsc`, `oxlint`, `vite build` y la prueba de contrato del backend
(`tests/test_contrato_front.py`, que envía los mismos cuerpos que estas pantallas).
**No se ha probado en el navegador contra un backend real**, porque todavía no hay
PostgreSQL. Ver "Pendiente".

| Ruta | Pantalla | Estado | Endpoints del backend | Spec (backend) |
|---|---|---|---|---|
| `/auth/signin` | Inicio de sesión | Conectada | `POST /auth/login`, `GET /auth/me` | `auth-roles` |
| `/` | Dashboard | Conectada | `GET /dashboard` | `reportes` §4.4 |
| `/casos` | Casos | Conectada | `/casos/bandeja`, `/casos/opciones`, `POST /casos`, `/casos/{id}/detalle`, `/realizado`, `/cancelar`, `/precio`, `/casos/materiales`, `/pagos`, `/tarifas/calcular`, `/clientes`, `/mascotas` | `caso-flujo`, `tarifas`, `inventario` |
| `/agenda` | Agenda | Conectada (día y semana, reprogramar) | `/agenda/calendario`, `PATCH /agenda/{id}` | `caso-flujo` §9 |
| `/veterinarias` | Veterinarias | Conectada (convenio, precio propio, facturación) | `/veterinarias`, `/veterinarias/catalogo`, `/veterinarias/{id}/precios`, `/facturas-veterinaria` | `tarifas`, `facturacion` |
| `/entregas` | Entregas | Conectada | `/entregas/pendientes`, `POST /entregas/{id}` | `caso-flujo` |
| `/clientes` | Clientes | Conectada | `/clientes` | `ficha-cliente-mascota` |
| `/mascotas` | Mascotas | Conectada | `/mascotas`, `/clientes` | `ficha-cliente-mascota` |
| `/planes` | Planes y tarifas | Conectada | `/planes`, `/tarifas` | `tarifas` |
| `/finanzas` | Ingresos y Gastos | Conectada | `/finanzas/*`, `/gastos` | `finanzas` |
| `/vehiculos` | Vehículo | Conectada (ficha, SOAT, CITV, bitácora) | `/vehiculos`, `/vehiculos/{id}/eventos` | `finanzas` §2.4 |
| `/inventario` | Inventario | Conectada (movimientos, proveedores) | `/inventario/*` | `inventario` |
| `/activos` | Activos | Conectada | `/activos` | `inventario` §3 |
| `/reportes/*` | Reportes | Conectada (9 reportes y 3 paneles) | `/reportes/*` | `reportes` |
| `/usuarios` | Usuarios | Conectada | `/usuarios` | `auth-roles` |
| `/usuarios/roles` | Roles y permisos | Conectada | `/roles` | `auth-roles` |
| `/servicios` | Servicios | Placeholder | (`/servicios` existe, pero el caso no lo usa) | — |
| `/configuracion` | Configuración | Placeholder | — | — |

## Cómo está hecho

- `src/shared/lib/axios.ts`: cliente con el token; un 401 cierra la sesión.
- `src/shared/lib/http-error.ts`: lee el formato `{code, message, details}` del backend.
- `src/shared/hooks/useRecurso.ts`: carga datos y permite `recargar()` después de guardar.
- `src/shared/utils/ejecutar.ts`: ejecuta una acción con aviso de éxito o error.
- Cada módulo tiene `api.ts` con sus llamadas y tipos que copian los del backend
  (montos como texto decimal, por ejemplo `"500.00"`).
- Los módulos permitidos vienen de `GET /auth/me` y se guardan en la sesión.

## Cambios de comportamiento respecto de la maqueta

- Casos: estados `AGENDADO`, `REALIZADO`, `ENTREGADO`, `CANCELADO`. No hay "en conversación"
  ni "abandonado": solo se registran servicios contratados, con pago inicial.
- Veterinarias: sin comisiones. Precio por tipo de convenio y factura cuando el admin decide.
- Planes: el precio de veterinaria va por tipo de convenio, no por plan.
- Finanzas: gastos fijos con monto real por mes; la categoría "Adicionales del personal" es nueva.
- Abastecimiento: usa el consumo real de inventario, no recetas supuestas.
- El menú agrupa Clientes y Mascotas bajo "Fichas".

## Pendiente

- Probar en el navegador contra el backend con PostgreSQL (TD-010 del backend).
- Servicios y Configuración siguen como placeholder.
- WhatsApp y recuperación de contraseña (backend).
- Las specs de `docs/specs/` de este repo describen la maqueta; las vigentes son las del backend.
