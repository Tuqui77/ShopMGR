import { useEffect, useRef, useCallback, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useCalculator } from '../hooks/useCalculator';

interface CalculatorModalProps {
  position: { x: number; y: number };
  onResult: (value: number, shouldApply: boolean) => void;
  onClose: () => void;
}

const MODAL_WIDTH = 280;
const MODAL_HEIGHT_ESTIMATE = 420;
const PADDING = 12;

export function CalculatorModal({ position, onResult, onClose }: CalculatorModalProps) {
  const {
    display,
    displayOperation,
    handleOperation,
    handleEquals,
    clear,
    inputDigit,
    inputDecimal,
    toggleSign,
    inputPercent,
    deleteLastDigit,
    getCurrentResult,
  } = useCalculator();

  const modalRef = useRef<HTMLDivElement>(null);
  const [clampedPosition, setClampedPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Determinar si es mobile y calcular posición al montar
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 640;
    setIsMobile(mobile);

    if (!mobile) {
      let x = position.x;
      let y = position.y;

      // Clamp horizontal
      if (x + MODAL_WIDTH > vw - PADDING) {
        x = vw - MODAL_WIDTH - PADDING;
      }
      if (x < PADDING) {
        x = PADDING;
      }

      // Clamp vertical
      if (y + MODAL_HEIGHT_ESTIMATE > vh - PADDING) {
        y = vh - MODAL_HEIGHT_ESTIMATE - PADDING;
      }
      if (y < PADDING) {
        y = PADDING;
      }

      setClampedPosition({ x, y });
    }
  }, [position.x, position.y]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Cerrar al hacer clic fuera (solo en desktop flotante)
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Pequeño retraso para evitar que el click que abrió la calculadora la cierre
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isMobile]);

  const handleApply = useCallback(() => {
    const value = getCurrentResult();
    onResult(value, true);
  }, [getCurrentResult, onResult]);

  const handleButtonClick = useCallback((value: string) => {
    switch (value) {
      case 'C':
        clear();
        break;
      case '±':
        toggleSign();
        break;
      case '%':
        inputPercent();
        break;
      case '÷':
      case '×':
      case '-':
      case '+':
        handleOperation(value as '+' | '-' | '×' | '÷');
        break;
      case '=':
        handleEquals();
        break;
      case '.':
        inputDecimal();
        break;
      case 'backspace':
        deleteLastDigit();
        break;
      default:
        if (value >= '0' && value <= '9') {
          inputDigit(value);
        }
        break;
    }
  }, [clear, toggleSign, inputPercent, handleOperation, handleEquals, inputDecimal, inputDigit, deleteLastDigit]);

  // Botón base
  const baseBtn =
    "flex items-center justify-center rounded-[var(--radius-md)] font-medium text-sm transition-all duration-100 select-none active:scale-95";

  const numberBtn = `${baseBtn} bg-[var(--color-card)] hover:bg-white/10 active:bg-white/15 text-[var(--color-text)] border border-white/10`;

  const operatorBtn = `${baseBtn} bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 active:bg-[var(--color-accent)]/35 text-[var(--color-accent)]`;

  const functionBtn = `${baseBtn} bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-muted)]`;

  // Contenido compartido entre mobile y desktop
  const calculatorContent = (
    <div
      ref={modalRef}
      className={isMobile
        ? "w-full max-w-[280px] mx-auto rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-white/10"
        : "w-[280px] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-white/10"
      }
      style={{
        backgroundColor: 'var(--color-card)',
      }}
    >
      {/* Display */}
      <div
        className="p-4 text-right border-b border-white/10 relative min-h-[72px] flex flex-col justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {displayOperation && (
          <div
            className="absolute left-4 top-3 text-xs font-mono"
            style={{ color: 'var(--color-accent)', opacity: 0.6 }}
            aria-label={`Operation: ${displayOperation}`}
          >
            {displayOperation}
          </div>
        )}
        <div
          className="text-3xl font-mono font-medium truncate tracking-tighter"
          style={{ color: display === 'Error' ? 'var(--color-danger)' : 'var(--color-text)' }}
          role="status"
          aria-live="polite"
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="p-2.5 flex flex-col gap-1.5">
        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => handleButtonClick('C')} className={`${functionBtn} h-[44px]`} aria-label="Clear">C</button>
          <button onClick={() => handleButtonClick('±')} className={`${functionBtn} h-[44px]`} aria-label="Toggle sign">±</button>
          <button onClick={() => handleButtonClick('%')} className={`${functionBtn} h-[44px]`} aria-label="Percent">%</button>
          <button onClick={() => handleButtonClick('÷')} className={`${operatorBtn} h-[44px]`} aria-label="Divide">÷</button>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => handleButtonClick('7')} className={`${numberBtn} h-[44px]`} aria-label="7">7</button>
          <button onClick={() => handleButtonClick('8')} className={`${numberBtn} h-[44px]`} aria-label="8">8</button>
          <button onClick={() => handleButtonClick('9')} className={`${numberBtn} h-[44px]`} aria-label="9">9</button>
          <button onClick={() => handleButtonClick('×')} className={`${operatorBtn} h-[44px]`} aria-label="Multiply">×</button>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => handleButtonClick('4')} className={`${numberBtn} h-[44px]`} aria-label="4">4</button>
          <button onClick={() => handleButtonClick('5')} className={`${numberBtn} h-[44px]`} aria-label="5">5</button>
          <button onClick={() => handleButtonClick('6')} className={`${numberBtn} h-[44px]`} aria-label="6">6</button>
          <button onClick={() => handleButtonClick('-')} className={`${operatorBtn} h-[44px]`} aria-label="Subtract">−</button>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => handleButtonClick('1')} className={`${numberBtn} h-[44px]`} aria-label="1">1</button>
          <button onClick={() => handleButtonClick('2')} className={`${numberBtn} h-[44px]`} aria-label="2">2</button>
          <button onClick={() => handleButtonClick('3')} className={`${numberBtn} h-[44px]`} aria-label="3">3</button>
          <button onClick={() => handleButtonClick('+')} className={`${operatorBtn} h-[44px]`} aria-label="Add">+</button>
        </div>

        {/* Row 5 */}
        <div className="grid grid-cols-4 gap-1.5">
          <button onClick={() => handleButtonClick('backspace')} className={`${functionBtn} h-[44px] text-xs`} aria-label="Delete last digit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
          <button onClick={() => handleButtonClick('0')} className={`${numberBtn} h-[44px]`} aria-label="0">0</button>
          <button onClick={() => handleButtonClick('.')} className={`${numberBtn} h-[44px]`} aria-label="Decimal point">.</button>
          <button onClick={() => handleButtonClick('=')} className={`${operatorBtn} h-[44px]`} aria-label="Equals">=</button>
        </div>

        {/* Apply button */}
        <button
          onClick={handleApply}
          className="flex items-center justify-center gap-1.5 h-[44px] rounded-[var(--radius-md)] font-medium text-sm transition-all duration-100 active:scale-95 mt-0.5"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'white',
          }}
          aria-label="Apply result"
        >
          <Check className="w-4 h-4" />
          <span>Aplicar resultado</span>
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        aria-label="Close calculator"
      >
        <X className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
      </button>
    </div>
  );

  // Mobile: overlay centrado
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {calculatorContent}
      </div>
    );
  }

  // Desktop: flotante cerca del botón
  return (
    <div
      className="fixed z-[60]"
      style={{
        left: `${clampedPosition.x}px`,
        top: `${clampedPosition.y}px`,
      }}
    >
      {calculatorContent}
    </div>
  );
}
