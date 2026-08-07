import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import clsx from 'clsx';
import { Home, Users, Wrench, Clipboard, Settings, LogOut, UserRound } from 'lucide-react';
import { useStore } from '../store';
import { authService } from '../services/auth';
import { obtenerNombreUsuarioDesdeToken } from '../utils/jwt';

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/trabajos', icon: Wrench, label: 'Trabajos' },
  { path: '/presupuestos', icon: Clipboard, label: 'Presupuestos' },
];

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === '/') return currentPath === '/';
  return currentPath.startsWith(itemPath);
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useStore();

  // Nombre del usuario logueado desde el JWT (issue #112). Si el token no lo
  // trae (token viejo), se muestra el fallback "Mi cuenta" — nunca el id.
  const accessToken = useStore((s) => s.accessToken);
  const nombreUsuario = useMemo(
    () => obtenerNombreUsuarioDesdeToken(accessToken),
    [accessToken],
  );

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
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">ShopMGR</div>
        <p className="sidebar-subtitle">Taller Mecánico</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={clsx(
              'sidebar-item',
              isActivePath(location.pathname, path) && 'active'
            )}
          >
            <Icon className="sidebar-item-icon" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Separator */}
      <div className="sidebar-divider" />

      {/* Footer actions */}
      <div className="sidebar-footer">
        <Link
          to="/configuracion"
          className={clsx(
            'sidebar-item',
            location.pathname === '/configuracion' && 'active'
          )}
        >
          <Settings className="sidebar-item-icon" />
          <span>Configuración</span>
        </Link>

        {/* Fila: nombre de usuario (→ /perfil) + cerrar sesión como icono chico */}
        <div className="flex items-center gap-0.5">
          <Link
            to="/perfil"
            className={clsx(
              'sidebar-item flex-1 min-w-0',
              location.pathname === '/perfil' && 'active'
            )}
            title={nombreUsuario ?? 'Mi cuenta'}
          >
            <UserRound className="sidebar-item-icon" />
            <span className="truncate">{nombreUsuario ?? 'Mi cuenta'}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="sidebar-logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
