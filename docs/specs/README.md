# Specs — dulce-recuerdo-frontend

Cada feature del panel tiene su spec en esta carpeta, escrita con `_plantilla.md`
antes de implementarla (Spec-Driven Development). El contrato con la API está en el
repo del backend (`docs/FRONTEND_SPEC.md` y `docs/specs/`).

## Flujo

1. **Propuesta:** se escribe la spec. Estado `Propuesta`.
2. **Aprobación:** el usuario la revisa. Estado `Aprobada`.
3. **Implementación:** se escribe la pantalla con datos de ejemplo, y luego se conecta a la API.
4. **Cierre:** se actualiza [`../ESTADO.md`](../ESTADO.md). Estado `Implementada`.

## Índice

| Spec | Estado | Pantalla |
|---|---|---|
| [finanzas.md](./finanzas.md) | Implementada (datos de ejemplo) | `/finanzas` |
| [inventario.md](./inventario.md) | Implementada (datos de ejemplo) | `/inventario` |
| [activos.md](./activos.md) | Implementada (datos de ejemplo) | `/activos` |
| [vehiculo.md](./vehiculo.md) | Implementada (datos de ejemplo) | `/vehiculos` |
| [reportes.md](./reportes.md) | Aprobada, implementada con datos de ejemplo | `/reportes` |
| [planes.md](./planes.md) | Aprobada, implementada con datos de ejemplo | `/planes` |
| [casos.md](./casos.md) | Aprobada, implementada con datos de ejemplo | `/casos` (Cotizaciones se quita) |
| [abastecimiento.md](./abastecimiento.md) | Implementada como maqueta (datos ficticios) | `/reportes` (Planes vendidos) |
