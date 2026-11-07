# dulce-recuerdo-frontend

Panel de administración de Dulce Recuerdo: casos, agenda, inventario, activos,
vehículo, finanzas y catálogos. Hoy usa datos de ejemplo en memoria y se conectará
a la API de `dulce-recuerdo-backend`.

## Puesta en marcha

```bash
pnpm install
cp .env.example .env   # VITE_URL_CONEXION apunta a la API local
pnpm dev
```

## Documentación

- [`CLAUDE.md`](CLAUDE.md): guía para IA y colaboradores (comandos, convenciones, reglas).
- [`docs/ESTADO.md`](docs/ESTADO.md): estado de cada pantalla.
- [`docs/specs/`](docs/specs/): especificaciones de las features (Spec-Driven Development).
- [`references/`](references/README.md): mockups de diseño.

## Estructura

```
src/
├── app/              router y layouts
├── components/ui/    componentes base (shadcn/Radix)
├── features/         un directorio por módulo (ver CLAUDE.md)
├── shared/           sidebar, encabezados, stores globales y utilidades
└── lib/              utilidades (cn)
```
