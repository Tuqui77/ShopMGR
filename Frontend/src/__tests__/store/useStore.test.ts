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

describe('useStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state before each test
    useStore.setState({
      showHoursModal: false,
      selectedTrabajo: null,
      lastTrabajoId: null,
      isDetailModalOpen: false,
      accessToken: null,
    });
  });

  describe('initial state', () => {
    it('has initial data populated from mocks', () => {
      const state = useStore.getState();
      expect(state.clientes).toBeDefined();
      expect(state.trabajos).toBeDefined();
      expect(state.horas).toBeDefined();
      expect(state.presupuestos).toBeDefined();
      expect(state.valorHora).toBeDefined();
    });

    it('has initial UI state set to defaults', () => {
      const state = useStore.getState();
      expect(state.showHoursModal).toBe(false);
      expect(state.selectedTrabajo).toBe(null);
      expect(state.lastTrabajoId).toBe(null);
    });
  });

  describe('setShowHoursModal', () => {
    it('sets showHoursModal to true', () => {
      const { setShowHoursModal } = useStore.getState();
      setShowHoursModal(true);
      expect(useStore.getState().showHoursModal).toBe(true);
    });

    it('sets showHoursModal to false', () => {
      // First set to true
      useStore.setState({ showHoursModal: true });
      const { setShowHoursModal } = useStore.getState();
      setShowHoursModal(false);
      expect(useStore.getState().showHoursModal).toBe(false);
    });
  });

  describe('setSelectedTrabajo', () => {
    it('sets selectedTrabajo and lastTrabajoId', () => {
      const mockTrabajo: Trabajo = {
        id: 1,
        titulo: 'Test Trabajo',
        estado: 'Pendiente',
        horasRegistradas: 0,
        fotosCount: 0,
        cliente: null,
        clienteId: 1,
      };

      const { setSelectedTrabajo } = useStore.getState();
      setSelectedTrabajo(mockTrabajo);

      const state = useStore.getState();
      expect(state.selectedTrabajo).toEqual(mockTrabajo);
      expect(state.lastTrabajoId).toBe(1);
    });

    it('clears selectedTrabajo when null passed', () => {
      // First set a trabajo
      useStore.setState({
        selectedTrabajo: {
          id: 1,
          titulo: 'Test',
          estado: 'Pendiente',
          horasRegistradas: 0,
          fotosCount: 0,
          cliente: null,
          clienteId: 1,
        },
        lastTrabajoId: 1,
      });

      const { setSelectedTrabajo } = useStore.getState();
      setSelectedTrabajo(null);

      const state = useStore.getState();
      expect(state.selectedTrabajo).toBe(null);
      expect(state.lastTrabajoId).toBe(1); // lastTrabajoId is not cleared
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

  describe('setIsDetailModalOpen (issue #98: ocultar FAB en modales de detalle)', () => {
    it('inicia en false', () => {
      expect(useStore.getState().isDetailModalOpen).toBe(false);
    });

    it('setea el flag a true y de vuelta a false', () => {
      useStore.getState().setIsDetailModalOpen(true);
      expect(useStore.getState().isDetailModalOpen).toBe(true);

      useStore.getState().setIsDetailModalOpen(false);
      expect(useStore.getState().isDetailModalOpen).toBe(false);
    });
  });

  describe('updateTrabajoEstado', () => {
    it('updates trabajo estado correctly', () => {
      const { updateTrabajoEstado, trabajos } = useStore.getState();
      const trabajoId = trabajos[0]?.id;

      if (trabajoId) {
        updateTrabajoEstado(trabajoId, 'Terminado');
        const updatedTrabajo = useStore.getState().trabajos.find(t => t.id === trabajoId);
        expect(updatedTrabajo?.estado).toBe('Terminado');
      }
    });

    it('does not modify other trabajos', () => {
      const { updateTrabajoEstado, trabajos } = useStore.getState();
      const [first, second] = trabajos;

      if (first && second) {
        const firstId = first.id;
        const originalSecondEstado = second.estado;

        updateTrabajoEstado(firstId, 'Terminado');
        const updatedSecond = useStore.getState().trabajos.find(t => t.id === second.id);
        expect(updatedSecond?.estado).toBe(originalSecondEstado);
      }
    });
  });

  describe('addHoras', () => {
    it('adds new horas entry with correct values', () => {
      const { addHoras, horas, valorHora, trabajos } = useStore.getState();
      
      // Find a trabajo to add hours to
      const trabajo = trabajos[0];
      if (!trabajo) return;

      const initialHorasCount = horas.length;
      const initialTrabajoHoras = trabajo.horasRegistradas;

      addHoras(trabajo.id, 5, 'Test hours');

      const state = useStore.getState();
      
      // Check horas count increased
      expect(state.horas.length).toBe(initialHorasCount + 1);
      
      // Check the new horas entry
      const newHoras = state.horas[state.horas.length - 1];
      expect(newHoras.idTrabajo).toBe(trabajo.id);
      expect(newHoras.horas).toBe(5);
      expect(newHoras.descripcion).toBe('Test hours');
      expect(newHoras.valor).toBe(5 * valorHora);
      
      // Check trabajo hours updated
      const updatedTrabajo = state.trabajos.find(t => t.id === trabajo.id);
      expect(updatedTrabajo?.horasRegistradas).toBe(initialTrabajoHoras + 5);
      expect(updatedTrabajo?.estado).toBe('Iniciado');
    });

    it('closes modal after adding horas', () => {
      const { addHoras, trabajos } = useStore.getState();
      
      const trabajo = trabajos[0];
      if (!trabajo) return;

      // Set modal to open
      useStore.setState({ showHoursModal: true });

      addHoras(trabajo.id, 2, 'Test');

      expect(useStore.getState().showHoursModal).toBe(false);
    });

    it('clears selectedTrabajo after adding horas', () => {
      const { addHoras, trabajos } = useStore.getState();
      
      const trabajo = trabajos[0];
      if (!trabajo) return;

      // Set selected trabajo
      useStore.setState({ selectedTrabajo: trabajo });

      addHoras(trabajo.id, 2, 'Test');

      expect(useStore.getState().selectedTrabajo).toBe(null);
    });
  });
});
