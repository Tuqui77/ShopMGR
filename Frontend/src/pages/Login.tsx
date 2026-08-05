import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Loader2, UserPlus, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { authService, extractAuthErrorMessage } from '../services/auth';
import { PasskeyButton } from '../components/PasskeyButton';
import { usePasskeyLogin } from '../hooks/usePasskeyLogin';

export function Login() {
  const navigate = useNavigate();
  const { setTokens, setCambioContraseñaPendiente, logout } = useStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ userName: '', password: '', general: '', success: '' });
  const [isLoading, setIsLoading] = useState(false);

  // ── Cambio de contraseña obligatorio (login con código de un solo uso, #99) ──
  const [requiereCambio, setRequiereCambio] = useState(false);
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalExito, setModalExito] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  const passkey = usePasskeyLogin();
  const passkeysSoportados = typeof window !== 'undefined' && window.PublicKeyCredential !== undefined;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors = { userName: '', password: '', general: '', success: '' };
    let hasError = false;
    
    if (!userName.trim()) {
      newErrors.userName = 'El usuario es requerido';
      hasError = true;
    }
    
    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
      hasError = true;
    }
    
    setErrors(newErrors);
    
    if (hasError) return;
    
    setIsLoading(true);
    try {
      if (isRegistering) {
        await authService.register({ userName: userName.trim(), password });
        setErrors(prev => ({ ...prev, success: 'Usuario creado. Ahora podés iniciar sesión.' }));
        setIsRegistering(false);
        setPassword('');
      } else {
        const respuesta = await authService.login({ userName: userName.trim(), password });

        if (respuesta.requiereCambioContraseña === true) {
          // El token ya se setea para que la llamada de cambio vaya autenticada;
          // el flag evita que LoginPage redirija antes de completar el cambio.
          setTokens(respuesta.accessToken);
          setCambioContraseñaPendiente(true);
          setRequiereCambio(true);
          setErrors({ userName: '', password: '', general: '', success: '' });
        } else {
          setTokens(respuesta.accessToken);
          navigate('/');
        }
      }
    } catch (err: unknown) {
      const axiosData = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: unknown } }).response?.data
        : null;
      const message = typeof axiosData === 'string'
        ? axiosData
        : typeof axiosData === 'object' && axiosData !== null && 'error' in axiosData
          ? String((axiosData as { error: unknown }).error)
          : 'Error al conectar con el servidor';
      setErrors(prev => ({ ...prev, general: message }));
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrors({ userName: '', password: '', general: '', success: '' });
  };

  const handleCambioObligatorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contrasenaNueva || !confirmarContrasena) {
      setModalError('Completá la contraseña nueva y su confirmación.');
      return;
    }
    if (contrasenaNueva !== confirmarContrasena) {
      setModalError('Las contraseñas no coinciden.');
      return;
    }
    setModalError(null);
    setModalLoading(true);
    try {
      // contraseñaActual = null: el backend NO valida la actual (login con código).
      await authService.cambiarContrasena(null, contrasenaNueva);
      setModalExito(true);
      setCambioContraseñaPendiente(false);
      // El accessToken ya quedó en el store al hacer login: solo se navega.
      navigate('/');
    } catch (err: unknown) {
      setModalError(extractAuthErrorMessage(err) || 'No se pudo cambiar la contraseña. Probá de nuevo.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSalir = () => {
    // Sin el token no hay sesión: el guard de la app redirige a /login.
    // El form de login queda intacto detrás del modal.
    logout();
    setRequiereCambio(false);
    setContrasenaNueva('');
    setConfirmarContrasena('');
    setModalError(null);
    setModalExito(false);
    setModalLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">
            ShopMGR
          </h1>
          <p className="text-[var(--color-muted)] mt-2 text-sm">
            Gestión de talleres y clientes
          </p>
        </div>

        {/* ── Login/Register Form ───────────────────────────────────────────
           Siempre visible: si el login exige cambio de contraseña (código de
           un solo uso, #99), el modal se abre ENCIMA sin desmontar este form. */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
              <p className="text-sm text-[var(--color-danger)] text-center">{errors.general}</p>
            </div>
          )}
          
          {/* Success message */}
          {errors.success && (
            <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
              <p className="text-sm text-[var(--color-success)] text-center">{errors.success}</p>
            </div>
          )}
          
          {/* UserName Field */}
          <div>
            <label htmlFor="login-usuario" className="block text-sm font-medium text-[var(--color-muted)] mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                id="login-usuario"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Tu usuario"
                className="input !pl-11"
                autoFocus
              />
            </div>
            {errors.userName && (
              <p className="text-sm text-[var(--color-danger)] mt-1">{errors.userName}</p>
            )}
          </div>
          
          {/* Password Field */}
          <div>
            <label htmlFor="login-contrasena" className="block text-sm font-medium text-[var(--color-muted)] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
              <input
                id="login-contrasena"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input !pl-11"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-[var(--color-danger)] mt-1">{errors.password}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRegistering ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading
              ? (isRegistering ? 'Creando...' : 'Ingresando...')
              : (isRegistering ? 'Crear Usuario' : 'Iniciar sesión')
            }
          </button>
          
          {/* Toggle Login/Register */}
          <p className="text-center text-sm text-[var(--color-muted)]">
            {isRegistering ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-[var(--color-accent)] hover:underline px-1 rounded transition-colors duration-200"
            >
              {isRegistering ? 'Iniciar sesión' : 'Crear Usuario'}
            </button>
          </p>
        </form>

        {/* Passkey login (fuera del form: no debe enviarse como submit).
            Se oculta mientras el modal de cambio está abierto: no se puede
            iniciar otra sesión con passkey mientras el cambio es obligatorio. */}
        {!isRegistering && !requiereCambio && passkeysSoportados && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              <span className="text-sm text-[var(--color-muted)]">o</span>
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
            <PasskeyButton onClick={passkey.iniciarConPasskey} isLoading={passkey.isLoading} />
            {passkey.error && (
              <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <p className="text-sm text-[var(--color-danger)] text-center">{passkey.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: cambio de contraseña obligatorio (issue #99) ─────────────
         Se abre sobre la pantalla de login, que queda visible detrás. Vive
         FUERA del <form> de login: su submit no re-envía credenciales. Es
         obligatorio: no se cierra con Escape ni click en el backdrop — la
         única salida es completar el cambio o "Cerrar sesión". */}
      {requiereCambio && (
        <>
          <div className="modal-backdrop" />
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cambio-contrasena-titulo"
          >
            <div className="p-6">
              <form onSubmit={handleCambioObligatorio} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <KeyRound className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <h2
                      id="cambio-contrasena-titulo"
                      className="font-semibold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      Cambio de contraseña obligatorio
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      Ingresaste con un código de un solo uso. Creá una contraseña nueva para continuar.
                    </p>
                  </div>
                </div>

                {modalError && (
                  <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20" role="alert">
                    <p className="text-sm text-[var(--color-danger)] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {modalError}
                    </p>
                  </div>
                )}

                {modalExito && (
                  <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
                    <p className="text-sm text-[var(--color-success)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Contraseña modificada. Ingresando...
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="cambio-contrasena-nueva" className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                    Contraseña nueva
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input
                      id="cambio-contrasena-nueva"
                      type="password"
                      value={contrasenaNueva}
                      onChange={(e) => { setContrasenaNueva(e.target.value); setModalError(null); }}
                      placeholder="••••••••"
                      className="input !pl-11"
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cambio-contrasena-confirmar" className="block text-sm font-medium text-[var(--color-muted)] mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input
                      id="cambio-contrasena-confirmar"
                      type="password"
                      value={confirmarContrasena}
                      onChange={(e) => { setConfirmarContrasena(e.target.value); setModalError(null); }}
                      placeholder="••••••••"
                      className="input !pl-11"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <KeyRound className="w-5 h-5" />
                  )}
                  {modalLoading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>

                <p className="text-center text-sm text-[var(--color-muted)]">
                  ¿No sos vos?{' '}
                  <button
                    type="button"
                    onClick={handleSalir}
                    className="text-[var(--color-accent)] hover:underline px-1 rounded transition-colors duration-200"
                  >
                    Cerrar sesión
                  </button>
                </p>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
