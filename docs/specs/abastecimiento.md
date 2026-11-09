# Spec: Análisis de abastecimiento (maqueta)

**Estado:** Implementada como maqueta (2026-11-08)
**Pantalla en el front:** `/reportes`, reporte "Planes vendidos", panel a la derecha

## 1. Problema

Las ventas por plan no dicen cuánto insumo hay que comprar ni cuándo. Se quiere cruzar
las ventas con el consumo de cada variante (plan × rango de peso) para anticipar
faltantes y pedidos.

## 2. Alcance de la maqueta

- Consumo del período por insumo, según las ventas por plan y rango de peso.
- Proyección mensual con tendencia lineal de 12 meses por plan.
- Stock, necesidad a 3 meses, cobertura en días y estado (crítico, atención, OK).
- Fecha sugerida de pedido según el tiempo de entrega del proveedor.
- Conclusiones generadas a partir de los números.

## 3. Reglas

- La receta por variante vive en `data/abastecimiento.mock.ts`. Es un supuesto de maqueta.
- Pedir cubre el consumo hasta que llegue el pedido más 30 días de colchón, sin bajar del mínimo.
- Estado crítico: la cobertura es menor que el tiempo de entrega. Atención: se debe pedir en 14 días o menos.
- Las cremaciones "sin clasificar" no tienen receta y no consumen insumos.

## 4. Limitaciones

- Recetas, stock, proveedores y tiempos de entrega son ficticios.
- Los insumos no están enlazados al módulo de Inventario (ahí hay urnas, suministros y medicamentos distintos).
- La proyección es lineal y no considera estacionalidad.

## 5. Pendiente

- Confirmar cada receta por variante con la operación.
- Enlazar stock y mínimos con el módulo de Inventario cuando exista API.
- Incorporar dos años de histórico en la tendencia (hoy usa 12 meses).
