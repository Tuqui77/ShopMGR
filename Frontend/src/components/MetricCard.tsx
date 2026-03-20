import clsx from 'clsx';

interface Props {
  value: number;
  label: string;
  change?: number;
  prefix?: string;
}

export function MetricCard({ value, label, change, prefix = '' }: Props) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className="metric-card">
      <span className="metric-value" style={{ color: 'var(--color-text)' }}>
        {prefix}{typeof value === 'number' && value >= 1000 
          ? value.toLocaleString() 
          : value}
      </span>
      <span className="metric-label" style={{ color: 'var(--color-muted)' }}>{label}</span>
      {change !== undefined && (
        <span className={clsx(
          'text-xs font-medium',
          isPositive && 'text-[var(--color-success)]',
          isNegative && 'text-[var(--color-danger)]',
          !isPositive && !isNegative && 'text-[var(--color-muted)]'
        )}>
          {isPositive && '↑ '}{isNegative && '↓ '}
          {Math.abs(change)}%
        </span>
      )}
    </div>
  );
}
