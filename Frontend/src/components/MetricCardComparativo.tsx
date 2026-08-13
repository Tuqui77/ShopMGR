import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';

export type FormatoValor = 'moneda' | 'horas' | 'entero';

export interface MetricCardComparativoProps {
  /** Label del card: "Ingresos del mes" (hero) o "Horas trabajadas", etc. (grid). */
  label: string;
  /** Valor del período seleccionado ("Este mes"). null → "—". */
  valorActual: number | null;
  /** Valor del período anterior. null → "—". SIEMPRE muted. */
  valorAnterior: number | null;
  /** Nombre del mes del período actual, ej. "Agosto". Sublabel bajo el valor (D4). */
  mesActual: string;
  /** Nombre del mes anterior, ej. "Julio". Sublabel bajo el valor (D4). */
  mesAnterior: string;
  /** Formato de los valores. Default 'entero'. */
  formato?: FormatoValor;
  /** Icono lucide opcional (cabecera del card). */
  icono?: LucideIcon;
  /** Color del icono (CSS var). Solo aplica si `icono` está definido. */
  colorIcono?: string;
  /** Variante visual. 'grid' (card p-3, valores text-lg) | 'hero' (card p-5, borde accent, valores text-3xl). */
  variant?: 'hero' | 'grid';
}

/**
 * Formatea el valor según el contrato de la spec (issue #118 §2.2):
 * moneda → formatCurrency; horas → "42.0 hs"; entero → "1.500" (es-AR).
 * El null NUNCA pasa por aquí (lo maneja el render con "—").
 */
function formatearValor(valor: number, formato: FormatoValor): string {
  switch (formato) {
    case 'moneda':
      return formatCurrency(valor);
    case 'horas':
      return `${valor.toFixed(1)} hs`;
    case 'entero':
      return valor.toLocaleString('es-AR');
  }
}

interface ValorColumnaProps {
  valor: number | null;
  mesLabel: string;
  formato: FormatoValor;
  size: 'sm' | 'lg';
  /** Color del valor numérico (columna actual). Muted gana sobre esto. */
  colorValor: string;
  /** true → columna "Mes anterior" (siempre muted). */
  muted: boolean;
}

/** Valor + sublabel de mes de una columna (mismo contrato visual que MetricCard). */
function ValorColumna({ valor, mesLabel, formato, size, colorValor, muted }: ValorColumnaProps) {
  const esSinDatos = valor === null;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span
        className={clsx('metric-value', size === 'lg' ? 'text-3xl lg:text-4xl' : 'text-lg')}
        style={{ color: esSinDatos || muted ? 'var(--color-muted)' : colorValor }}
        aria-hidden={esSinDatos || undefined}
      >
        {esSinDatos ? '—' : formatearValor(valor, formato)}
      </span>
      <span className="metric-label">{mesLabel}</span>
      {esSinDatos && <span className="sr-only">Sin datos</span>}
    </div>
  );
}

/** Card comparativo de 2 períodos (issue #118): "Este mes" vs "Mes anterior" lado a lado. */
export function MetricCardComparativo({
  label,
  valorActual,
  valorAnterior,
  mesActual,
  mesAnterior,
  formato = 'entero',
  icono: Icono,
  colorIcono,
  variant = 'grid',
}: MetricCardComparativoProps) {
  const size = variant === 'hero' ? 'lg' : 'sm';
  // Único color semántico permitido: accent para "Este mes" SOLO en el hero.
  const colorValorActual = variant === 'hero' ? 'var(--color-accent)' : 'var(--color-text)';

  return (
    <div
      className={clsx('card', variant === 'hero' ? '!p-5 border' : '!p-3')}
      style={variant === 'hero'
        ? { borderColor: 'var(--color-accent)', borderWidth: '1px', background: 'var(--color-card)' }
        : undefined}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {Icono && <Icono className="w-4 h-4" style={{ color: colorIcono }} />}
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Este mes
          </span>
          <ValorColumna
            valor={valorActual}
            mesLabel={mesActual}
            formato={formato}
            size={size}
            colorValor={colorValorActual}
            muted={false}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Mes anterior
          </span>
          <ValorColumna
            valor={valorAnterior}
            mesLabel={mesAnterior}
            formato={formato}
            size={size}
            colorValor="var(--color-text)"
            muted
          />
        </div>
      </div>
    </div>
  );
}
