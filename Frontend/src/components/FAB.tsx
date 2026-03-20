import { useEffect } from 'react';
import clsx from 'clsx';
import { Plus, Clock, Wrench, User, Clipboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: 'hours' | 'trabajo' | 'cliente' | 'presupuesto') => void;
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
          onClick={() => { onAction('hours'); onToggle(); }}
        />
        <MenuButton 
          label="Nuevo Trabajo" 
          icon={Wrench} 
          onClick={() => { onAction('trabajo'); onToggle(); }}
        />
        <MenuButton 
          label="Nuevo Cliente" 
          icon={User} 
          onClick={() => { onAction('cliente'); onToggle(); }}
        />
        <MenuButton 
          label="Presupuesto" 
          icon={Clipboard} 
          onClick={() => { onAction('presupuesto'); onToggle(); }}
        />
      </div>
      
      {/* Main FAB */}
      <button
        onClick={onToggle}
        className={clsx(
          'fab-button',
          isOpen && 'fab-button-open'
        )}
      >
        <Plus />

      <style>{`
        .fab-wrapper {
          position: fixed;
          bottom: 5rem;
          right: 1rem;
          z-index: 40;
        }

        .fab-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: -1;
          animation: fadeIn 0.15s ease-out;
        }

        .fab-menu {
          position: absolute;
          bottom: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
          transition: all 0.2s;
        }

        .fab-menu-open {
          opacity: 1;
          transform: translateY(0);
        }

        .fab-menu-closed {
          opacity: 0;
          transform: translateY(1rem);
          pointer-events: none;
        }

        .fab-button {
          width: 3.5rem;
          height: 3.5rem;
          background-color: var(--color-accent);
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-page);
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--color-accent) 30%, transparent);
          transition: all 0.15s;
        }

        .fab-button:hover {
          filter: brightness(1.1);
        }

        .fab-button:active {
          transform: scale(0.9);
        }

        .fab-button-open svg {
          transform: rotate(45deg);
        }

        @media (min-width: 1024px) {
          .fab-wrapper {
            bottom: 2rem;
            right: 2rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
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
      onClick={onClick}
      className="fab-menu-item"
    >
      <span className="fab-menu-label">{label}</span>
      <div className="fab-menu-icon">
        <Icon className="w-5 h-5" />
      </div>
      <style>{`
        .fab-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: scaleIn 0.2s ease-out;
        }

        .fab-menu-label {
          background-color: var(--color-elevated);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }

        .fab-menu-icon {
          width: 3rem;
          height: 3rem;
          background-color: var(--color-elevated);
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          color: var(--color-accent);
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </button>
  );
}
