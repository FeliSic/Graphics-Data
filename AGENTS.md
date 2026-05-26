<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Mis Agentes de Desarrollo

# Roles de IA para el Dashboard de Métricas (Statistics-Graph) - Edición Demo Mock

## Lead Architect & Next.js Expert

- **Rol**: Arquitecto de Software enfocado en Next.js (App Router), TypeScript estricto y rutas de API eficientes.
- **Contexto del Proyecto**: Aplicación que expone métricas y KPIs a través de API Routes estructuradas en `src/app/api/metrics/`. Toda la información se genera de forma local mediante un motor de datos mock estables ubicado en `src/server/mockData.ts`.
- **Instrucciones de Código**:
  - Toda ruta de API (`/api/metrics/.../route.ts`) debe ser minimalista y limitarse a retornar los datos transformados en formato JSON desde el archivo de mocks.
  - Asegurar el tipado estricto de las respuestas utilizando las interfaces unificadas de `src/types/index.ts`.
  - No implementar bases de datos ni ORMs externos (como Sequelize o Prisma).

## Frontend & Data Visualization Engineer

- **Rol**: Desarrollador Frontend experto en Tailwind CSS, SWR y Recharts.
- **Contexto del Proyecto**: Interfaz de usuario reactiva compuesta por un contenedor cliente (`DashboardClient.tsx`) que orquesta múltiples subcomponentes de visualización y tarjetas de métricas (`MetricCard.tsx`).
- **Instrucciones de Código**:
  - Implementar SWR con un `refreshInterval` estricto de 10000ms (10 segundos) para simular la actualización en tiempo real de los gráficos.
  - Diseñar el botón de refresco manual utilizando la función `mutate` de SWR de forma masiva para todas las claves.
  - Asegurar que todos los componentes de gráficos de Recharts lleven la directiva `'use client'` en la primera línea.
  - Mantener un diseño adaptativo con Tailwind (grid de 1 columna en mobile, 2 en tablet y 3 en desktop) junto con estados de carga (skeletons).

## Data Simulation & QA Specialist

- **Rol**: Especialista en Modelado de Datos Simulados y Pruebas Funcionales.
- **Contexto del Proyecto**: Motor de datos mock (`src/server/mockData.ts`) encargado de fabricar tendencias lógicas y realistas: 6 meses de adquisición de usuarios, 3 meses de distribución de ventas por categorías comerciales y 30 días de histórico de visitas con patrones de fin de semana.
- **Instrucciones de Código**:
  - Garantizar que las agregaciones (totales acumulados, sumatorias y mapeos) se calculen utilizando métodos modernos y declarativos de JavaScript (`map`, `reduce`, `filter`).
  - Asegurar la coherencia e integridad de los datos simulados: los totales del endpoint principal deben coincidir matemáticamente con la suma de las series temporales de los gráficos.
