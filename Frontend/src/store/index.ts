import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cliente, Trabajo } from '../types';

interface AppState {
  // Auth State (JWT access token; el refresh token vive en cookie HttpOnly)
  accessToken: string | null;

  // true mientras el login pendiente exige cambiar la contraseña (código de un
  // solo uso). Evita que LoginPage redirija antes de completar el cambio (#99).
  // NO se persiste: es transitorio entre login y navegación al dashboard.
  cambioContraseñaPendiente: boolean;
  
  // UI State
  showHoursModal: boolean;
  showClienteForm: boolean;
  showPresupuestoForm: boolean;
  showTrabajoForm: boolean;
  showMovimientoModal: boolean;
  imageFullscreenOpen: boolean;
  isDetailModalOpen: boolean;
  selectedTrabajo: Trabajo | null;
  lastTrabajoId: number | null;
  
  // Edit mode state
  editingCliente: Cliente | null;
  editingTrabajoId: number | null;
  editingPresupuestoId: number | null;
  
  // Auth Actions
  setTokens: (accessToken: string) => void;
  setCambioContraseñaPendiente: (pendiente: boolean) => void;
  logout: () => void;
  
  // UI Actions
  setShowHoursModal: (show: boolean) => void;
  setShowClienteForm: (show: boolean) => void;
  setShowPresupuestoForm: (show: boolean) => void;
  setShowTrabajoForm: (show: boolean) => void;
  setShowMovimientoModal: (show: boolean) => void;
  setImageFullscreenOpen: (open: boolean) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setSelectedTrabajo: (trabajo: Trabajo | null) => void;
  setEditingCliente: (cliente: Cliente | null) => void;
  setEditingTrabajoId: (id: number | null) => void;
  setEditingPresupuestoId: (id: number | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial auth state
      accessToken: null,
      cambioContraseñaPendiente: false,
      
      // Initial UI state
      showHoursModal: false,
      showClienteForm: false,
      showPresupuestoForm: false,
      showTrabajoForm: false,
      showMovimientoModal: false,
      imageFullscreenOpen: false,
      isDetailModalOpen: false,
      selectedTrabajo: null,
      lastTrabajoId: null,
      editingCliente: null,
      editingTrabajoId: null,
      editingPresupuestoId: null,
      
      // Auth Actions
      setTokens: (accessToken) => set({ accessToken }),

      setCambioContraseñaPendiente: (cambioContraseñaPendiente) =>
        set({ cambioContraseñaPendiente }),

      logout: () => {
        set({ accessToken: null, cambioContraseñaPendiente: false });
      },
      
      // UI Actions
      setShowHoursModal: (show) => set({ showHoursModal: show }),
      
      setShowClienteForm: (show) => set({ showClienteForm: show }),
      
      setShowPresupuestoForm: (show) => set({ showPresupuestoForm: show }),
      
      setShowTrabajoForm: (show) => set({ showTrabajoForm: show }),
      
      setShowMovimientoModal: (show) => set({ showMovimientoModal: show }),
      
      setImageFullscreenOpen: (open) => set({ imageFullscreenOpen: open }),
      
      setIsDetailModalOpen: (open) => set({ isDetailModalOpen: open }),
      
      setSelectedTrabajo: (trabajo) => {
        set({ selectedTrabajo: trabajo });
        if (trabajo) {
          set({ lastTrabajoId: trabajo.id });
        }
      },
      
      setEditingCliente: (cliente) => set({ editingCliente: cliente }),
      
      setEditingTrabajoId: (id) => set({ editingTrabajoId: id }),
      
      setEditingPresupuestoId: (id) => set({ editingPresupuestoId: id }),
    }),
    {
      name: 'shopmgr-storage',
      version: 2,
      // V1 persistía { accessToken, refreshToken }; V2 solo accessToken — el
      // refresh token vive en cookie HttpOnly y ya no se persiste (issue #114).
      // Se descarta el token residual y se conserva el accessToken.
      migrate: (persistedState) => {
        const legacy = persistedState as { accessToken?: unknown };
        return {
          accessToken: typeof legacy.accessToken === 'string' ? legacy.accessToken : null,
        };
      },
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
