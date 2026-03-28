// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  dateFormat: 'shopmgr_dateFormat',
  timeFormat: 'shopmgr_timeFormat',
  currencyFormat: 'shopmgr_currencyFormat',
} as const;

// ============================================================================
// Types
// ============================================================================

export type DateFormat = 'DD/MM/AAAA' | 'MM/DD/AAAA' | 'AAAA-MM-DD';
export type TimeFormat = '12h' | '24h';

// ============================================================================
// Helpers
// ============================================================================

export function getDateFormat(): DateFormat {
  if (typeof window === 'undefined') return 'DD/MM/AAAA';
  return (localStorage.getItem(STORAGE_KEYS.dateFormat) as DateFormat) || 'DD/MM/AAAA';
}

export function getTimeFormat(): TimeFormat {
  if (typeof window === 'undefined') return '24h';
  return (localStorage.getItem(STORAGE_KEYS.timeFormat) as TimeFormat) || '24h';
}

// ============================================================================
// Formatters
// ============================================================================

/**
 * Formatea una fecha según la configuración del usuario
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const format = getDateFormat();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/AAAA':
      return `${day}/${month}/${year}`;
    case 'MM/DD/AAAA':
      return `${month}/${day}/${year}`;
    case 'AAAA-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Formatea una hora según la configuración del usuario
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const format = getTimeFormat();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  if (format === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  }
  
  // 24h format
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Formatea fecha y hora combinados
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}

// ============================================================================
// Currency
// ============================================================================

export type CurrencySymbol = '$' | 'U$S';

export function getCurrencySymbol(): CurrencySymbol {
  if (typeof window === 'undefined') return '$';
  return (localStorage.getItem(STORAGE_KEYS.currencyFormat) as CurrencySymbol) || '$';
}

/**
 * Formatea un número como moneda usando el símbolo configurado
 */
export function formatCurrency(amount: number): string {
  const symbol = getCurrencySymbol();
  const formatted = Math.abs(amount).toLocaleString();
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}
