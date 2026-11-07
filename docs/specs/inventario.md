# Spec: Inventario y Elementos

**Estado:** Implementada (front, datos de ejemplo)
**Fecha:** 2026-11-07
**Pantalla en el front:** `/inventario`

## 1. Problema

El crematorio consume y repone materiales: urnas, recuerdos, suministros
(guantes, agujas, pañales) y medicamentos para eutanasia y atención. Hace falta saber
cuánto hay de cada cosa y cuándo reponer.

## 2. Alcance

**Incluye:**
- Catálogo de elementos con SKU, categoría, stock actual y stock mínimo.
- Nivel de cada elemento: Óptimo, Stock bajo o Crítico.
- Alta y edición de elementos con vista previa y validaciones.
- Filtros por texto, categoría y nivel.
- Indicadores: elementos en nivel crítico, urnas disponibles y kits de recuerdo en stock.

**No incluye (por ahora):**
- Activos durables (tapers, camillas, mobiliario). Van en [activos.md](./activos.md).
- Lote, fecha de vencimiento y libro de control de medicamentos (ver preguntas).
- Movimientos guardados. El modal de movimiento existe pero aún no persiste.

## 3. Reglas de negocio

- **R1 Categorías:** urnas clásicas, urnas ecológicas, recuerdos, suministros
  operativos y medicamentos.
- **R2 Nivel:** Crítico si el stock es menor o igual a la mitad del mínimo; Stock bajo
  si el stock es menor que el mínimo; Óptimo en los demás casos.
- **R3 SKU único:** no puede repetirse en el catálogo. Se guarda en mayúsculas.
- **R4 Stock y mínimo:** enteros, mayores o iguales a 0.
- **R5 Indicadores:** se calculan a partir del catálogo actual; al editar un elemento
  se actualizan.

## 4. Modelo de datos (front)

Ver `src/features/inventario/pages/InventarioPage.tsx` (`ItemInventario`). El
catálogo está en el mismo archivo mientras no exista API.

## 5. Contrato con la API (backend)

Pendiente. El backend no tiene módulo de inventario.

## 6. Criterios de aceptación

- [x] Dado un elemento con stock 3 y mínimo 5, cuando se consulta, entonces su nivel es Stock bajo.
- [x] Dado un elemento con stock 1 y mínimo 4, cuando se consulta, entonces su nivel es Crítico.
- [x] Dado un SKU que ya existe, cuando se guarda un elemento nuevo, entonces se muestra "El SKU … ya existe en el catálogo."
- [x] Dado un nuevo elemento, cuando se guarda, entonces aparece en la tabla y en el contador de "Mostrando X de Y".
- [x] Dado un elemento en edición, cuando se guarda, entonces su SKU no se compara consigo mismo.

## 7. Preguntas abiertas

- Para medicamentos de eutanasia: ¿hace falta lote, fecha de vencimiento y registro de cada salida?
- El indicador "Valorización" es un valor fijo. ¿Se calcula con costo unitario por elemento?
- El manto térmico no existe en la operación; se quitó del catálogo y de las pantallas.

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/inventario`.
- Backend (cuando exista): `FRONTEND_SPEC.md`, `DOMAIN.md` y una spec propia en el back.
