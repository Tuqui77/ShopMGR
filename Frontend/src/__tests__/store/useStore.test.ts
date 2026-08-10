import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store';
import type { Trabajo } from '../../types';

/** Lee el accessToken persistido por el middleware `persist` en localStorage. */
function readPersistedAccessToken(): string | null {
  const raw = localStorage.getItem('shopmgr-storage');
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown } };
  return typeof parsed.state?.accessToken === 'string' ? parsed.state.accessToken : null;
}

const mockTrabajo: Trabajo = {
  id: 1,
  titulo: 'Test Trabajo',
  estado: 'Pendiente',
  horasRegistradas: 0,
  fotosCount: 0,
  cliente: null,
  clienteId: 1,
};

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset completo del store al estado inicial antes de cada test
    useStore.setState(useStore.getInitialState());
  });

  describe('initial state', () => {
    it('arranca con el estado de UI en defaults', () => {
      const state = useStore.getState();
      expect(state.showHoursModal).toBe(false);
      expect(state.showClienteForm).toBe(false);
      expect(state.showPresupuestoForm).toBe(false);
      expect(state.showTrabajoForm).toBe(false);
      expect(state.showMovimientoModal).toBe(false);
      expect(state.imageFullscreenOpen).toBe(false);
      expect(state.isDetailModalOpen).toBe(false);
      expect(state.selectedTrabajo).toBe(null);
      expect(state.lastTrabajoId).toBe(null);
      expect(state.editingCliente).toBe(null);
      expect(state.editingTrabajoId).toBe(null);
      expect(state.editingPresupuestoId).toBe(null);
    });

    it('arranca sin sesión (accessToken null y cambioContraseñaPendiente false)', () => {
      const state = useStore.getState();
      expect(state.accessToken).toBe(null);
      expect(state.cambioContraseñaPendiente).toBe(false);
    });
  });

  describe('setShowHoursModal', () => {
    it('setea showHoursModal a true', () => {
      useStore.getState().setShowHoursModal(true);
      expect(useStore.getState().showHoursModal).toBe(true);
    });

    it('setea showHoursModal a false', () => {
      useStore.setState({ showHoursModal: true });
      useStore.getState().setShowHoursModal(false);
      expect(useStore.getState().showHoursModal).toBe(false);
    });
  });

  describe('setShowClienteForm', () => {
    it('setea showClienteForm a true y de vuelta a false', () => {
      useStore.getState().setShowClienteForm(true);
      expect(useStore.getState().showClienteForm).toBe(true);

      useStore.getState().setShowClienteForm(false);
      expect(useStore.getState().showClienteForm).toBe(false);
    });
  });

  describe('setShowPresupuestoForm', () => {
    it('setea showPresupuestoForm a true y de vuelta a false', () => {
      useStore.getState().setShowPresupuestoForm(true);
      expect(useStore.getState().showPresupuestoForm).toBe(true);

      useStore.getState().setShowPresupuestoForm(false);
      expect(useStore.getState().showPresupuestoForm).toBe(false);
    });
  });

  describe('setShowTrabajoForm', () => {
    it('setea showTrabajoForm a true y de vuelta a false', () => {
      useStore.getState().setShowTrabajoForm(true);
      expect(useStore.getState().showTrabajoForm).toBe(true);

      useStore.getState().setShowTrabajoForm(false);
      expect(useStore.getState().showTrabajoForm).toBe(false);
    });
  });

  describe('setShowMovimientoModal', () => {
    it('setea showMovimientoModal a true y de vuelta a false', () => {
      useStore.getState().setShowMovimientoModal(true);
      expect(useStore.getState().showMovimientoModal).toBe(true);

      useStore.getState().setShowMovimientoModal(false);
      expect(useStore.getState().showMovimientoModal).toBe(false);
    });
  });

  describe('setImageFullscreenOpen', () => {
    it('setea imageFullscreenOpen a true y de vuelta a false', () => {
      useStore.getState().setImageFullscreenOpen(true);
      expect(useStore.getState().imageFullscreenOpen).toBe(true);

      useStore.getState().setImageFullscreenOpen(false);
      expect(useStore.getState().imageFullscreenOpen).toBe(false);
    });
  });

  describe('setIsDetailModalOpen (issue #98: ocultar FAB en modales de detalle)', () => {
    it('setea isDetailModalOpen a true y de vuelta a false', () => {
      useStore.getState().setIsDetailModalOpen(true);
      expect(useStore.getState().isDetailModalOpen).toBe(true);

      useStore.getState().setIsDetailModalOpen(false);
      expect(useStore.getState().isDetailModalOpen).toBe(false);
    });
  });

  describe('setSelectedTrabajo', () => {
    it('setea selectedTrabajo y lastTrabajoId', () => {
      useStore.getState().setSelectedTrabajo(mockTrabajo);

      const state = useStore.getState();
      expect(state.selectedTrabajo).toEqual(mockTrabajo);
      expect(state.lastTrabajoId).toBe(1);
    });

    it('limpia selectedTrabajo al pasar null y conserva lastTrabajoId', () => {
      useStore.setState({ selectedTrabajo: mockTrabajo, lastTrabajoId: 1 });
      useStore.getState().setSelectedTrabajo(null);

      const state = useStore.getState();
      expect(state.selectedTrabajo).toBe(null);
      expect(state.lastTrabajoId).toBe(1); // lastTrabajoId no se limpia
    });
  });

  describe('setEditingCliente', () => {
    it('setea y limpia editingCliente', () => {
      useStore.getState().setEditingCliente({
        id: 3,
        nombreCompleto: 'Cliente Edit',
        telefono: [],
        balance: 0,
        trabajosCount: 0,
        presupuestosCount: 0,
      });
      expect(useStore.getState().editingCliente?.id).toBe(3);

      useStore.getState().setEditingCliente(null);
      expect(useStore.getState().editingCliente).toBe(null);
    });
  });

  describe('setEditingTrabajoId', () => {
    it('setea y limpia editingTrabajoId', () => {
      useStore.getState().setEditingTrabajoId(5);
      expect(useStore.getState().editingTrabajoId).toBe(5);

      useStore.getState().setEditingTrabajoId(null);
      expect(useStore.getState().editingTrabajoId).toBe(null);
    });
  });

  describe('setEditingPresupuestoId', () => {
    it('setea y limpia editingPresupuestoId', () => {
      useStore.getState().setEditingPresupuestoId(10);
      expect(useStore.getState().editingPresupuestoId).toBe(10);

      useStore.getState().setEditingPresupuestoId(null);
      expect(useStore.getState().editingPresupuestoId).toBe(null);
    });
  });

  describe('setCambioContraseñaPendiente', () => {
    it('setea el flag a true y de vuelta a false', () => {
      useStore.getState().setCambioContraseñaPendiente(true);
      expect(useStore.getState().cambioContraseñaPendiente).toBe(true);

      useStore.getState().setCambioContraseñaPendiente(false);
      expect(useStore.getState().cambioContraseñaPendiente).toBe(false);
    });
  });

  describe('setTokens (issue #114: solo accessToken; refresh token en cookie)', () => {
    it('actualiza el accessToken en memoria y en localStorage', () => {
      useStore.getState().setTokens('access-123');

      const state = useStore.getState();
      expect(state.accessToken).toBe('access-123');

      // El middleware persist debe haber escrito el accessToken
      expect(readPersistedAccessToken()).toBe('access-123');
    });

    it('reemplaza el accessToken previo en memoria y localStorage', () => {
      useStore.getState().setTokens('access-old');
      useStore.getState().setTokens('access-new');

      expect(useStore.getState().accessToken).toBe('access-new');
      expect(readPersistedAccessToken()).toBe('access-new');
    });
  });

  describe('logout (issue #105: limpieza explícita)', () => {
    it('limpia el accessToken en memoria y en localStorage', () => {
      useStore.getState().setTokens('access-123');
      useStore.getState().logout();

      expect(useStore.getState().accessToken).toBeNull();
      expect(readPersistedAccessToken()).toBeNull();
    });

    it('resetea cambioContraseñaPendiente a false', () => {
      useStore.getState().setCambioContraseñaPendiente(true);
      useStore.getState().logout();

      expect(useStore.getState().cambioContraseñaPendiente).toBe(false);
    });
  });

  describe('persist partialize (issue #114)', () => {
    it('persiste únicamente accessToken (ni UI state ni data)', () => {
      useStore.getState().setTokens('access-123');
      useStore.getState().setShowPresupuestoForm(true);
      useStore.getState().setEditingPresupuestoId(10);

      const raw = localStorage.getItem('shopmgr-storage');
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!) as { state: Record<string, unknown>; version: unknown };
      expect(Object.keys(parsed.state)).toEqual(['accessToken']);
      expect(parsed.version).toBe(2);
    });
  });

  describe('persist migrate (issue #114: limpiar refreshToken residual)', () => {
    it('migra de v1 a v2: elimina refreshToken y conserva accessToken', async () => {
      // Simula una sesión persistida con el formato viejo (v1) que todavía
      // contiene el refreshToken en localStorage.
      localStorage.setItem('shopmgr-storage', JSON.stringify({
        state: { accessToken: 'access-viejo', refreshToken: 'refresh-viejo' },
        version: 1,
      }));

      await useStore.persist.rehydrate();

      const state = useStore.getState();
      expect(state.accessToken).toBe('access-viejo');
      expect('refreshToken' in state).toBe(false);

      // El storage queda reescrito con version 2 y sin refreshToken
      const persisted = JSON.parse(localStorage.getItem('shopmgr-storage') ?? '{}') as {
        state?: { accessToken?: unknown; refreshToken?: unknown };
        version?: unknown;
      };
      expect(persisted.version).toBe(2);
      expect(persisted.state?.accessToken).toBe('access-viejo');
      expect(persisted.state?.refreshToken).toBeUndefined();
    });
  });
});
