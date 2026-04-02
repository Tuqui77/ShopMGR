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
  
  // Auth State
  isAuthenticated: boolean;
  
  // UI State
  showHoursModal: boolean;
  showClienteForm: boolean;
  showPresupuestoForm: boolean;
  showTrabajoForm: boolean;
  selectedTrabajo: Trabajo | null;
  lastTrabajoId: number | null;
  
  // Actions
  setIsAuthenticated: (authenticated: boolean) => void;
  setShowHoursModal: (show: boolean) => void;
  setShowClienteForm: (show: boolean) => void;
  setShowPresupuestoForm: (show: boolean) => void;
  setShowTrabajoForm: (show: boolean) => void;
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
  showClienteForm: false,
  showPresupuestoForm: false,
  showTrabajoForm: false,
  selectedTrabajo: null,
  lastTrabajoId: null,
  
  // Initial auth state (check localStorage)
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  
  // Actions
  setIsAuthenticated: (authenticated) => {
    localStorage.setItem('isAuthenticated', String(authenticated));
    set({ isAuthenticated: authenticated });
  },
  
  setShowHoursModal: (show) => set({ showHoursModal: show }),
  
  setShowClienteForm: (show) => set({ showClienteForm: show }),
  
  setShowPresupuestoForm: (show) => set({ showPresupuestoForm: show }),
  
  setShowTrabajoForm: (show) => set({ showTrabajoForm: show }),
  
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
