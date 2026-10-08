interface SkeletonProps {
  className?: string;
}

/**
 * Barra de skeleton (shimmer) — issue #69. El redondeo va SIEMPRE por
 * utilities Tailwind (`rounded` / `rounded-full` en el avatar): `.skeleton`
 * no define `border-radius` a propósito (spec 3.4, trampa de especificidad
 * con el `@import "tailwindcss"`).
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={`skeleton ${className ?? ''}`.trim()} />;
}

interface SkeletonListProps {
  /** Cantidad de cards fantasma. Default: 4. */
  count?: number;
  /** Label accesible de la carga (sr-only), p. ej. "Cargando trabajos…". */
  label: string;
  className?: string;
}

/**
 * Skeleton de lista de cards: reemplaza el contenido de Trabajos,
 * Presupuestos y Clientes durante la carga. Mantiene la geometría de una
 * TrabajoCard / ClienteListItem / card de presupuesto (avatar + 2–3 líneas)
 * para que el header y los filtros permanezcan visibles sin salto de layout.
 */
export function SkeletonList({ count = 4, label, className }: SkeletonListProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`space-y-3 ${className ?? ''}`.trim()}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card" aria-hidden="true">
          <div className="flex items-start gap-3">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const LABEL_METRICAS_DEFAULT = 'Cargando métricas…';

interface SkeletonHeroProps {
  /** Label accesible (sr-only). Default: "Cargando métricas…". */
  label?: string;
}

/**
 * Skeleton del hero comparativo (Dashboard / Métricas): card con la forma del
 * `MetricCardComparativo variant="hero"` (label + valor + 2 sublabels).
 */
export function SkeletonHero({ label = LABEL_METRICAS_DEFAULT }: SkeletonHeroProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="card !p-5" aria-hidden="true">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-8 w-44 rounded mt-3" />
        <div className="flex gap-3 mt-3">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonMetricGridProps {
  /** Label accesible (sr-only). Default: "Cargando métricas…". */
  label?: string;
}

/**
 * Skeleton del grid comparativo 2x2 (desktop 4 cols) de métricas
 * (Dashboard / Métricas): 4 cards con la forma de las chicas.
 */
export function SkeletonMetricGrid({ label = LABEL_METRICAS_DEFAULT }: SkeletonMetricGridProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card !p-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}