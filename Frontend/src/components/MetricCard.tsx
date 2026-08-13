import clsx from 'clsx';

export interface MetricCardProps {
  /** Valor del período. null → se renderiza "—" (nunca 0, nunca %). */
  value: number | null;
  /** Label visible bajo el valor. */
  label: string;
  /** Prefijo de texto opcional (mantenido por compatibilidad; hoy 0 usos). */
  prefix?: string;
  /** Tamaño visual del valor. 'sm' para grid (text-lg), 'lg' para hero (text-3xl/4xl). Default 'sm'. */
  size?: 'sm' | 'lg';
  /** true → el valor se pinta muted (columna "Mes anterior"). Default false. */
  muted?: boolean;
}

/** Átomo de métrica (issue #118): null → "—" (nunca 0, nunca %). */
export function MetricCard({ value, label, prefix = '', size = 'sm', muted = false }: MetricCardProps) {
  const esSinDatos = value === null;

  return (
    <div className="metric-card">
      <span
        className={clsx('metric-value', size === 'lg' ? 'text-3xl lg:text-4xl' : 'text-lg')}
        style={{ color: esSinDatos || muted ? 'var(--color-muted)' : 'var(--color-text)' }}
        aria-hidden={esSinDatos || undefined}
      >
        {esSinDatos ? '—' : `${prefix}${value.toLocaleString('es-AR')}`}
      </span>
      <span className="metric-label">{label}</span>
      {esSinDatos && <span className="sr-only">Sin datos</span>}
    </div>
  );
}
