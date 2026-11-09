# CLAUDE.md — dulce-recuerdo-frontend

Guía de entrada para IA y colaboradores. Leer antes de cambiar código o docs.

## Qué es

Panel de administración de Dulce Recuerdo. React 19 + TypeScript + Vite +
Tailwind 4 + componentes Radix/shadcn. **Todas las pantallas usan la API del
backend** (`VITE_URL_CONEXION`). Las reglas de negocio viven en el backend: el front
no calcula precios, estados ni reportes. Contrato: `docs/STATUS.md` §3 del backend y
su prueba `tests/test_contrato_front.py`.

## Comandos

- Instalar: `pnpm install` (el repo usa `pnpm-lock.yaml`).
- Desarrollo: `pnpm dev`.
- Build: `pnpm build` (`tsc -b && vite build`).
- Lint: `pnpm lint` (oxlint).
- Antes de hacer commit: `npx tsc -b` y `npx oxlint` sin errores nuevos.

## Documentos

| Documento | Para qué |
|---|---|
| `docs/specs/` | Spec de cada feature nueva (Spec-Driven Development) |
| `docs/ESTADO.md` | Qué pantalla usa datos de ejemplo y qué spec la describe |
| `references/` | Mockups HTML de diseño. No se ejecutan en la app |
| Repo del backend, `docs/FRONTEND_SPEC.md` | Lo que la API permite hoy |

## Flujo SDD

Igual que en el backend: antes de implementar una feature nueva se escribe su
spec en `docs/specs/<feature>.md` con `docs/specs/_plantilla.md`. Las pantallas
que ya existen se describen en `docs/ESTADO.md`.

## Estructura de una feature

```
src/features/<modulo>/
├── pages/        página principal (default export)
├── components/   diálogos y piezas reutilizables del módulo
├── api.ts        llamadas a la API del módulo
├── utils/        formato de montos y fechas
└── types.ts      tipos que copian los del backend (montos como texto decimal)
```

## Convenciones

- Interfaz y nombres de dominio en español.
- Montos en soles con `Intl` `es-PE` (ver `src/features/finanzas/utils/periodo.ts`).
- Diálogos de alta y edición: el formulario es un componente aparte dentro de
  `<DialogContent>`. Radix desmonta el contenido al cerrar, así que el estado se
  reinicia solo. No sincronizar estado con `useEffect` (el linter lo marca).
- Validar en el submit y mostrar el error bajo el formulario.
- Notificaciones con `notifySuccess` / `notifyError` (`src/shared/utils`).
- **No usar `crypto.randomUUID`.** Solo existe en contextos seguros (HTTPS o
  localhost), y el panel se abre por IP en la red. Usar `Date.now()` + random.
- Un módulo puede importar el store de otro (Vehículo usa `useFinanzasStore`),
  pero no componentes de otro módulo.
- Cargar datos con `useRecurso` (`src/shared/hooks`) y guardar con `ejecutar`
  (`src/shared/utils/ejecutar.ts`). No agregar datos de ejemplo al código.
- Si una pantalla cambia lo que envía, actualizar `tests/test_contrato_front.py` del backend.

## Reglas para la IA

- Hacer commit al terminar cada cambio, y solo con los archivos de ese cambio. No
  incluir cambios ajenos que estén sin commitear. El `push` se hace cuando el usuario
  lo habilita.
- No modificar `src/components/ui` (componentes base) ni la paleta sin pedirlo.
- Responder y documentar en español.
