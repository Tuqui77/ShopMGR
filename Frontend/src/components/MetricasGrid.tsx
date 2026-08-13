import type { ReactNode } from 'react';

export interface MetricasGridProps {
  /** 4 MetricCardComparativo (o ReactNode en general). El grid es estructural. */
  children: ReactNode;
}

/** Grid compartido Dashboard + /metricas (issue #118): 2x2 mobile, 4 columnas desktop. */
export function MetricasGrid({ children }: MetricasGridProps) {
  return <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{children}</div>;
}
