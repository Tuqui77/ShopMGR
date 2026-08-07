import { useState, useMemo, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, UserRound, KeyRound, Shield, Copy, Check, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import {
  obtenerRolDesdeToken,
  obtenerNombreUsuarioDesdeToken,
  obtenerIdUsuarioDesdeToken,
} from '../utils/jwt';
import { PasskeySection } from '../components/PasskeySection';
import { authService, extractAuthErrorMessage } from '../services/auth';
import { useStore } from '../store';
import type { RolUsuario } from '../types';

// ============================================================================
// Cuenta (issue #99): cambio de contraseña
// ============================================================================

const MENSAJE_VALIDACION_CONTRASENA = 'Completá la contraseña actual y la nueva.';
const MENSAJE_ERROR_CONTRASENA = 'No se pudo cambiar la contraseña. Probá de nuevo.';

// ============================================================================
// Administrar usuarios (issue #99, solo Administrador)
// ============================================================================

const ROLES_OPCIONES: { value: RolUsuario; label: string }[] = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Empleado', label: 'Empleado' },
  { value: 'Cliente', label: 'Cliente' },
];

const MENSAJE_ERROR_ROL = 'No se pudo cambiar el rol. Probá de nuevo.';

// ============================================================================
// Component
// ============================================================================

/**
 * Página de perfil del usuario logueado (issue #112): datos de la cuenta,
 * cambio de contraseña, administración de usuarios (solo admin, issue #99) y
 * gestión de passkeys. Se accede desde la barra lateral vía un botón que
 * muestra el nombre de usuario.
 */
export function Perfil() {
  const accessToken = useStore((s) => s.accessToken);
  const setTokens = useStore((s) => s.setTokens);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  // Datos derivados del JWT de acceso (claims "unique_name"/"name" y "role").
  // El id de usuario NO se muestra (issue #112): la UI solo usa nombre y rol.
  const nombreUsuario = useMemo(() => obtenerNombreUsuarioDesdeToken(accessToken), [accessToken]);
  const rol = useMemo(() => obtenerRolDesdeToken(accessToken), [accessToken]);
  const idUsuarioLogueado = useMemo(
    () => obtenerIdUsuarioDesdeToken(accessToken),
    [accessToken],
  );

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

  // ── Administrar usuarios (issue #99, solo Admin) ───────────────────────────
  // El rol se deriva del JWT de acceso (claim "role"); como el token se renueva
  // vía el interceptor de refresh, esta derivación se mantiene siempre al día.
  const {
    data: usuarios = [],
    isLoading: isLoadingUsuarios,
    isError: isErrorUsuarios,
    refetch: refetchUsuarios,
  } = useQuery({
    queryKey: ['usuarios'],
    queryFn: authService.listarUsuarios,
    enabled: rol === 'Administrador',
  });

  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState<number | null>(null);
  const [nuevoRol, setNuevoRol] = useState<RolUsuario | null>(null);
  const [codigoRestaurado, setCodigoRestaurado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [showRolAdminSuccess, setShowRolAdminSuccess] = useState(false);
  const [contrasenaNuevaAdmin, setContrasenaNuevaAdmin] = useState('');
  const [validacionContrasenaAdmin, setValidacionContrasenaAdmin] = useState<string | null>(null);
  const [showContrasenaAdminSuccess, setShowContrasenaAdminSuccess] = useState(false);

  const usuarioSeleccionado = usuarios.find((u) => u.id === usuarioSeleccionadoId) ?? null;

  const cambiarRolAdminMutation = useMutation({
    mutationFn: ({ id, rol: rolNuevo }: { id: number; rol: RolUsuario }) =>
      authService.cambiarRol(id, rolNuevo),
    onSuccess: () => {
      void refetchUsuarios();
    },
  });

  const restaurarContrasenaMutation = useMutation({
    mutationFn: (idUsuario: number) => authService.restaurarContraseña(idUsuario),
    onSuccess: (codigo) => {
      setCodigoRestaurado(codigo);
      setCopiado(false);
    },
  });

  const cambiarContrasenaAdminMutation = useMutation({
    mutationFn: ({ id, nueva }: { id: number; nueva: string }) =>
      authService.cambiarContrasenaAdmin(id, nueva),
    onSuccess: () => {
      setContrasenaNuevaAdmin('');
      setShowContrasenaAdminSuccess(true);
      setTimeout(() => setShowContrasenaAdminSuccess(false), 3000);
    },
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

  const handleUsuarioChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setUsuarioSeleccionadoId(value === '' ? null : Number(value));
    setNuevoRol(null);
    setCodigoRestaurado(null);
    setValidacionContrasenaAdmin(null);
    if (cambiarRolAdminMutation.isError) cambiarRolAdminMutation.reset();
    if (restaurarContrasenaMutation.isError) restaurarContrasenaMutation.reset();
    if (cambiarContrasenaAdminMutation.isError) cambiarContrasenaAdminMutation.reset();
  };

  const handleNuevoRolChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNuevoRol(value === '' ? null : (value as RolUsuario));
    if (cambiarRolAdminMutation.isError) cambiarRolAdminMutation.reset();
  };

  const handleGuardarRolAdmin = () => {
    if (usuarioSeleccionado === null || nuevoRol === null || nuevoRol === usuarioSeleccionado.rol) return;
    cambiarRolAdminMutation.mutate(
      { id: usuarioSeleccionado.id, rol: nuevoRol },
      {
        onSuccess: () => {
          setShowRolAdminSuccess(true);
          setTimeout(() => setShowRolAdminSuccess(false), 3000);
          setNuevoRol(null);
          // Si el usuario es uno mismo, el JWT local queda con el claim de rol
          // viejo hasta el próximo refresh: se pide un token nuevo.
          if (usuarioSeleccionado.id === idUsuarioLogueado) {
            void refrescarTokenTrasCambioDeRol();
          }
        },
      },
    );
  };

  const handleRestaurarContrasena = () => {
    if (usuarioSeleccionado === null) return;
    restaurarContrasenaMutation.mutate(usuarioSeleccionado.id);
  };

  const handleCopiarCodigo = async () => {
    if (codigoRestaurado === null) return;
    try {
      await navigator.clipboard.writeText(codigoRestaurado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard no disponible (sin permiso): el código queda visible para
      // copiado manual.
    }
  };

  const handleContrasenaNuevaAdminChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContrasenaNuevaAdmin(e.target.value);
    setValidacionContrasenaAdmin(null);
    if (cambiarContrasenaAdminMutation.isError) cambiarContrasenaAdminMutation.reset();
  };

  const handleGuardarContrasenaAdmin = () => {
    if (usuarioSeleccionado === null) return;
    if (!contrasenaNuevaAdmin.trim()) {
      setValidacionContrasenaAdmin('Ingresá la contraseña nueva.');
      return;
    }
    setValidacionContrasenaAdmin(null);
    cambiarContrasenaAdminMutation.mutate({
      id: usuarioSeleccionado.id,
      nueva: contrasenaNuevaAdmin,
    });
  };

  // ── Cerrar sesión (issue #121) ────────────────────────────────────────────
  // En móvil el Sidebar (desktop) no está disponible; el logout vive acá junto
  // al acceso a Perfil del Dashboard header. Mismo patrón que el Sidebar.
  const handleLogout = async () => {
    try {
      // La cookie HttpOnly se borra server-side en /Auth/CerrarSesion (issue #114).
      await authService.cerrarSesion();
    } catch {
      // Ignore errors — always clear local state
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <h1 className="text-xl font-bold font-display">Perfil</h1>
      </header>

      <section className="px-4 space-y-6">
        {/* Perfil: datos derivados del JWT — SIN mostrar el id de usuario */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <UserRound className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Perfil</h2>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Datos de tu cuenta.</p>
            </div>
            {/* Cerrar sesión (issue #121): solo móvil (lg:!hidden por conflicto de
                capas con .sidebar-logout-btn, ver Dashboard header). En desktop el
                Sidebar tiene su propio logout y este botón queda oculto. */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="sidebar-logout-btn lg:!hidden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Nombre de usuario</span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {nombreUsuario ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Rol</span>
              {rol === null ? (
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>—</span>
              ) : (
                <span className="badge badge-active">{rol}</span>
              )}
            </div>
          </div>
        </div>

        {/* Seguridad: cambiar contraseña (issue #99) */}
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

        {/* Passkeys: gestión embebida (issue #112/#113) */}
        <div className="card">
          <PasskeySection embedded />
        </div>

        {/* Administrar usuarios: solo visible para administradores (issue #99) */}
        {rol === 'Administrador' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Shield className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Administrar usuarios</h2>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Cambiá el rol o restaurá la contraseña de un usuario.</p>
            </div>
          </div>

          {isLoadingUsuarios ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-muted)' }} />
            </div>
          ) : isErrorUsuarios ? (
            <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              No se pudieron cargar los usuarios. Probá de nuevo más tarde.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Selector de usuario */}
              <div>
                <label htmlFor="usuario-a-administrar" className="text-sm mb-1 block" style={{ color: 'var(--color-muted)' }}>
                  Usuario
                </label>
                <select
                  id="usuario-a-administrar"
                  value={usuarioSeleccionadoId ?? ''}
                  onChange={handleUsuarioChange}
                  className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)] w-full"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-surface)'
                  }}
                >
                  <option value="" disabled>Seleccionar usuario...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.userName} — {u.rol}
                    </option>
                  ))}
                </select>
              </div>

              {usuarioSeleccionado === null ? (
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Seleccioná un usuario para administrar su rol o contraseña.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Cambiar rol del usuario seleccionado */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      value={nuevoRol ?? ''}
                      onChange={handleNuevoRolChange}
                      aria-label={`Nuevo rol para ${usuarioSeleccionado.userName}`}
                      className="text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:bg-[var(--color-hover)] flex-1"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-surface)'
                      }}
                    >
                      <option value="" disabled>Cambiar rol...</option>
                      {ROLES_OPCIONES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleGuardarRolAdmin}
                      disabled={nuevoRol === null || nuevoRol === usuarioSeleccionado.rol || cambiarRolAdminMutation.isPending || showRolAdminSuccess}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: showRolAdminSuccess ? 'var(--color-success)' : 'var(--color-accent)',
                        color: 'white'
                      }}
                    >
                      {cambiarRolAdminMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </span>
                      ) : showRolAdminSuccess ? (
                        'Guardado'
                      ) : (
                        'Cambiar rol'
                      )}
                    </button>
                  </div>

                  {cambiarRolAdminMutation.isError && (
                    <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {extractAuthErrorMessage(cambiarRolAdminMutation.error) || MENSAJE_ERROR_ROL}
                    </p>
                  )}

                  {/* Restaurar contraseña (código de un solo uso) */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                      {codigoRestaurado === null ? (
                        <span>
                          Generá un código de un solo uso para que{' '}
                          <strong style={{ color: 'var(--color-text)' }}>{usuarioSeleccionado.userName}</strong>{' '}
                          ingrese y configure una contraseña nueva.
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs">Código de un solo uso:</span>
                          <code
                            className="px-2 py-1 rounded-lg font-mono text-sm tracking-widest"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)' }}
                          >
                            {codigoRestaurado}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopiarCodigo}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors duration-200 hover:bg-[var(--color-hover)]"
                            style={{ color: 'var(--color-accent)' }}
                            aria-label="Copiar código"
                          >
                            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiado ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRestaurarContrasena}
                      disabled={restaurarContrasenaMutation.isPending}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
                    >
                      {restaurarContrasenaMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generando...
                        </span>
                      ) : (
                        'Restaurar contraseña'
                      )}
                    </button>
                  </div>

                  {restaurarContrasenaMutation.isError && (
                    <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {extractAuthErrorMessage(restaurarContrasenaMutation.error) ||
                        'No se pudo generar el código. Probá de nuevo.'}
                    </p>
                  )}

                  {/* Cambiar contraseña directa (admin) */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <label htmlFor="contrasena-nueva-admin" className="text-sm mb-1 block" style={{ color: 'var(--color-muted)' }}>
                        Contraseña nueva para {usuarioSeleccionado.userName}
                      </label>
                      <input
                        id="contrasena-nueva-admin"
                        type="password"
                        value={contrasenaNuevaAdmin}
                        onChange={handleContrasenaNuevaAdminChange}
                        placeholder="••••••••"
                        className="input"
                        autoComplete="new-password"
                      />
                    </div>

                    <button
                      onClick={handleGuardarContrasenaAdmin}
                      disabled={!contrasenaNuevaAdmin.trim() || cambiarContrasenaAdminMutation.isPending || showContrasenaAdminSuccess}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: showContrasenaAdminSuccess ? 'var(--color-success)' : 'var(--color-accent)',
                        color: 'white'
                      }}
                    >
                      {cambiarContrasenaAdminMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </span>
                      ) : showContrasenaAdminSuccess ? (
                        'Guardado'
                      ) : (
                        'Guardar'
                      )}
                    </button>
                  </div>

                  {validacionContrasenaAdmin && (
                    <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {validacionContrasenaAdmin}
                    </p>
                  )}

                  {cambiarContrasenaAdminMutation.isError && (
                    <p role="alert" className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-danger)' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {extractAuthErrorMessage(cambiarContrasenaAdminMutation.error) ||
                        'No se pudo cambiar la contraseña. Probá de nuevo.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}
      </section>
    </div>
  );
}
