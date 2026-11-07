# Spec: Vehículo

**Estado:** Implementada (front, datos de ejemplo)
**Fecha:** 2026-11-07
**Pantalla en el front:** `/vehiculos`

## 1. Problema

El vehículo de traslado genera gastos de combustible, mantenimiento, lavado y peajes.
Esos gastos tienen que quedar en la bitácora del vehículo y en Gastos del mes, sin
registrarlos dos veces.

## 2. Alcance

**Incluye:**
- Registro de eventos: combustible, mantenimiento programado, mantenimiento correctivo,
  lavado y desinfección, peajes y estacionamiento.
- Bitácora de combustible, leída de los registros de Gastos con origen Vehículo.
- Integración con [finanzas.md](./finanzas.md): cada evento aparece como gasto variable.

**No incluye (por ahora):**
- SOAT y CITV: son datos fijos en la pantalla. Su pago no entra a Gastos.
- Historial de mantenimientos de 2025: no tienen monto, así que no pasan a Gastos.
- Rendimiento y gasto promedio: son valores fijos.

## 3. Reglas de negocio

- **R1 Tipo → categoría:** combustible → Combustible; mantenimiento programado y
  correctivo → Mantenimiento del auto; lavado → Lavado y desinfección; peajes →
  Peajes y estacionamiento.
- **R2 Campos obligatorios:** fecha, kilometraje (mayor que 0), monto (mayor que 0) y
  proveedor. Si el tipo es combustible, también galones (mayor que 0).
- **R3 Concepto:** para combustible, "Gasolina 95 · N gal". En los demás tipos, el
  nombre del tipo.
- **R4 Bitácora:** muestra los gastos de origen Vehículo con categoría Combustible,
  del más reciente al más antiguo. Si no hay ninguno, muestra un mensaje.
- **R5 Doble registro:** un evento se guarda una sola vez, como gasto de Finanzas. La
  bitácora y Finanzas leen el mismo dato.

## 4. Modelo de datos (front)

El evento se guarda como `GastoVariable` con `origen = "vehiculo"`, `proveedor`,
`kilometraje` y, si es combustible, `galones`. Ver `src/features/finanzas/types.ts`.

## 5. Contrato con la API (backend)

Pendiente. Ver `dulce-recuerdo-backend/docs/specs/finanzas-vehiculo.md`: propone
`evento_vehiculo` y crear el gasto en la misma transacción (DEC-022).

## 6. Criterios de aceptación

- [x] Dado un registro de combustible con 10.5 galones, cuando se guarda, entonces aparece en la bitácora y en Gastos con el concepto "Gasolina 95 · 10.5 gal".
- [x] Dado un registro de combustible sin galones, cuando se guarda, entonces se muestra "Ingresa los galones cargados."
- [x] Dado un registro de mantenimiento, cuando se guarda, entonces no aparece en la bitácora de combustible.
- [x] Dado un registro guardado, cuando se abre Finanzas en su mes, entonces aparece con la etiqueta "Vehículo".

## 7. Preguntas abiertas

- ¿El pago de SOAT y CITV es un gasto? Si lo es, ¿con qué categoría?
- ¿Cuánto costó cada mantenimiento de 2025? Sin monto no se puede integrar.
- ¿Los lavados y peajes van en la misma bitácora o en una aparte?

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/vehiculos`.
- Backend: DEC-022 y `docs/specs/finanzas-vehiculo.md`.
