# Spec: Casos (flujo simplificado)

**Estado:** Propuesta
**Fecha:** 2026-11-08
**Pantalla en el front:** `/casos`, y se elimina `/cotizaciones` del menú

## 1. Problema

El flujo real es: la familia escribe por WhatsApp, pregunta precio, se define presencial
o no presencial, se coordina, paga y se recoge o se lleva la mascota. La cotización
ocurre en el chat y casi nunca se cierra con un "no" explícito: muchos casos simplemente
se quedan sin respuesta. La pantalla actual tiene más pasos y más campos que ese flujo,
y el módulo de Cotizaciones registraría datos que no se usan.

## 2. Alcance

**Incluye:**
- Un solo caso por familia y mascota, desde el primer mensaje hasta la entrega.
- Un formulario corto para abrir el caso.
- Estados operativos claros y un estado final de abandono sin motivo obligatorio.
- Precio acordado guardado en el caso, con su desglose (plan, peso, traslado, complemento).
- Eutanasia como extra de una cremación, o como servicio independiente.
- Botón para copiar el mensaje de cotización que se pega en WhatsApp.

**No incluye (por ahora):**
- Módulo de Cotizaciones con registro por cada propuesta.
- Motivo obligatorio de abandono.
- Captura automática desde WhatsApp (ver sección 8).

## 3. Estados del caso

Estado operativo del caso (lo que se ve en el pipeline):

| Estado | Qué significa |
|---|---|
| En conversación | Caso abierto, todavía no hay pago |
| Agendado | Hay fecha y hora confirmadas |
| Realizado | El servicio ya se hizo |
| Entregado | La familia recibió la urna o la mascota fue entregada |
| Abandonado | Estado final. La familia dejó de responder. No requiere motivo |

Estado de pago (derivado de los pagos, no es un estado del caso):

- Pendiente, Parcial o Pagado. Se muestra junto al estado operativo y se puede filtrar.

Ver la sección 7 para la pregunta sobre pagado y agendado.

## 4. Reglas de negocio

- **R1 Un caso por mascota y servicio.** Una familia puede tener varios casos (distintas
  mascotas o servicios), pero el caso no se duplica por cada mensaje.
- **R2 Sin cotización como registro.** El precio acordado vive en el caso. Si el precio
  cambia, se actualiza el precio del caso y no se guarda historial de propuestas.
- **R3 Precio calculado.** El precio sale de: plan, rango de peso, zona de traslado,
  recargo por horario punta y complemento. El sistema lo calcula; no se escribe a mano.
- **R4 Eutanasia como extra.** En una cremación, la eutanasia es un complemento: se marca
  como "incluye eutanasia" y no cambia el tipo de servicio.
- **R5 Eutanasia sola.** Es un servicio independiente con su propio precio. Es un ingreso
  aparte y no cuenta como cremación en los reportes de cremaciones.
- **R6 Presencial o no presencial.** Cada cremación indica si la familia estuvo presente.
  La modalidad domicilio aplica al traslado y se refleja en el precio.
- **R7 Abandono.** Un caso se marca como abandonado manualmente. No pide motivo. Sale del
  pipeline activo, pero queda en el histórico.
- **R8 Ingresos.** Los ingresos de Finanzas salen de los pagos registrados en los casos,
  no del precio acordado.

## 5. Formulario de apertura (mínimo)

Obligatorios:
- Nombre del tutor
- Teléfono
- Nombre de la mascota
- Especie
- Servicio: cremación o eutanasia
- Modalidad: presencial, no presencial o domicilio

Opcionales (se completan en el caso):
- Peso (obligatorio antes de cotizar una cremación, porque define el precio)
- Plan, zona o distrito, dirección, fecha y hora, complemento, pagos, DNI, color, raza,
  edad, sexo, veterinaria referidora.

## 6. Criterios de aceptación

- [ ] Dado un caso nuevo con los campos obligatorios, cuando se guarda, entonces aparece en "En conversación".
- [ ] Dado una cremación sin peso, cuando se intenta copiar el mensaje de cotización, entonces se pide el peso antes.
- [ ] Dado un caso con pago parcial, cuando se ve en el pipeline, entonces muestra "Pago parcial" y su saldo.
- [ ] Dado un caso marcado como abandonado, cuando se abre el pipeline, entonces ya no aparece entre los activos, pero sigue en el histórico.
- [ ] Dado una eutanasia sola, cuando se revisan los reportes de cremaciones, entonces no aparece como cremación.
- [ ] Dado una cremación con eutanasia incluida, cuando se revisan los reportes, entonces cuenta como cremación y como eutanasia.

## 7. Preguntas abiertas

- ¿El caso puede quedar "Agendado" antes de tener pago, o el orden siempre es pago y luego agenda?
- ¿El abandono se marca a mano o pasa solo después de X días sin mensajes?
- ¿Cuánto cuesta la eutanasia sola? ¿Tiene traslado aparte?
- ¿Entregado es igual para retiro en sede y para entrega a domicilio?

## 8. Impacto en el back

Cambios necesarios en `dulce-recuerdo-backend` (se documentan aquí y se implementan después):

- `CasoEstado` pasa a: `EN_CONVERSACION`, `AGENDADO`, `REALIZADO`, `ENTREGADO`, `ABANDONADO`.
  Los estados `INFORMADO`, `PENDIENTE_DATOS`, `COTIZADO`, `PENDIENTE_PAGO`, `PAGADO_PARCIAL`,
  `EN_PROCESO`, `PENDIENTE_ENTREGA` y `LISTO_ENTREGA` se eliminan o pasan a derivados.
- `ServicioTipo`: quitar `EUTANASIA_CREMACION` y usar `CREMACION` o `EUTANASIA` más un
  campo `eutanasia_incluida` (booleano).
- Tabla `cotizacion`: se elimina o queda como histórico; el precio se guarda en el caso.
- Precio calculado por un endpoint que devuelve el desglose, por ejemplo
  `POST /casos/{id}/precio`.
- Reportes de cremaciones filtran por `tipo = CREMACION`. Eutanasia sola tiene su propio
  reporte de ingresos.

## 9. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/casos` y de `/cotizaciones`.
- Backend: `DOMAIN.md` (secciones 6 y 9), `DECISIONS.md` (nueva decisión sobre cotización
  como precio del caso) y `FRONTEND_SPEC.md`.
