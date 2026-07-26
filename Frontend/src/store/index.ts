import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cliente, Trabajo, HorasRegistradas, Presupuesto, MaterialRequest } from '../types';

// Type for duplicating a presupuesto
interface DatosDuplicarPresupuesto {
  idCliente: number;
  nombreCliente: string;
  titulo: string;
  descripcion: string;
  horasEstimadas: number;
  materiales: MaterialRequest[];
}

interface AppState {
  // Data
  clientes: Cliente[];
  trabajos: Trabajo[];
  horas: HorasRegistradas[];
  presupuestos: Presupuesto[];
  valorHora: number;
  
  // Auth State (JWT tokens)
  accessToken: string | null;
  refreshToken: string | null;
  
  // UI State
  showHoursModal: boolean;
  showClienteForm: boolean;
  showPresupuestoForm: boolean;
  showTrabajoForm: boolean;
  showMovimientoModal: boolean;
  imageFullscreenOpen: boolean;
  selectedTrabajo: Trabajo | null;
  lastTrabajoId: number | null;
  
  // Edit mode state
  editingCliente: Cliente | null;
  editingTrabajoId: number | null;
  editingPresupuestoId: number | null;
  
  // Duplicar presupuesto state
  datosDuplicarPresupuesto: DatosDuplicarPresupuesto | null;
  
  // Auth Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  
  // UI Actions
  setShowHoursModal: (show: boolean) => void;
  setShowClienteForm: (show: boolean) => void;
  setShowPresupuestoForm: (show: boolean) => void;
  setShowTrabajoForm: (show: boolean) => void;
  setShowMovimientoModal: (show: boolean) => void;
  setImageFullscreenOpen: (open: boolean) => void;
  setSelectedTrabajo: (trabajo: Trabajo | null) => void;
  setEditingCliente: (cliente: Cliente | null) => void;
  setEditingTrabajoId: (id: number | null) => void;
  setEditingPresupuestoId: (id: number | null) => void;
  setDatosDuplicarPresupuesto: (datos: DatosDuplicarPresupuesto | null) => void;
  addHoras: (idTrabajo: number, horas: number, descripcion: string) => void;
  updateTrabajoEstado: (idTrabajo: number, estado: Trabajo['estado']) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial data (empty — server state managed by React Query)
      clientes: [],
      trabajos: [],
      horas: [],
      presupuestos: [],
      valorHora: 0,
      
      // Initial auth state
      accessToken: null,
      refreshToken: null,
      
      // Initial UI state
      showHoursModal: false,
      showClienteForm: false,
      showPresupuestoForm: false,
      showTrabajoForm: false,
      showMovimientoModal: false,
      imageFullscreenOpen: false,
      selectedTrabajo: null,
      lastTrabajoId: null,
      editingCliente: null,
      editingTrabajoId: null,
      editingPresupuestoId: null,
      datosDuplicarPresupuesto: null,
      
      // Auth Actions
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      
      logout: () => {
        set({ accessToken: null, refreshToken: null });
      },
      
      // UI Actions
      setShowHoursModal: (show) => set({ showHoursModal: show }),
      
      setShowClienteForm: (show) => set({ showClienteForm: show }),
      
      setShowPresupuestoForm: (show) => set({ showPresupuestoForm: show }),
      
      setShowTrabajoForm: (show) => set({ showTrabajoForm: show }),
      
      setShowMovimientoModal: (show) => set({ showMovimientoModal: show }),
      
      setImageFullscreenOpen: (open) => set({ imageFullscreenOpen: open }),
      
      setSelectedTrabajo: (trabajo) => {
        set({ selectedTrabajo: trabajo });
        if (trabajo) {
          set({ lastTrabajoId: trabajo.id });
        }
      },
      
      setEditingCliente: (cliente) => set({ editingCliente: cliente }),
      
      setEditingTrabajoId: (id) => set({ editingTrabajoId: id }),
      
      setEditingPresupuestoId: (id) => set({ editingPresupuestoId: id }),
      
      setDatosDuplicarPresupuesto: (datos) => set({ datosDuplicarPresupuesto: datos }),
      
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
    }),
    {
      name: 'shopmgr-storage',
      partialize: (state) => ({ accessToken: state.accessToken, refreshToken: state.refreshToken }),
    }
  )
);
