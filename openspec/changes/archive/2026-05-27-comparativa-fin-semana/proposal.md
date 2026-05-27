# Proposal: Comparativa Fin de Semana

## Intent

Actualmente todas las queries en `models.ts` filtran con `WHERE dt.is_weekend = true`, ocultando datos de días de semana. Esto impide comparar patrones de tráfico, ventas y crecimiento entre weekend y weekday. Además, VisitsChart muestra fechas con zona horaria (T03:00:00.000Z) en el eje X, reduciendo legibilidad. El cambio resuelve ambos problemas.

## Scope

### In Scope
- Modificar 4 queries en `models.ts`: agregar `dt.is_weekend` al SELECT, eliminar `WHERE is_weekend = true`, agregar `is_weekend` al GROUP BY
- Extender `UserData`, `SalesData`, `VisitData` en `types/index.ts` con campo `is_weekend`
- Formatear XAxis de VisitsChart a "YYYY-MM-DD"
- UserChart: barras agrupadas — newUsers/weekend y newUsers/weekday por mes
- SalesChart: cada categoría como 2 entries (weekend/weekday), gráfico de barras agrupadas
- VisitsChart: dos líneas (weekend visits, weekday visits) sobre 30 días
- Actualizar `getMetricsSummary` para reflejar totales completos sin filtro de weekend
- Tests: actualizar mocks y aserciones en `models.test.ts`, `Charts.test.tsx`, `metrics.test.ts`

### Out of Scope
- Mock data engine (`mockData.ts`) — no se usa en producción; sus tests quedan para otra iteración
- DashboardClient.tsx — no cambia su lógica de fetching ni layout
- Nuevos endpoints API

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `mock-data-engine`: tipos `UserData`, `SalesData`, `VisitData` agregan campo `is_weekend`
- `metrics-api`: respuestas de `/api/metrics/users`, `/api/metrics/sales`, `/api/metrics/visits` incluyen `is_weekend` en cada entry
- `dashboard-ui`: charts renderizan 2 series (weekend + weekday) en vez de 1

## Approach

**Flujo de datos**: Route handlers (`route.ts`) siguen igual. `models.ts` cambia SQL interno — cada query retorna filas con `is_weekend` incluido en SELECT y GROUP BY. Los tipos se extienden. Los charts transforman los datos agrupándolos por `is_weekend` para Recharts.

**UserData**: `GROUP BY year, month, dt.is_weekend`. La ventana `OVER (ORDER BY year, month)` mantiene el acumulado correcto por serie (weekend y weekday por separado).

**SalesData**: `GROUP BY customer_state, dt.is_weekend`. La lógica top-5 se aplica sobre total combinado (weekend+weekday) por estado, luego se generan 2 entries por categoría. "Otros" se distribuye por is_weekend.

**VisitData**: Se agrega `dt.is_weekend` al SELECT; GROUP BY sigue siendo `dt.full_date`. El chart separa dos líneas filtrando por `is_weekend`.

**getMetricsSummary**: Se elimina `WHERE dt.is_weekend = true` de los 4 COUNT/SUM.

**XAxis**: `tickFormatter` en Recharts que recibe ISO string y retorna `date.split('T')[0]`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modified | `UserData`, `SalesData`, `VisitData` agregan `is_weekend: boolean` |
| `src/server/database/models.ts` | Modified | 4 queries cambian SELECT/GROUP BY, eliminan filtro weekend |
| `src/components/charts/UserChart.tsx` | Modified | Barras agrupadas (weekend vs weekday) |
| `src/components/charts/SalesChart.tsx` | Modified | Datos con is_weekend, barras agrupadas |
| `src/components/charts/VisitsChart.tsx` | Modified | Dos líneas, XAxis formateado |
| `src/server/database/__tests__/models.test.ts` | Modified | Mock rows incluyen `is_weekend`, aserciones actualizadas |
| `src/components/__tests__/Charts.test.tsx` | Modified | Sample data incluye `is_weekend` |
| `src/app/api/metrics/__tests__/metrics.test.ts` | Modified | Body shape assertions actualizadas |
| `openspec/specs/mock-data-engine/spec.md` | Modified | Tabla de tipos agrega `is_weekend` |
| `openspec/specs/metrics-api/spec.md` | Modified | Body shape scenarios reflejan nuevo campo |
| `openspec/specs/dashboard-ui/spec.md` | Modified | Scenarios de charts reflejan 2 series |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| SalesData "Otros" logic se rompe con is_weekend | Medium | Tests unitarios con múltiples combinaciones de estados |
| Window function en UserData da totales incorrectos con GROUP BY extra | Medium | Verificar que `OVER (ORDER BY year, month)` particiona correctamente; test con datos mixtos |
| PostgreSQL requiere `is_weekend` en GROUP BY aunque sea funcionalmente dependiente | Low | Agregarlo siempre al GROUP BY; es no-op porque cada full_date tiene un solo valor |

## Rollback Plan

1. Revertir `git revert HEAD` en los commits del cambio
2. Alternativa: restaurar `models.ts`, `types/index.ts` y charts desde el commit anterior
3. No hay migraciones de DB ni cambios de esquema — el rollback es seguro

## Dependencies

- Ninguna. Todo el cambio es autónomo en el código de la aplicación.

## MetricsSummary Breakdown

`getMetricsSummary()` ahora retorna desglose completo:

```typescript
interface MetricsSummary {
  // Totales combinados
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalVisits: number;
  conversionRate: number;
  // Desglose weekend
  weekendUsers: number;
  weekendSales: number;
  weekendVisits: number;
  weekendActiveUsers: number;
  weekendConversionRate: number;
  // Desglose weekday
  weekdayUsers: number;
  weekdaySales: number;
  weekdayVisits: number;
  weekdayActiveUsers: number;
  weekdayConversionRate: number;
}
```

## MetricCard Redesign

Cada `MetricCard` muestra:
- **Barra proporcional horizontal**: finde (🔵 azul) vs semana (🟢 verde) según su proporción
- **Leyenda**: 3 valores en línea — `Finde: X | Semana: Y | **Total: Z**`

Se modifica `MetricCard.tsx` para aceptar `weekendValue`, `weekdayValue`, `totalValue` como props opcionales. Cuando están presentes, renderiza la barra + desglose. Si no, renderiza el valor único tradicional (backward compatible).

## Success Criteria

- [ ] `getUserData()` retorna entries con `is_weekend: boolean`, tests pasan con datos mixtos
- [ ] `getSalesData()` retorna hasta 12 entries (6 categorías × 2 is_weekend), porcentajes suman 100 por grupo
- [ ] `getVisitData()` retorna 30 entries con `is_weekend`, XAxis muestra "YYYY-MM-DD"
- [ ] `getMetricsSummary()` retorna desglose completo weekend/weekday/total para cada métrica
- [ ] MetricCard renderiza barra proporcional + 3 valores cuando recibe desglose
- [ ] MetricCard mantiene compatibilidad hacia atrás (valor único sin desglose)
- [ ] UserChart renderiza barras agrupadas visibles para ambas series
- [ ] SalesChart renderiza barras agrupadas visibles para ambas series
- [ ] VisitsChart renderiza dos líneas distinguibles
- [ ] Todos los tests existentes pasan con datos actualizados
