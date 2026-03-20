import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Users, Wrench, Clipboard, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/trabajos', icon: Wrench, label: 'Trabajos' },
  { path: '/presupuestos', icon: Clipboard, label: 'Presupuestos' },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">ShopMGR</div>
      
      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={clsx(
              'sidebar-item',
              location.pathname === path && 'active'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto">
        <Link to="/configuracion" className="sidebar-item">
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
