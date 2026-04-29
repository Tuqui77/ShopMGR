import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { useTrabajos, useAgregarHoras } from '../hooks/useTrabajos';
import { useCostoHora } from '../hooks/useCostoHora';
import clsx from 'clsx';
import type { Trabajo } from '../types';
import { X, ArrowLeft, Search, Star, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';

export function HoursModal() {
  const { 
    showHoursModal, 
    setShowHoursModal, 
    lastTrabajoId, 
    setSelectedTrabajo, 
    selectedTrabajo 
  } = useStore();
  
  // Obtener trabajos de la API
  const { data: trabajos = [] } = useTrabajos();
  
  // Obtener costo hora de la configuración
  const { data: costoHora, isLoading: costoHoraLoading } = useCostoHora();
  
  // Mutation para agregar horas
  const agregarHorasMutation = useAgregarHoras();
  
  // Derive step from selectedTrabajo - no separate state needed
  const step: 'select' | 'hours' = selectedTrabajo ? 'hours' : 'select';
  
  const [hours, setHours] = useState(0.5);
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClose = useCallback(() => {
    setShowHoursModal(false);
    setHours(0.5);
    setDescription('');
    setShowSuccess(false);
    // Limpiar selectedTrabajo para que la próxima apertura sea limpia
    setSelectedTrabajo(null);
  }, [setShowHoursModal, setHours, setDescription, setShowSuccess, setSelectedTrabajo]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHoursModal) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showHoursModal, handleClose]);

  if (!showHoursModal) return null;
  
  const handleSelectTrabajo = (trabajo: Trabajo) => {
    setSelectedTrabajo(trabajo);
    // step is now derived from selectedTrabajo, no need to setStep
  };
  
  const handleAddHours = async () => {
    if (selectedTrabajo) {
      try {
        await agregarHorasMutation.mutateAsync({
          idTrabajo: selectedTrabajo.id,
          horas: hours,
          descripcion: description,
          fecha: new Date().toISOString().split('T')[0],
        });
        setShowSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        console.error('Error al registrar horas:', error);
        alert('Error al registrar horas. Intenta de nuevo.');
      }
    }
  };
  
  const handleQuickAdd = (amount: number) => {
    setHours(prev => Math.min(prev + amount, 24));
  };
  
  const activeTrabajos = trabajos.filter(t => t.estado !== 'Terminado');
  const lastTrabajo = lastTrabajoId 
    ? trabajos.find(t => t.id === lastTrabajoId) 
    : activeTrabajos[0];
  
  return (
    <>
      <div className="modal-backdrop" onClick={handleClose} />
      <div className="modal-content">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={step === 'hours' ? () => setSelectedTrabajo(null) : handleClose} className="btn-icon">
              {step === 'select' ? (
                <X className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </button>
            <h2 className="font-semibold text-lg">
              {showSuccess ? '¡Listo!' : step === 'hours' ? 'Registrar Horas' : 'Registrar Horas'}
            </h2>
            <div className="w-11" />
          </div>
          
          {showSuccess ? (
            <SuccessView 
              hours={hours} 
              valor={costoHora ? hours * costoHora : undefined}
              trabajo={selectedTrabajo!}
              totalAcumulado={selectedTrabajo!.horasRegistradas + hours}
              totalEstimado={selectedTrabajo!.horasEstimadas || 0}
            />
          ) : step === 'select' ? (
            <SelectTrabajoView 
              trabajos={activeTrabajos}
              lastTrabajo={lastTrabajo}
              onSelect={handleSelectTrabajo}
              onContinue={() => lastTrabajo && handleSelectTrabajo(lastTrabajo)}
            />
          ) : (
            <HoursInputView
              trabajo={selectedTrabajo!}
              hours={hours}
              description={description}
              valorHora={costoHora}
              isLoading={costoHoraLoading}
              isSubmitting={agregarHorasMutation.isPending}
              onHoursChange={setHours}
              onDescriptionChange={setDescription}
              onQuickAdd={handleQuickAdd}
              onSubmit={handleAddHours}
            />
          )}
        </div>
      </div>
    </>
  );
}

function SelectTrabajoView({ 
  trabajos, 
  lastTrabajo, 
  onSelect, 
  onContinue 
}: { 
  trabajos: Trabajo[];
  lastTrabajo: Trabajo | undefined;
  onSelect: (t: Trabajo) => void;
  onContinue: () => void;
}) {
  const [search, setSearch] = useState('');
  
  const filtered = trabajos.filter(t => 
    t.titulo.toLowerCase().includes(search.toLowerCase()) ||
    t.cliente?.nombreCompleto.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="animate-fade-in">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          placeholder="Buscar trabajo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      
      {lastTrabajo && (
        <button
          onClick={() => onSelect(lastTrabajo)}
          className="w-full card mb-3"
          style={{ borderColor: 'var(--color-accent)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, transparent)' }}
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
            <div className="flex-1 text-left">
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>{lastTrabajo.titulo}</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{lastTrabajo.cliente?.nombreCompleto || 'Sin cliente'}</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Usado recientemente</span>
          </div>
        </button>
      )}
      
      <div className="space-y-2">
        {filtered.map(trabajo => (
          <button
            key={trabajo.id}
            onClick={() => onSelect(trabajo)}
            className="w-full p-3 rounded-lg text-left transition-colors"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center gap-3">
              <div className={clsx('status-dot', trabajo.estado)} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {trabajo.cliente?.nombreCompleto || 'Sin cliente'} · {trabajo.horasRegistradas}h registradas
                </p>
              </div>
            </div>
          </button>
        ))}
        
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No hay trabajos activos</p>
          </div>
        )}
      </div>
      
      <button
        onClick={onContinue}
        className={clsx('btn-primary mt-6', !lastTrabajo && 'opacity-50')}
        disabled={!lastTrabajo}
      >
        Continuar
      </button>
    </div>
  );
}

function HoursInputView({
  trabajo,
  hours,
  description,
  valorHora,
  isLoading,
  isSubmitting,
  onHoursChange,
  onDescriptionChange,
  onQuickAdd,
  onSubmit,
}: {
  trabajo: Trabajo;
  hours: number;
  description: string;
  valorHora: number | undefined;
  isLoading: boolean;
  isSubmitting: boolean;
  onHoursChange: (h: number) => void;
  onDescriptionChange: (d: string) => void;
  onQuickAdd: (a: number) => void;
  onSubmit: () => void;
}) {
  const costoNoConfigurado = !isLoading && (valorHora === undefined || valorHora === 0);
  
  return (
    <div className="animate-fade-in">
      <div className="card mb-4" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, transparent)', borderColor: 'var(--color-accent)' }}>
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{trabajo.cliente?.nombreCompleto || 'Sin cliente'}</p>
      </div>
      
      <div className="mb-6">
        <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>HORAS TRABAJADAS</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button 
            onClick={() => onQuickAdd(0.5)}
            className="btn-secondary py-4"
          >
            <span className="text-lg font-bold">+½</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>0.5h</span>
          </button>
          <button 
            onClick={() => onQuickAdd(1)}
            className="btn-secondary py-4"
          >
            <span className="text-lg font-bold">+1</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>1h</span>
          </button>
          <button 
            onClick={() => onQuickAdd(2)}
            className="btn-secondary py-4"
          >
            <span className="text-lg font-bold">+2</span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>2h</span>
          </button>
        </div>
        
        <button 
          onClick={() => {
            const input = prompt('¿Cuántas horas?', hours.toString());
            if (input) onHoursChange(parseFloat(input) || 0);
          }}
          className="input text-center text-2xl font-bold font-mono"
        >
          {hours} horas
        </button>
        
        {isLoading ? (
          <p className="text-center text-sm mt-2 animate-pulse" style={{ color: 'var(--color-muted)' }}>
            Cargando costo hora...
          </p>
        ) : costoNoConfigurado ? (
          <p className="text-center text-sm mt-2" style={{ color: 'var(--color-warning)' }}>
            Valor hora no configurado. Configurá el costo hora en Ajustes.
          </p>
        ) : (
          <p className="text-center font-mono mt-2" style={{ color: 'var(--color-success)' }}>
            {formatCurrency(hours * valorHora!)} (≈{hours}h @ {formatCurrency(valorHora!)}/h)
          </p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="text-sm mb-2 block" style={{ color: 'var(--color-muted)' }}>DESCRIPCIÓN (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Cambio de pastillas, Inspección..."
          className="input min-h-[80px] resize-none"
        />
      </div>
      
      <button 
        onClick={onSubmit} 
        className="btn-primary w-full flex items-center justify-center gap-2"
        disabled={isSubmitting || isLoading || costoNoConfigurado}
        title={costoNoConfigurado ? 'Configurá el costo hora primero' : undefined}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          '✓ Guardar Horas'
        )}
      </button>
    </div>
  );
}

function SuccessView({ 
  hours, 
  valor, 
  trabajo, 
  totalAcumulado, 
  totalEstimado 
}: { 
  hours: number;
  valor: number | undefined;
  trabajo: Trabajo;
  totalAcumulado: number;
  totalEstimado: number;
}) {
  const progress = totalEstimado > 0 ? (totalAcumulado / totalEstimado) * 100 : 0;
  
  return (
    <div className="animate-scale-in text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}>
        <CheckCircle className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
      </div>
      
      <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>HORAS REGISTRADAS</p>
      <p className="text-4xl font-bold font-mono mb-1" style={{ color: 'var(--color-text)' }}>{hours}h</p>
      {valor !== undefined ? (
        <p className="text-xl font-mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(valor)}</p>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Valor no disponible</p>
      )}
      
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{trabajo.titulo}</p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{trabajo.cliente?.nombreCompleto || 'Sin cliente'}</p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
          <span>Total acumulado: {totalAcumulado}h</span>
          {totalEstimado > 0 && <span>{Math.round(progress)}% del estimado</span>}
        </div>
        {totalEstimado > 0 && (
          <div className="progress-bar h-3">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--color-success)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
