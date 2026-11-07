# Spec: Reportes

**Estado:** Aprobada (pedido directo del usuario, 2026-11-07)
**Fecha:** 2026-11-07
**Pantalla en el front:** `/reportes`

## 1. Problema

La empresa se revisa cada 3 o 6 meses. Hoy no hay un lugar donde ver cuántas
cremaciones se hicieron, si subieron o bajaron, cómo se comparan con el año anterior,
de dónde llegan (particulares o veterinarias aliadas) y en qué distritos se concentran.

## 2. Alcance

**Incluye, en una sola pantalla con seis reportes:**

1. **Cremaciones por mes:** barras de un solo año, con el número encima de cada barra,
   el mes debajo y la variación respecto al mes anterior.
2. **Mes contra mismo mes del año anterior:** dos barras por mes (período y año anterior),
   con la variación interanual.
3. **Particulares, año contra año:** igual que el 2, solo con clientes directos.
4. **Veterinarias aliadas, año contra año:** igual que el 2, solo con referidos de
   veterinarias.
5. **Top 5 veterinarias referidoras:** las cinco veterinarias que más cremaciones aportan
   en el período.
6. **Distritos:** lista de distritos que pidieron cremaciones, con el top 5 destacado.

**No incluye (por ahora):**
- Exportar a PDF o Excel.
- Costos o ingresos por reporte (los ingresos viven en Finanzas).
- Reportes guardados o programados.

## 3. Reglas de negocio

- **R1 Período:** el usuario elige la longitud (3 o 6 meses) y el mes final. El mes final
  por defecto es el último mes completo.
- **R2 Mes en curso:** si el mes final incluye el mes actual, ese mes aparece marcado como
  "parcial" y su variación no se usa para conclusiones; se muestra una nota con la fecha
  de corte.
- **R3 Variación mensual:** `(mes − mes anterior) / mes anterior × 100`. Si el mes anterior
  es 0, se muestra "—".
- **R4 Variación interanual:** `(mes − mismo mes del año anterior) / mismo mes × 100`.
- **R5 Canal:** "particular" = cliente directo; "veterinaria" = caso referido por una
  veterinaria aliada. Particulares + veterinarias = total.
- **R6 Referidos:** la cantidad de referidos de una veterinaria es la cantidad de
  cremaciones de casos con esa veterinaria en el período.
- **R7 Top 5:** se ordena de mayor a menor. Empates: primero el nombre en orden alfabético.
- **R8 Distritos:** se cuentan todas las cremaciones del período, sin importar el canal.
  Los cinco primeros se destacan; el resto aparece en gris.
- **R9 Tabla:** cada gráfico tiene una vista de tabla con los mismos datos.

## 4. Modelo de datos (front)

Ver `src/features/reportes/types.ts`:

- `CasoReportable`: id, fecha (YYYY-MM-DD), canal, veterinariaId (si aplica), distrito.

Los datos de ejemplo (`data/casos.mock.ts`) son sintéticos y reproducibles: un generador
con semilla fija produce los mismos casos en cada carga. Los totales mensuales de
2024 a 2026 están fijados en el mismo archivo.

## 5. Contrato con la API (backend)

Pendiente. Para que el reporte sea real hacen falta, en el back:

- Fecha de realización de cada cremación (hoy existe en `agenda` / `entregas`, no como
  dato de reporte).
- Canal del caso y `veterinaria_id` (existen en `caso`).
- **Distrito del caso.** Hoy solo existe en `agenda` cuando el servicio es a domicilio.
  Para el reporte de distritos hay que decidir si se toma de la dirección del servicio
  o del cliente.

Endpoint propuesto: `GET /reportes/cremaciones?desde=YYYY-MM&hasta=YYYY-MM` con los
conteos agregados por mes, canal, veterinaria y distrito. Evita que el front procese
todos los casos.

## 6. Criterios de aceptación

- [ ] Dado el período de 6 meses que termina en octubre de 2026, cuando se abre el reporte 1, entonces se muestran 6 barras con su número encima y el mes debajo.
- [ ] Dado que el mes final es noviembre de 2026, cuando se abre cualquier reporte, entonces noviembre aparece marcado como "parcial" y se muestra la fecha de corte.
- [ ] Dado el reporte 2, cuando se muestra un mes, entonces hay dos barras (mes del período y mismo mes del año anterior) y el porcentaje interanual debajo.
- [ ] Dado el reporte 3, cuando se cambia la longitud a 3 meses, entonces solo aparecen los particulares de esos 3 meses.
- [ ] Dado el reporte 5, cuando se muestra, entonces aparecen como máximo 5 veterinarias ordenadas por referidos, cada una con su porcentaje sobre el total de referidos.
- [ ] Dado el reporte 6, cuando hay distritos empatados en el quinto lugar, entonces ambos se ordenan alfabéticamente y solo cinco quedan destacados.
- [ ] Dado cualquier reporte, cuando se activa "Ver tabla", entonces se muestran los mismos valores en una tabla.

## 7. Preguntas abiertas

- ¿El reporte se revisa por trimestre (3 meses) o por semestre (6 meses) siempre con el mismo corte, o el usuario elige el mes final?
- ¿Un caso de domicilio cuenta para el distrito del cliente o del lugar de la cremación?
- ¿Se quiere ver también el ingreso por cada veterinaria en el top 5?

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/reportes`.
- `docs/specs/README.md`: índice.
- Backend: `GET /reportes/cremaciones` cuando exista, con su propia spec en el back.
