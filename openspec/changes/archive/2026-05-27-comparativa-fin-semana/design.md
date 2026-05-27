# Design: Comparativa Fin de Semana

## Technical Approach

Eliminar `WHERE dt.is_weekend = true` de las 4 queries en `models.ts`, agregar `is_weekend` a SELECT + GROUP BY, y que cada chart filtre/transforme los datos en 2 series (weekend/weekday). Route handlers y DashboardClient no cambian. MetricCard extiende props opcionalmente para desglose.

## Architecture Decisions

### Decision: getMetricsSummary — Query strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| a) 3 queries + FULL OUTER JOIN | 3 round trips, SQL complejo | ❌ |
| b) COUNT(CASE WHEN ...) single query | 1 round trip, SQL simple, performante | ✅ |
| c) 1 query sin filtro + JS sums | Datos duplicados en red, JS overhead | ❌ |

**Rationale**: Opción (b) con `COUNT(CASE WHEN is_weekend THEN 1 END)` da total, weekend y weekday en una pasada. Postgres ejecuta 3 agregaciones sobre el mismo scan — mínimo I/O.

### Decision: Chart data shape para Recharts

| Enfoque | Problema | Decisión |
|---------|----------|----------|
| Datos separados (2 arrays) | Recharts necesita merge manual, XAxis pierde sincronía | ❌ |
| Merged con keys distintas | Un solo array, Recharts nativo con `dataKey` por serie | ✅ |

**Rationale**: Un solo array mergeado por fecha/categoría/mes con `weekendVisits`/`weekdayVisits` (o `newUsersWeekend`/`newUsersWeekday`) permite a Recharts renderizar 2 `<Line>`/`<Bar>` apuntando a distintas `dataKey` sobre los mismos datos.

### Decision: SalesChart — Dos PieCharts lado a lado

**Choice**: Mantener PieChart pero duplicarlo: un PieChart para weekend y otro para weekday, lado a lado.
**Rationale**: Un solo PieChart no puede representar 2 series, pero dos PieCharts gemelos permiten comparar visualmente la composición de ventas entre finde y semana. Además se mantiene la variedad de tipos de gráfico en el dashboard (líneas, barras, tortas).

## Component Tree

```
DashboardClient (unchanged — 4 SWR fetches)
├── MetricCard (totalUsers)         ← new props: weekendValue, weekdayValue
├── MetricCard (totalSales)         ← new props
├── MetricCard (totalVisits)        ← new props
├── MetricCard (conversionRate)     ← new props
├── UserChart (BarChart)
│   └── 4 Bar: newUsersWeekend, newUsersWeekday, totalUsersWeekend, totalUsersWeekday
├── SalesChart (2 PieCharts lado a lado)
│   ├── PieChart Weekend (composition weekend)
│   └── PieChart Weekday (composition weekday)
└── VisitsChart (LineChart)
    └── 2 Line: weekendVisits, weekdayVisits + XAxis tickFormatter
```

## Data Flow

```
NeonDB
  → models.ts (SQL: SELECT ..., is_weekend FROM ... GROUP BY ..., is_weekend)
    → API routes (sin cambios — retornan JSON con is_weekend en cada row)
      → SWR → DashboardClient (pasa data intacta a cada chart)
        → Charts (transforman: filter/group por is_weekend → merged array con keys separadas)
        → MetricCard (recibe summary con weekendValue/weekdayValue/totalValue)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modify | Agregar `is_weekend: boolean` a UserData, SalesData, VisitData. Extender MetricsSummary con 10 campos (weekend*/weekday*) |
| `src/server/database/models.ts` | Modify | 4 queries: eliminar `WHERE is_weekend = true`, agregar `is_weekend` a SELECT+GROUP BY. getMetricsSummary usa COUNT(CASE WHEN ...) single query |
| `src/components/charts/VisitsChart.tsx` | Modify | 2 Line (weekendVisits/weekdayVisits) + tickFormatter en XAxis |
| `src/components/charts/UserChart.tsx` | Modify | 4 Bar (newUsersWeekend, newUsersWeekday, totalUsersWeekend, totalUsersWeekday) |
| `src/components/charts/SalesChart.tsx` | Modify | Migrar PieChart → BarChart agrupado (2 barras por categoría) |
| `src/components/MetricCard.tsx` | Modify | Props: weekendValue?, weekdayValue?, totalValue?. Renderiza barra proporcional + desglose cuando presentes |
| `src/server/database/__tests__/models.test.ts` | Modify | Mock rows con is_weekend, aserciones extendidas |
| `src/components/__tests__/Charts.test.tsx` | Modify | Sample data con is_weekend, aserciones para 2 series |
| `src/components/__tests__/MetricCard.test.tsx` | Modify | Tests para modo desglose |
| `src/app/api/metrics/__tests__/metrics.test.ts` | Modify | Sample data con is_weekend, body shape assertions |

## Interfaces / Contracts

```typescript
// Extensión de tipos existentes
interface UserData {
  month: string;
  newUsers: number;
  totalUsers: number;
  is_weekend: boolean;            // NUEVO
}

interface SalesData {
  category: string;
  amount: number;
  percentage: number;
  is_weekend: boolean;            // NUEVO
}

interface VisitData {
  date: string;
  visits: number;
  is_weekend: boolean;            // NUEVO
}

interface MetricsSummary {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  totalVisits: number;
  conversionRate: number;
  weekendUsers: number;           // NUEVO
  weekendSales: number;           // NUEVO
  weekendVisits: number;          // NUEVO
  weekendActiveUsers: number;     // NUEVO
  weekendConversionRate: number;  // NUEVO
  weekdayUsers: number;           // NUEVO
  weekdaySales: number;           // NUEVO
  weekdayVisits: number;          // NUEVO
  weekdayActiveUsers: number;     // NUEVO
  weekdayConversionRate: number;  // NUEVO
}

// MetricCard props extendidas
interface MetricCardProps {
  title: string;
  value?: string | number;         // ← cambia a opcional
  weekendValue?: number;           // NUEVO
  weekdayValue?: number;           // NUEVO
  totalValue?: number;             // NUEVO
  loading: boolean;
}
```

## SQL Pattern (models.ts)

```sql
-- getUserData (sin WHERE is_weekend)
SELECT year || '-' || LPAD(month::text, 2, '0') AS month_label,
       COUNT(DISTINCT dc.customer_id) AS new_users,
       SUM(COUNT(DISTINCT dc.customer_id)) OVER (PARTITION BY dt.is_weekend ORDER BY year, month) AS total_users,
       dt.is_weekend
FROM {SCHEMA}.fact_orders fo
JOIN {SCHEMA}.dim_customers dc ON fo.customer_key = dc.customer_key
JOIN {SCHEMA}.dim_time dt ON fo.time_key = dt.time_key
GROUP BY year, month, dt.is_weekend
ORDER BY year, month, dt.is_weekend;

-- getMetricsSummary (single query con CASE)
SELECT
  COUNT(DISTINCT customer_id) AS total_users,
  COUNT(DISTINCT CASE WHEN is_weekend THEN customer_id END) AS weekend_users,
  COUNT(DISTINCT CASE WHEN NOT is_weekend THEN customer_id END) AS weekday_users
FROM ...;
```

Nota: `total_users` en getUserData usa `PARTITION BY dt.is_weekend` para que la window function acumule correctamente por serie (weekend y weekday por separado).

## Chart Data Transformation Pattern

```typescript
// VisitsChart — merge por date
const mergedData = useMemo(() => {
  const map = new Map<string, { date: string; weekendVisits: number; weekdayVisits: number }>();
  for (const d of data) {
    const existing = map.get(d.date) ?? { date: d.date, weekendVisits: 0, weekdayVisits: 0 };
    if (d.is_weekend) existing.weekendVisits += d.visits;
    else existing.weekdayVisits += d.visits;
    map.set(d.date, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}, [data]);

// UserChart — merge por month
const mergedData = useMemo(() => {
  // Similar pattern: agrupa por month, suma newUsers/totalUsers según is_weekend
}, [data]);

// SalesChart — separar datos para 2 PieCharts
const weekendData = useMemo(() => data.filter(d => d.is_weekend), [data]);
const weekdayData = useMemo(() => data.filter(d => !d.is_weekend), [data]);
// Cada PieChart recibe su array filtrado y renderiza con <Pie dataKey="amount" nameKey="category" />
```

## MetricCard — Modo Desglose

```tsx
// Cuando recibe weekendValue, renderiza:
<div>
  <p className="text-sm font-medium text-gray-500">{title}</p>
  <div className="mt-2 flex h-2 w-full rounded-full bg-gray-200 overflow-hidden">
    <div
      className="bg-blue-500 h-full transition-all"
      style={{ width: `${weekendPct}%` }}
    />
    <div
      className="bg-green-500 h-full transition-all"
      style={{ width: `${weekdayPct}%` }}
    />
  </div>
  <p className="mt-1 text-sm text-gray-600">
    Finde: {weekendValue} | Semana: {weekdayValue} | <strong>Total: {totalValue}</strong>
  </p>
</div>
```

El modo legacy (solo `value`) se mantiene intacto — decisión deliberada de backward compatibility.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (models) | Queries retornan `is_weekend`, summary con 15 campos | Mock pool, assert row shape + aggregaciones |
| Unit (Charts) | Charts renderizan 2 series visibles sin error | Render con sample data incluyendo `is_weekend` |
| Unit (MetricCard) | Modo desglose renderiza barra + 3 valores; legacy sigue funcionando | Render con/without weekendValue props |
| Integration (API) | Route handlers retornan `is_weekend` en body | Mock models, assert body shape |

## Migration / Rollout

No migration required. El cambio es puramente en queries SQL y componentes. Rollback: `git revert HEAD`.

## Open Questions

- [ ] SalesChart: ¿los porcentajes deben recalcularse por grupo (weekend vs weekday) o usar el percentage combinado existente? El proposal dice "porcentajes suman 100 por grupo" — decisión: recalcular por grupo.
