# Spec: Oportunidades comerciales por distrito (maqueta)

**Estado:** Implementada como maqueta (2026-11-08)
**Pantalla en el front:** `/reportes`, reporte "Distritos", panel a la derecha

## 1. Problema

El mapa de distritos dice dónde se piden cremaciones, pero no dónde conviene crecer.
Se quiere cruzar demanda, crecimiento, composición de clientes, ingreso y plan principal
para señalar oportunidades, sin tomar como oportunidad un distrito solo por tener pocas ventas.

## 2. Datos que usa (todos existen en el sistema de reportes)

- Cremaciones por distrito, por canal (particular o veterinaria) y por plan.
- Ingreso = precio del plan según el rango de peso (tabla de planes). No incluye traslado,
  porque el reporte no tiene la modalidad a domicilio. Las cremaciones sin plan clasificado
  no suman ingreso.
- Período actual y período anterior de la misma longitud.

## 3. Reglas

- **Alta demanda:** los tres distritos con más cremaciones en el período.
- **Crece:** sube al menos 15% frente al período anterior, con mínimo 5 cremaciones.
- **Gana terreno:** crece y además su participación en la ciudad sube. Sirve para distinguir
  los distritos que crecen por encima del total.
- **Oportunidad:** tiene alta demanda o crece, y menos de 35% de sus cremaciones vienen de
  veterinarias. Un distrito con pocas ventas no es oportunidad si no crece ni tiene demanda.
- **Conclusiones:** cada una cita el dato que la justifica. No se recomiendan campañas.

## 4. Supuestos de maqueta

- Los pesos por distrito de 2026 y la afinidad de cada distrito con veterinarias son ficticios
  (generador en `data/casos.mock.ts`). Los totales mensuales no cambian.
- El ingreso usa la tabla de precios de planes, sin traslado ni recargos.

## 5. Pendiente

- Incluir la modalidad a domicilio para sumar traslado al ingreso por distrito.
- Confirmar con la operación los umbrales (15%, 35%, 3 o 5 cremaciones).
- Usar datos reales de canal y distrito cuando exista el endpoint de reportes.
