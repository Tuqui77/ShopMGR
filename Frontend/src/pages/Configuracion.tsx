import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Clock, 
  Calendar, 
  Moon, 
  Sun,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';
import { apiClient } from '../services/api';

// ============================================================================
// Types
// ============================================================================

type Theme = 'claro' | 'oscuro';
type DateFormat = 'DD/MM/AAAA' | 'MM/DD/AAAA' | 'AAAA-MM-DD';
type TimeFormat = '12h' | '24h';
type CurrencySymbol = '$' | 'U$S';

// ============================================================================
// Local Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  theme: 'shopmgr_theme',
  dateFormat: 'shopmgr_dateFormat',
  timeFormat: 'shopmgr_timeFormat',
  currencyFormat: 'shopmgr_currencyFormat',
};

// ============================================================================
// Theme Management
// ============================================================================

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchCostoHora(): Promise<number> {
  const response = await apiClient.get<string>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
  const match = response.data.match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function updateCostoHora(nuevoCosto: string): Promise<void> {
  // Enviar como query parameter (sin el símbolo $)
  await apiClient.patch(`/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto=${nuevoCosto}`, {});
}

// ============================================================================
// Component
// ============================================================================

export function Configuracion() {
  const queryClient = useQueryClient();
  
  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEYS.theme) as Theme) || 'oscuro';
  });
  
  // Format states
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    return (localStorage.getItem(STORAGE_KEYS.dateFormat) as DateFormat) || 'DD/MM/AAAA';
  });
  
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    return (localStorage.getItem(STORAGE_KEYS.timeFormat) as TimeFormat) || '24h';
  });
  
  const [currencySymbol, setCurrencySymbol] = useState<CurrencySymbol>(() => {
    return (localStorage.getItem(STORAGE_KEYS.currencyFormat) as CurrencySymbol) || '$';
  });
  
  // Costo hora from API
  const [showCostoHoraSuccess, setShowCostoHoraSuccess] = useState(false);
  
  const { data: costoHora } = useQuery({
    queryKey: ['costoHora'],
    queryFn: fetchCostoHora,
  });
  
  // Local state for costo hora input
  const [costoHoraInput, setCostoHoraInput] = useState<string>('');
  
  useEffect(() => {
    if (costoHora !== undefined) {
      setCostoHoraInput(costoHora.toString());
    }
  }, [costoHora]);
  
  // Mutation for updating costo hora
  const updateCostoHoraMutation = useMutation({
    mutationFn: updateCostoHora,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costoHora'] });
    },
  });
  
  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);
  
  // Save format preferences
  const handleDateFormatChange = (format: DateFormat) => {
    setDateFormat(format);
    localStorage.setItem(STORAGE_KEYS.dateFormat, format);
  };
  
  const handleTimeFormatChange = (format: TimeFormat) => {
    setTimeFormat(format);
    localStorage.setItem(STORAGE_KEYS.timeFormat, format);
  };
  
  const handleCurrencySymbolChange = (symbol: CurrencySymbol) => {
    setCurrencySymbol(symbol);
    localStorage.setItem(STORAGE_KEYS.currencyFormat, symbol);
  };
  
  const handleCostoHoraSave = () => {
    const value = costoHoraInput.trim();
    if (value && !isNaN(parseInt(value, 10))) {
      updateCostoHoraMutation.mutate(value, {
        onSuccess: () => {
          setShowCostoHoraSuccess(true);
          setTimeout(() => setShowCostoHoraSuccess(false), 3000);
        }
      });
    }
  };
  
  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'oscuro', label: 'Oscuro', icon: Moon },
    { value: 'claro', label: 'Claro', icon: Sun },
  ];
  
  const dateFormatOptions: { value: DateFormat; label: string }[] = [
    { value: 'DD/MM/AAAA', label: 'DD/MM/AAAA (15/03/2026)' },
    { value: 'MM/DD/AAAA', label: 'MM/DD/AAAA (03/15/2026)' },
    { value: 'AAAA-MM-DD', label: 'AAAA-MM-DD (2026-03-15)' },
  ];
  
  const timeFormatOptions: { value: TimeFormat; label: string }[] = [
    { value: '24h', label: '24 horas (14:30)' },
    { value: '12h', label: '12 horas (2:30 PM)' },
  ];
  
  const currencySymbolOptions: { value: CurrencySymbol; label: string }[] = [
    { value: '$', label: '$ (Pesos)' },
    { value: 'U$S', label: 'U$S (Dólares)' },
  ];
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <h1 className="text-xl font-bold font-display">Configuración</h1>
      </header>
      
      <section className="px-4 space-y-6">
        {/* Tema */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                {theme === 'oscuro' ? (
                  <Moon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <Sun className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                )}
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Tema</h2>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Apariencia de la aplicación</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    theme === value ? '' : 'hover:opacity-80'
                  }`}
                  style={{ 
                    backgroundColor: theme === value ? 'var(--color-accent)' : 'transparent',
                    color: theme === value ? 'white' : 'var(--color-muted)'
                  }}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Valor hora de trabajo */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Valor hora de trabajo</h2>
              {costoHora !== undefined && costoHora > 0 && !showCostoHoraSuccess && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Actual: {formatCurrency(costoHora)}/hora</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--color-muted)' }}>$</span>
              <input
                type="text"
                value={costoHoraInput}
                onChange={(e) => setCostoHoraInput(e.target.value)}
                className="w-24 px-2 py-1 rounded-lg border text-sm text-right"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-surface)',
                  color: 'var(--color-text)'
                }}
                placeholder="0"
              />
              <button
                onClick={handleCostoHoraSave}
                disabled={updateCostoHoraMutation.isPending || showCostoHoraSuccess}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ 
                  backgroundColor: showCostoHoraSuccess ? 'var(--color-success)' : 'var(--color-accent)', 
                  color: 'white' 
                }}
              >
                {updateCostoHoraMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : showCostoHoraSuccess ? (
                  'Guardado'
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Formato de fecha */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Calendar className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Formato de fecha</h2>
            </div>
            <select
              value={dateFormat}
              onChange={(e) => handleDateFormatChange(e.target.value as DateFormat)}
              className="text-sm rounded-lg px-3 py-2"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-surface)'
              }}
            >
              {dateFormatOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Formato de hora */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Formato de hora</h2>
            </div>
            <select
              value={timeFormat}
              onChange={(e) => handleTimeFormatChange(e.target.value as TimeFormat)}
              className="text-sm rounded-lg px-3 py-2"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-surface)'
              }}
            >
              {timeFormatOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Formato de moneda */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Símbolo de moneda</h2>
            </div>
            <select
              value={currencySymbol}
              onChange={(e) => handleCurrencySymbolChange(e.target.value as CurrencySymbol)}
              className="text-sm rounded-lg px-3 py-2"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-surface)'
              }}
            >
              {currencySymbolOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
