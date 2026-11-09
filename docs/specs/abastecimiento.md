# Spec: Análisis de abastecimiento (maqueta)

**Estado:** Implementada como maqueta (2026-11-08)
**Pantalla en el front:** `/reportes`, reporte "Planes vendidos", panel a la derecha

## 1. Problema

Las ventas por plan no dicen cuánto insumo hay que comprar ni cuándo. Se quiere cruzar
las ventas con los insumos que usa cada cremación para anticipar faltantes y pedidos.

## 2. Alcance

- Por cada insumo: stock, lo que se usará en 3 meses y cobertura en días.
- Solo se muestran los insumos con alerta, con cuántas unidades comprar y hasta cuándo.
- Dos o tres conclusiones cortas.

## 3. Recetas (texto oficial de cada plan)

- **Clásico:** urna casita (chica hasta 15 kg, grande desde 15,1 kg), maceta con suculenta,
  portarretrato (marquito de madera), placa (plaquita), papel fotográfico y certificado.
- **Paz:** urna rectangular (chica o grande según el peso), maceta, marquito, huella en
  cerámica, placa, papel fotográfico y certificado.
- **Eco:** caja de trupán y certificado.
- **Compartidos** (una vez por cremación, en los tres planes): sobre, bolsa de cartón y certificado.
  El papel fotográfico no se repite entre planes.

Recetas en `data/abastecimiento.mock.ts`.

## 4. Reglas

- Pedir cubre el consumo hasta que llegue el pedido, más 30 días de colchón, sin bajar del mínimo.
- Crítico: la cobertura es menor que el tiempo de entrega. Atención: hay que pedir en 14 días o menos.
- Un insumo con stock OK no muestra acción de compra.
- Las cremaciones sin plan clasificado no tienen receta y no descuentan insumos.

## 5. Supuestos y preguntas abiertas

- Tamaño de urna según el peso (chica hasta 15 kg, grande desde 15,1 kg) y tipo de urna por plan: supuesto.
- Plaquita: una por urna en Clásico y Paz: supuesto.
- Sobre, bolsa y certificado: una por cremación en los tres planes: supuesto.
- **Eco:** el texto oficial no menciona la foto, pero antes se indicó que sí. Hoy no se
  descuenta papel fotográfico en Eco.
- **Clásico:** el texto de planes indica "Certificado de autenticidad" en el kit. Se usa el
  certificado de cremación. ¿Es el mismo documento?
- Stock, tiempos de entrega y proveedores son ficticios.
- Los insumos no están enlazados al módulo de Inventario.
- La proyección es lineal y no considera estacionalidad.

## 6. Pendiente

- Confirmar recetas, stock y entregas con la operación.
- Enlazar stock y mínimos con el módulo de Inventario cuando exista API.
- Usar dos años de histórico en la tendencia (hoy usa 12 meses).
