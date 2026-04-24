import { useEffect } from 'react';
import clsx from 'clsx';
import { Plus, Clock, Wrench, User, Clipboard, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: 'hours' | 'trabajo' | 'cliente' | 'presupuesto' | 'movimiento') => void;
}

export function FAB({ isOpen, onToggle, onAction }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onToggle]);

  return (
    <div className="fab-wrapper">
      {/* Menu backdrop */}
      {isOpen && (
        <div 
          className="fab-backdrop"
          onClick={onToggle}
        />
      )}
      
      {/* Menu items */}
      <div 
        className={clsx(
          'fab-menu',
          isOpen ? 'fab-menu-open' : 'fab-menu-closed'
        )}
      >
        <MenuButton 
          label="Registrar Horas" 
          icon={Clock} 
          onClick={() => onAction('hours')}
        />
        <MenuButton 
          label="Trabajo" 
          icon={Wrench} 
          onClick={() => onAction('trabajo')}
        />
        <MenuButton 
          label="Cliente" 
          icon={User} 
          onClick={() => onAction('cliente')}
        />
        <MenuButton 
          label="Presupuesto" 
          icon={Clipboard} 
          onClick={() => onAction('presupuesto')}
        />
        <MenuButton 
          label="Movimiento" 
          icon={DollarSign} 
          onClick={() => onAction('movimiento')}
        />
      </div>
      
      {/* Main FAB */}
      <button
        onClick={onToggle}
        className={clsx(
          'fab-button',
          isOpen && 'fab-button-open'
        )}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <Plus className="fab-icon" />
      </button>
    </div>
  );
}

function MenuButton({ 
  label, 
  icon: Icon, 
  onClick 
}: { 
  label: string; 
  icon: React.FC<{ className?: string }>; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fab-menu-item"
    >
      <span className="fab-menu-label">{label}</span>
      <div className="fab-menu-icon">
        <Icon className="w-5 h-5" />
      </div>
    </button>
  );
}
