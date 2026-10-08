import { Loader2 } from 'lucide-react';

type LoadingVariant = 'page' | 'block' | 'inline';

interface LoadingStateProps {
  variant: LoadingVariant; // obligatorio: la elección debe ser consciente
  label?: string; // default 'Cargando…'
  className?: string;
}

const CONTAINER_CLASSES: Record<LoadingVariant, string> = {
  // `page` conserva exactamente las clases del loading actual de las
  // páginas-detalle (spec 3.2): cambio visual nulo, gana aria + Suspense.
  page: 'min-h-screen pb-24 lg:pb-8 flex items-center justify-center',
  block: 'flex flex-col items-center justify-center py-12',
  inline: 'flex flex-col items-center justify-center py-4 gap-2',
};

const SPINNER_CLASSES: Record<LoadingVariant, string> = {
  page: 'w-8 h-8',
  block: 'w-6 h-6',
  inline: 'w-5 h-5',
};

/**
 * Loading state unificado de query (issue #69).
 *
 * Variantes:
 * - `page`:   spinner full-page (páginas-detalle y Suspense de rutas).
 * - `block`:  spinner de bloque (contenido completo de un modal).
 * - `inline`: spinner chico para una sección dentro de una card.
 *
 * Regla de visibilidad del label (decisión C3, spec v1.2.0): si se pasa
 * `label`, el texto es visible (`text-sm`, muted); sin `label`, el default
 * "Cargando…" queda `sr-only` (anunciado solo por lector de pantalla).
 * El spinner conserva el giro con `prefers-reduced-motion` (decisión
 * documentada en la spec 3.2: es la señal funcional de "trabajando").
 */
export function LoadingState({ variant, label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${CONTAINER_CLASSES[variant]} ${className ?? ''}`.trim()}
    >
      <Loader2
        aria-hidden="true"
        focusable={false}
        className={`${SPINNER_CLASSES[variant]} animate-spin`}
        style={{ color: 'var(--color-accent)' }}
      />
      <span className={label ? 'text-sm' : 'sr-only'} style={{ color: 'var(--color-muted)' }}>
        {label ?? 'Cargando…'}
      </span>
    </div>
  );
}