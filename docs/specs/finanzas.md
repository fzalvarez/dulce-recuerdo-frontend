# Spec: Ingresos y Gastos (Finanzas)

**Estado:** Implementada (front, datos de ejemplo)
**Fecha:** 2026-11-07
**Pantalla en el front:** `/finanzas`

## 1. Problema

El negocio necesita ver, mes a mes, cuánto entra por servicios realizados y cuánto
sale en gastos fijos (local, servicios, personal, préstamos) y gastos variables
(combustible, mantenimiento, urnas, caja chica, etc.).

## 2. Alcance

**Incluye:**
- Resumen del mes: ingresos, gastos y resultado.
- Lista de ingresos del mes (solo lectura).
- Gastos fijos mensuales, editables.
- Gastos variables del mes: alta, edición y eliminación.
- Gastos registrados desde el módulo Vehículo, marcados con su origen.

**No incluye (por ahora):**
- Pagos de cuotas por mes (no hay marca de "pagado").
- Depreciación de activos.
- Comprobantes adjuntos.

## 3. Reglas de negocio

- **R1 Ingresos:** se generan por servicios realizados. No se capturan a mano.
- **R2 Gastos fijos:** se aplican todos los meses. Grupos: Local, Servicios,
  Personal y Préstamos. Los préstamos además guardan saldo pendiente.
- **R3 Gastos variables:** pertenecen al mes de su fecha. Categorías: Combustible,
  Mantenimiento del auto, Peajes y estacionamiento, Lavado y desinfección, Compra de
  urnas, Compras varias, Reparaciones, Caja chica.
- **R4 Origen:** un gasto variable puede venir de Vehículo (`origen = vehiculo`). Se
  etiqueta en la lista y se puede editar desde aquí, y el cambio se refleja en la
  bitácora de Vehículo.
- **R5 Resultado del mes:** ingresos del mes − (gastos fijos + gastos variables del mes).
- **R6 Montos:** un gasto variable debe ser mayor que 0. Un gasto fijo puede ser 0.
  El saldo pendiente de un préstamo no puede ser negativo.
- **R7 Selector de mes:** filtra ingresos y gastos variables. Los gastos fijos se
  muestran en todos los meses.
- **R8 Eliminar gasto variable:** pide confirmación con un segundo clic.

## 4. Modelo de datos (front)

Ver `src/features/finanzas/types.ts`:
- `GastoFijo`: id, nombre, grupo, montoMensual, saldoPendiente (solo préstamos).
- `GastoVariable`: id, fecha, categoria, concepto, monto, observaciones, origen,
  proveedor, kilometraje, galones.
- `Ingreso`: id, fecha, casoId, mascota, servicio, monto.

Los datos de ejemplo (`data/finanzas.mock.ts`) son valores de prueba. Los montos
reales de la empresa los confirma el dueño.

## 5. Contrato con la API (backend)

Pendiente. Ver `dulce-recuerdo-backend/docs/specs/finanzas-vehiculo.md` (propuesta
de `gastos_recurrentes`, `prestamos` y eventos de vehículo) y el resumen mensual
`GET /finanzas/resumen`.

## 6. Criterios de aceptación

- [x] Dado un mes sin servicios realizados, cuando se abre la pantalla, entonces el total de ingresos es S/ 0.00 y el resultado es negativo si hay gastos fijos.
- [x] Dado un gasto variable con monto 0, cuando se guarda, entonces se muestra el error "El monto debe ser mayor a 0."
- [x] Dado un gasto de Vehículo, cuando se edita en Finanzas, entonces la bitácora de Vehículo muestra el cambio.
- [x] Dado que se cambia de mes, cuando hay gastos variables de ese mes, entonces el total de gastos variables se recalcula; los gastos fijos no cambian.
- [x] Dado un gasto variable, cuando se pulsa eliminar una vez, entonces no se borra; al pulsar de nuevo, se borra.

## 7. Preguntas abiertas

- ¿Las cuotas de los préstamos y los sueldos cambian de un mes a otro, o son fijos?
- ¿Cuántos préstamos hay? Hoy son tres (Deuda 1, 2 y 3); el usuario mencionó que podrían ser cuatro.
- ¿Se necesita marcar qué gastos fijos ya se pagaron en el mes?

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/finanzas`.
- Backend: `docs/FRONTEND_SPEC.md` y `docs/STATUS.md` cuando se conecte la API.

## 9. Gastos mensuales y anuales (2026-11-08)

Cada gasto fijo tiene un monto y una frecuencia:
- **Mensual:** se aplica cada mes.
- **Anual:** se aplica solo en su mes de pago (`mesPago`). Por ejemplo, el seguro del vehículo se paga en enero.

Los gastos fijos de un mes suman los mensuales y los anuales que se pagan ese mes.
Valores confirmados por el dueño: alquiler, internet y 2 líneas móviles, contabilidad, Susii,
declaración anual de contabilidad (abril) y seguro del vehículo (enero). Luz, agua, sueldos y
préstamos siguen con valores de ejemplo, pendientes de confirmar.
