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

## 9. Ampliación 2026-11-08

**Pedido directo del usuario.** Se agregan dos reportes y cambia la temporalidad.

### Temporalidad

Los reportes se pueden ver en períodos de **3, 6, 9 o 12 meses**, terminando en el mes
que se elija. Aplica a todos los reportes de la pantalla.

### 7. Planes vendidos

Cremaciones vendidas por plan de cremación: Dulce Recuerdo Clásico, Dulce Recuerdo
Eco, Dulce Recuerdo Paz y, como cuarto caso opcional, Sin clasificar.

- Barras horizontales ordenadas por ventas, con la cantidad y el % del total.
- Tabla con el mismo dato y una fila de total.
- Dos datos extra bajo el gráfico, con % sobre el total de ventas del período:
  - **Presencialidad:** cuántas ventas fueron presenciales y cuántas no.
  - **Eutanasia:** cuántas cremaciones se hicieron con eutanasia y cuántas no.

### 8. Peso de la mascota

Cremaciones por rango de peso de la mascota: 0 a 5 kg, 5,1 a 15 kg, 15,1 a 25 kg,
25,1 a 35 kg y 35,1 kg o más.

- Columnas verticales con la cantidad y el % del total debajo de cada rango.
- Tabla con los mismos datos y una fila de total.

### Reglas nuevas

- **R10 Plan:** cada venta tiene un plan. "Sin clasificar" es un caso aparte: se muestra
  en gris y no se cuenta como plan.
- **R11 Presencialidad:** cada venta indica si incluyó presencialidad. Presencial +
  no presencial = total de ventas del período.
- **R12 Eutanasia:** cada venta indica si incluyó eutanasia. Con eutanasia + sin eutanasia
  = total de ventas del período.
- **R13 Peso:** el peso de la mascota es un dato siempre presente. Los rangos son
  cerrados por arriba: 5 kg cae en "0 a 5 kg" y 5,1 kg en "5,1 a 15 kg".
- **R14 Porcentajes:** todo porcentaje muestra su base (total del período) en la
  pantalla o en la tabla.

### Datos

Se agregan a cada caso: `plan`, `presencial`, `eutanasia` y `pesoKg`. Se agrega el año
2023 a los datos de ejemplo, para que la comparación interanual de 12 meses tenga año
anterior.

### Criterios de aceptación (ampliación)

- [ ] Dado un período de 6 meses, cuando se abre "Planes vendidos", entonces la suma de los cuatro planes es igual al total de ventas del período.
- [ ] Dado el extra de presencialidad, cuando se muestra, entonces presencial + no presencial = total de ventas y ambos % suman 100%.
- [ ] Dado el extra de eutanasia, cuando se muestra, entonces con eutanasia + sin eutanasia = total de ventas.
- [ ] Dado un caso de 5 kg exactos, cuando se clasifica, entonces cae en "0 a 5 kg".
- [ ] Dado "Peso de la mascota", cuando se muestra la tabla, entonces la suma de los rangos es igual al total y el % total es 100%.
- [ ] Dado el período de 12 meses, cuando se cambia a "Vs. año anterior", entonces cada mes tiene su barra del año anterior con valor real (no cero por falta de datos).

### Preguntas abiertas (ampliación)

- ¿El peso se toma al ingreso del cuerpo o al momento de la venta? Afecta a qué precio por kilo aplica.
- ¿"Sin clasificar" significa venta sin plan asignado o plan que aún no se define?

## 10. Rutas por reporte (2026-11-08)

Cada reporte tiene su propia URL, para compartirlo y abrirlo directo:

| Reporte | Ruta |
|---|---|
| Cremaciones por mes | `/reportes/cremaciones-mes` |
| Vs. año anterior | `/reportes/vs-anio-anterior` |
| Particulares | `/reportes/particulares` |
| Veterinarias aliadas | `/reportes/veterinarias-aliadas` |
| Top 5 veterinarias | `/reportes/top-veterinarias` |
| Distritos | `/reportes/distritos` |
| Planes vendidos | `/reportes/planes-vendidos` |
| Peso de la mascota | `/reportes/peso-mascota` |

`/reportes` redirige a `/reportes/cremaciones-mes`. El período y el mes final se conservan al cambiar de reporte.
