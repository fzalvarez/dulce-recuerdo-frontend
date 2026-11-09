# Spec: Dashboard (estado de hoy)

**Estado:** Implementada como maqueta (2026-11-08)
**Pantalla en el front:** `/` (Dashboard)

## 1. Objetivo

Ver de un vistazo el estado actual de la operación: hoy, la semana en curso y el mes en curso,
todo junto, sin filtros. Lo que conviene revisar aparece en mensajes y alertas, con lo más
urgente arriba.

## 2. Contenido

- **Hoy:** servicios agendados para hoy con hora, mascota, servicio y modalidad.
- **Semana en curso** (lunes a hoy) y **este mes** (día 1 a hoy): cremaciones con su reparto
  particulares y veterinarias, cobrado, y comparación contra el período anterior de igual tramo.
  El mes muestra una proyección lineal al cierre, marcada como estimada.
- **Mensajes y alertas:** insumos que se agotan antes de su entrega (críticos) o con poca cobertura
  (Abastecimiento); pagos sin agendar; servicios realizados sin entregar; revisiones de activos
  vencidas o próximas; veterinarias que pierden actividad; oportunidades por distrito.
- **Casos abiertos:** cuántos casos hay en cada etapa (barra segmentada).
- **Cremaciones por día:** este mes frente al mismo tramo del mes anterior (líneas).
- **Planes del mes:** reparto de ventas por plan (dona).

## 3. Reglas

- Las alertas usan las mismas reglas que sus módulos de origen (Abastecimiento, Activos,
  Rendimiento de veterinarias, Oportunidades). El dashboard no tiene reglas propias.
- Un caso sin pagos que lleva 7 días sin mensajes aparece como abandonado y no genera alerta.
- Las alertas se ordenan: urgente, revisar, para saber.

## 4. Fuentes y limitaciones (maqueta)

- Cremaciones, cobros y comparaciones: datos de Reportes, que llegan hasta el 7 de noviembre.
- Agenda, casos y pipeline: datos de Casos (8 casos de ejemplo). Son fuentes distintas, por
  eso los números de agenda y de cremaciones no se cruzan entre sí.
- Insumos y veterinarias: datos de maqueta de Reportes.

## 5. Pendiente

- Conectar cremaciones, cobros y casos a la API cuando exista.
- Revisar con la operación qué alertas son útiles y cuáles sobran.
