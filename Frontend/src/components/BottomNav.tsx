import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Home, Users, Wrench, Clipboard } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/trabajos', icon: Wrench, label: 'Trabajos' },
  { path: '/presupuestos', icon: Clipboard, label: 'Presup.' },
];

export function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="bottom-nav safe-area-top lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={clsx(
              'nav-item',
              location.pathname === path && 'active'
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
