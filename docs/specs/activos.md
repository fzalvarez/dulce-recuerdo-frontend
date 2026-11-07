# Spec: Activos

**Estado:** Implementada (front, datos de ejemplo)
**Fecha:** 2026-11-07
**Pantalla en el front:** `/activos`

## 1. Problema

El negocio tiene equipos que duran años y no se reponen (tapers de traslado, camillas,
mobiliario). No se controlan por stock, sino por estado, ubicación y revisiones.

## 2. Alcance

**Incluye:**
- Registro de activos con código, nombre, categoría, unidades, costo, fecha de compra,
  estado, ubicación, próxima revisión y observaciones.
- Indicadores: unidades en uso, equipos en reparación y revisiones pendientes.
- Búsqueda y filtros por categoría y estado.

**No incluye (por ahora):**
- Depreciación.
- Asignación a responsables.
- Historial de movimientos o de reparaciones.
- Consumibles (van en [inventario.md](./inventario.md)).

## 3. Reglas de negocio

- **R1 Categorías:** Traslado, Atención, Cremación, Mobiliario.
- **R2 Estados:** Operativo, En reparación, Dado de baja.
- **R3 Código único:** no puede repetirse. Se guarda en mayúsculas.
- **R4 Unidades:** entero, mayor o igual a 1.
- **R5 Costo:** mayor o igual a 0 (costo total pagado en soles).
- **R6 Revisión:** si se indica, no puede ser anterior a la fecha de compra.
- **R7 Vencida o próxima:** una revisión es *vencida* si su fecha es anterior a hoy;
  es *próxima* si cae dentro de los próximos 30 días.
- **R8 Unidades en uso:** suman todos los activos que no están dados de baja.

## 4. Modelo de datos (front)

Ver `src/features/activos/types.ts` (`Activo`). Datos de ejemplo en
`data/activos.mock.ts`.

## 5. Contrato con la API (backend)

Pendiente. No hay módulo de activos en el backend.

## 6. Criterios de aceptación

- [x] Dado un activo dado de baja, cuando se calculan las unidades en uso, entonces no suma.
- [x] Dado un activo con revisión en 20 días, cuando se muestra la tabla, entonces la fecha aparece en ámbar con "Próxima".
- [x] Dado un activo con revisión anterior a hoy, cuando se muestra la tabla, entonces aparece en rojo con "Vencida".
- [x] Dado un código repetido, cuando se registra, entonces se muestra el error y no se guarda.
- [x] Dado un activo sin ubicación, cuando se guarda, entonces se muestra "Indica dónde está el activo."

## 7. Preguntas abiertas

- ¿Los tapers se registran como un solo código con varias unidades (como ahora) o uno por unidad?
- ¿Hace falta registrar quién tiene cada activo?

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/activos`.
