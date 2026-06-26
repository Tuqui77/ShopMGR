import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Users, Wrench, Clipboard, Settings, LogOut } from 'lucide-react';
import { useStore } from '../store';

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
  const { setIsAuthenticated } = useStore();

  const handleLogout = () => {
    setIsAuthenticated(false);
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
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-left"
        >
          <LogOut className="sidebar-item-icon" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
