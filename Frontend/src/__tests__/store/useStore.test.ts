import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store';
import type { Trabajo } from '../../types';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      showHoursModal: false,
      selectedTrabajo: null,
      lastTrabajoId: null,
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
