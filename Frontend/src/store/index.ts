import { create } from 'zustand';
import type { Cliente, Trabajo, HorasRegistradas, Presupuesto } from '../types';
import { clientesMock, trabajosMock, horasMock, valorHoraMock, presupuestosMock } from '../data/mock';

interface AppState {
  // Data
  clientes: Cliente[];
  trabajos: Trabajo[];
  horas: HorasRegistradas[];
  presupuestos: Presupuesto[];
  valorHora: number;
  
  // UI State
  showHoursModal: boolean;
  selectedTrabajo: Trabajo | null;
  lastTrabajoId: number | null;
  
  // Actions
  setShowHoursModal: (show: boolean) => void;
  setSelectedTrabajo: (trabajo: Trabajo | null) => void;
  addHoras: (idTrabajo: number, horas: number, descripcion: string) => void;
  updateTrabajoEstado: (idTrabajo: number, estado: Trabajo['estado']) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial data
  clientes: clientesMock,
  trabajos: trabajosMock,
  horas: horasMock,
  presupuestos: presupuestosMock,
  valorHora: valorHoraMock,
  
  // Initial UI state
  showHoursModal: false,
  selectedTrabajo: null,
  lastTrabajoId: null,
  
  // Actions
  setShowHoursModal: (show) => set({ showHoursModal: show }),
  
  setSelectedTrabajo: (trabajo) => {
    set({ selectedTrabajo: trabajo });
    if (trabajo) {
      set({ lastTrabajoId: trabajo.id });
    }
  },
  
  addHoras: (idTrabajo, horas, descripcion) => {
    const { valorHora, horas: existingHoras, trabajos } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const newHoras: HorasRegistradas = {
      id: Math.max(...existingHoras.map(h => h.id), 0) + 1,
      idTrabajo,
      horas,
      descripcion,
      fecha: today,
      valor: horas * valorHora,
    };
    
    // Update trabajo hours
    const updatedTrabajos = trabajos.map(t => {
      if (t.id === idTrabajo) {
        return {
          ...t,
          horasRegistradas: t.horasRegistradas + horas,
          estado: 'Iniciado' as const,
        };
      }
      return t;
    });
    
    set(state => ({
      horas: [...state.horas, newHoras],
      trabajos: updatedTrabajos,
      showHoursModal: false,
      selectedTrabajo: null,
    }));
  },
  
  updateTrabajoEstado: (idTrabajo, estado) => {
    set(state => ({
      trabajos: state.trabajos.map(t => 
        t.id === idTrabajo ? { ...t, estado } : t
      ),
    }));
  },
}));
