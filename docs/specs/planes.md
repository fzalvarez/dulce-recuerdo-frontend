# Spec: Planes y precios

**Estado:** Aprobada (pedido directo del usuario, 2026-11-08)
**Fecha:** 2026-11-08
**Pantalla en el front:** `/planes`

## 1. Problema

La pantalla tenía botones que no tenían un uso claro ("Ajuste" por fila, "Duplicar",
"Desactivar", "Gestionar zonas" junto a "Editar distritos") y varias acciones que solo
mostraban un aviso. Hacía falta menos botones, con nombres que digan lo que hacen.

## 2. Alcance

**Incluye:**
- Planes de cremación: editar datos y precios en un solo formulario; pausar y reactivar la venta.
- Nuevo plan.
- Servicios complementarios: editar y crear.
- Traslado por zonas: editar precio y distritos de cada zona.
- Recargo de horario punta: editar franjas y monto.

**No incluye (por ahora):**
- Duplicar planes.
- Historial de cambios de precio.
- Vigencia por fechas (el período se muestra solo como texto).

## 3. Reglas de negocio

- **R1 Rangos de peso:** los mismos que usan los reportes: 0 a 5 kg, 5,1 a 15 kg,
  15,1 a 25 kg, 25,1 a 35 kg y 35,1 kg o más.
- **R2 Precios:** cada rango tiene un precio para la veterinaria y un precio al público.
  El precio al público debe ser mayor que cero y no menor que el de la veterinaria.
- **R3 Ganancia de la veterinaria:** precio al público − precio veterinaria. El porcentaje
  se calcula sobre el precio al público y se muestra redondeado.
- **R4 Pausar venta:** un plan pausado sigue en la lista, marcado como "Pausado", y no
  aparece como opción para nuevas cotizaciones. Se puede reactivar.
- **R5 Traslado:** cada zona tiene un precio y una lista de distritos. Un distrito puede
  estar en una sola zona.
- **R6 Recargo punta:** monto en soles por traslado dentro de las franjas indicadas. Un
  monto de 0 desactiva el recargo.

## 4. Modelo de datos (front)

Ver `src/features/planes/pages/PlanesPage.tsx`. Datos de ejemplo en la misma página
mientras no exista API.

## 5. Contrato con la API (backend)

Pendiente. El backend tiene módulo `planes` con CRUD básico (sin precios por rango).
Hace falta decidir si los precios por peso viven en `planes` o en una tabla propia.

## 6. Criterios de aceptación

- [ ] Dado un plan, cuando se abre "Editar", entonces se ven sus datos y los cinco precios por peso.
- [ ] Dado un precio al público menor que el de la veterinaria, cuando se guarda, entonces se muestra el error y no se guarda.
- [ ] Dado un plan, cuando se pulsa "Pausar venta", entonces aparece como "Pausado" y el botón cambia a "Reactivar venta".
- [ ] Dado "Nuevo plan", cuando se guarda con nombre y precios válidos, entonces aparece en la lista como activo.
- [ ] Dado el traslado, cuando se edita una zona, entonces se actualiza su precio y su lista de distritos.
- [ ] Dado el recargo, cuando se guarda con 0, entonces el recargo aparece como desactivado.

## 7. Preguntas abiertas

- El pacto con veterinarias dice 25% a 35% de ganancia. El plan Eco tiene entre 9% y 19%, y
  el Clásico entre 15% y 26%. ¿Es intencional o hay que revisar los precios?
- "Sin clasificar" aparece en los reportes de ventas. ¿Debe existir como plan en esta pantalla?
- ¿El "Precio al público" de un traslado o recargo se suma a la cremación o va aparte?

## 8. Impacto en la documentación

- `docs/ESTADO.md`: fila de `/planes`.
- `docs/specs/README.md`: índice.
