import { Timer, CheckCircle2, FileText, ClipboardCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FormatoValor } from './MetricCardComparativo';

export type MetricaGridKey =
  | 'horasTrabajadas'
  | 'trabajosTerminados'
  | 'presupuestosCreados'
  | 'presupuestosAceptados';

export interface MetricaGridItem {
  key: MetricaGridKey;
  label: string;
  icono: LucideIcon;
  colorIcono: string; // CSS var, ej. 'var(--color-muted)'
  formato: FormatoValor;
}

/** Config compartida de las 4 métricas del grid (issue #118 §2.2) — Dashboard y /metricas. */
export const metricasGridConfig: MetricaGridItem[] = [
  { key: 'horasTrabajadas', label: 'Horas trabajadas', icono: Timer, colorIcono: 'var(--color-muted)', formato: 'horas' },
  { key: 'trabajosTerminados', label: 'Trabajos terminados', icono: CheckCircle2, colorIcono: 'var(--color-success)', formato: 'entero' },
  { key: 'presupuestosCreados', label: 'Presupuestos creados', icono: FileText, colorIcono: 'var(--color-muted)', formato: 'entero' },
  { key: 'presupuestosAceptados', label: 'Presupuestos aceptados', icono: ClipboardCheck, colorIcono: 'var(--color-info)', formato: 'entero' },
];
