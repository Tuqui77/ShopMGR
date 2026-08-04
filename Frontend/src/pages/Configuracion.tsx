import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  Clock, 
  Calendar, 
  Moon, 
  Sun,
  DollarSign,
  KeyRound,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';
import { obtenerRolDesdeToken } from '../utils/jwt';
import { apiClient } from '../services/api';
import { PasskeySection } from '../components/PasskeySection';
import { authService, extractAuthErrorMessage } from '../services/auth';
import { useStore } from '../store';
import type { RolUsuario } from '../types';

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
// Cuenta (issue #99): contraseña y rol
// ============================================================================

const ROLES_OPCIONES: { value: RolUsuario; label: string }[] = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Empleado', label: 'Empleado' },
  { value: 'Cliente', label: 'Cliente' },
];

const MENSAJE_VALIDACION_CONTRASENA = 'Completá la contraseña actual y la nueva.';
const MENSAJE_ERROR_CONTRASENA = 'No se pudo cambiar la contraseña. Probá de nuevo.';
const MENSAJE_ERROR_ROL = 'No se pudo cambiar el rol. Probá de nuevo.';

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
  const response = await apiClient.get<number>('/Presupuestos/ObtenerCostoHoraDeTrabajo');
  return response.data;
}

async function updateCostoHora(nuevoCosto: number): Promise<void> {
  // Enviar solo el query parameter, sin body
  // Usar URLSearchParams para construir la URL correctamente
  const params = new URLSearchParams();
  params.append('nuevoCosto', nuevoCosto.toString());
  await apiClient.request({
    method: 'PATCH',
    url: `/Presupuestos/ActualizarCostoHoraDeTrabajo?${params.toString()}`,
    data: '', // String vacío en lugar de undefined
  });
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
  
  // Local state for costo hora input - initialize with costoHora
  const [costoHoraInput, setCostoHoraInput] = useState<string>(() => costoHora?.toString() || '');
  
  // Mutation for updating costo hora
  const updateCostoHoraMutation = useMutation({
    mutationFn: updateCostoHora,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costoHora'] });
    },
  });
  
  // ── Cambiar contraseña (issue #99) ─────────────────────────────────────────
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [validacionContrasena, setValidacionContrasena] = useState<string | null>(null);
  const [showContrasenaSuccess, setShowContrasenaSuccess] = useState(false);
  
  const cambiarContrasenaMutation = useMutation({
    mutationFn: ({ actual, nueva }: { actual: string; nueva: string }) =>
      authService.cambiarContrasena(actual, nueva),
  });
  
  const handleContrasenaActualChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContrasenaActual(e.target.value);
    setValidacionContrasena(null);
    if (cambiarContrasenaMutation.isError) cambiarContrasenaMutation.reset();
  };
  
  const handleContrasenaNuevaChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContrasenaNueva(e.target.value);
    setValidacionContrasena(null);
    if (cambiarContrasenaMutation.isError) cambiarContrasenaMutation.reset();
  };
  
  const handleGuardarContrasena = () => {
    // Solo se valida que no estén vacías; las contraseñas se envían sin trim.
    if (!contrasenaActual.trim() || !contrasenaNueva.trim()) {
      setValidacionContrasena(MENSAJE_VALIDACION_CONTRASENA);
      return;
    }
    setValidacionContrasena(null);
    cambiarContrasenaMutation.mutate(
      { actual: contrasenaActual, nueva: contrasenaNueva },
      {
        onSuccess: () => {
          setContrasenaActual('');
          setContrasenaNueva('');
          setShowContrasenaSuccess(true);
          setTimeout(() => setShowContrasenaSuccess(false), 3000);
        },
      },
    );
  };
  
  // ── Rol de usuario (issue #99) ─────────────────────────────────────────────
  // El rol se deriva del JWT de acceso (claim "role"); como el token se renueva
  // vía el interceptor de refresh, esta derivación se mantiene siempre al día.
  const accessToken = useStore((s) => s.accessToken);
  const setTokens = useStore((s) => s.setTokens);
  const logout = useStore((s) => s.logout);
  const rol = useMemo(() => obtenerRolDesdeToken(accessToken), [accessToken]);

  // El select preselecciona el rol actual (ahora expuesto en el JWT): elegir
  // otro rol es deliberado y el botón queda deshabilitado si no cambió.
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario | null>(() => rol);
  const [showRolSuccess, setShowRolSuccess] = useState(false);
  
  const cambiarRolMutation = useMutation({
    mutationFn: (rol: RolUsuario) => authService.cambiarRol(rol),
  });
  
  /**
   * Tras cambiar el rol, el JWT local queda obsoleto (su claim "role" sigue con
   * el rol anterior hasta el próximo refresh). Se pide un access token nuevo: el
   * backend re-emite el claim actualizado y la card se oculta sola si ya no es
   * Administrador. Si el refresh falla, se fuerza logout (patrón de api.ts).
   */
  async function refrescarTokenTrasCambioDeRol() {
    try {
      const { accessToken: nuevoToken } = await authService.refrescar();
      setTokens(nuevoToken);
    } catch {
      logout();
      window.location.replace('/login');
    }
  }
  
  const handleRolChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRolSeleccionado(value === '' ? null : (value as RolUsuario));
    if (cambiarRolMutation.isError) cambiarRolMutation.reset();
  };
  
  const handleGuardarRol = () => {
    if (rolSeleccionado === null || rolSeleccionado === rol) return;
    cambiarRolMutation.mutate(rolSeleccionado, {
      onSuccess: () => {
        setShowRolSuccess(true);
        setTimeout(() => setShowRolSuccess(false), 3000);
        void refrescarTokenTrasCambioDeRol();
      },
    });
  };
  
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
    if (value && !isNaN(parseFloat(value))) {
      updateCostoHoraMutation.mutate(parseFloat(value), {
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-200 ${
                    theme === value ? '' : 'hover:bg-[var(--color-hover)]'
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
                className="w-24 px-2 py-1 rounded-lg border text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 hover:opacity-90"
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
              className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)]"
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
              className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)]"
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
              className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)]"
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
        
        {/* Cambiar contraseña */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <KeyRound className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Cambiar contraseña</h2>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Actualizá la contraseña de tu cuenta.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="contrasena-actual" className="text-sm mb-1 block" style={{ color: 'var(--color-muted)' }}>
                Contraseña actual
              </label>
              <input
                id="contrasena-actual"
                type="password"
                value={contrasenaActual}
                onChange={handleContrasenaActualChange}
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="contrasena-nueva" className="text-sm mb-1 block" style={{ color: 'var(--color-muted)' }}>
                Contraseña nueva
              </label>
              <input
                id="contrasena-nueva"
                type="password"
                value={contrasenaNueva}
                onChange={handleContrasenaNuevaChange}
                placeholder="••••••••"
                className="input"
                autoComplete="new-password"
              />
            </div>
          </div>
          
          <div className="mt-3">
            {validacionContrasena ? (
              <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {validacionContrasena}
              </p>
            ) : cambiarContrasenaMutation.isError ? (
              <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {extractAuthErrorMessage(cambiarContrasenaMutation.error) || MENSAJE_ERROR_CONTRASENA}
              </p>
            ) : showContrasenaSuccess ? (
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Contraseña modificada
              </p>
            ) : null}
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleGuardarContrasena}
              disabled={cambiarContrasenaMutation.isPending || showContrasenaSuccess}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: showContrasenaSuccess ? 'var(--color-success)' : 'var(--color-accent)', 
                color: 'white' 
              }}
            >
              {cambiarContrasenaMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : showContrasenaSuccess ? (
                'Guardado'
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </div>
        
        {/* Rol de usuario: solo visible para administradores (issue #99) */}
        {rol === 'Administrador' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Rol de usuario</h2>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>El rol se aplica a tu cuenta actual.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={rolSeleccionado ?? ''}
              onChange={handleRolChange}
              className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)] flex-1"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-surface)'
              }}
              aria-label="Rol de usuario"
            >
              <option value="" disabled>Seleccionar rol...</option>
              {ROLES_OPCIONES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <button
              onClick={handleGuardarRol}
              disabled={rolSeleccionado === null || rolSeleccionado === rol || cambiarRolMutation.isPending || showRolSuccess}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: showRolSuccess ? 'var(--color-success)' : 'var(--color-accent)', 
                color: 'white' 
              }}
            >
              {cambiarRolMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : showRolSuccess ? (
                'Guardado'
              ) : (
                'Guardar'
              )}
            </button>
          </div>
          
          <div className="mt-3">
            {cambiarRolMutation.isError ? (
              <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {extractAuthErrorMessage(cambiarRolMutation.error) || MENSAJE_ERROR_ROL}
              </p>
            ) : showRolSuccess ? (
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Rol modificado
              </p>
            ) : null}
          </div>
        </div>
        )}
        
        {/* Passkeys */}
        <PasskeySection />
      </section>
    </div>
  );
}
