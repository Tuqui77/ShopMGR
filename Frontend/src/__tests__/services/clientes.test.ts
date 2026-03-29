import { describe, it, expect } from 'vitest';
import { 
  clientesService, 
  type CrearClienteRequest, 
  type ModificarClienteRequest 
} from '../../services/clientes';
import type { Cliente } from '../../types';

// Test data that mimics the backend response structure
const mockBackendDTO = {
  $id: '1',
  id: 1,
  nombreCompleto: 'Juan Pérez',
  cuit: '20-12345678-9',
  balance: 5000,
  telefono: {
    $id: '2',
    $values: [
      { $id: '3', id: 1, telefono: '11-2345-6789', descripcion: 'Celular' },
      { $id: '4', id: 2, telefono: '11-9876-5432', descripcion: 'Casa' },
    ],
  },
  direccion: {
    $id: '5',
    $values: [
      { $id: '6', id: 1, calle: 'Calle Falsa', altura: '123', piso: '1', departamento: 'A' },
    ],
  },
  trabajos: {
    $id: '7',
    $values: [
      { $id: '8', id: 1, titulo: 'Trabajo 1', estado: 'Pendiente', idCliente: 1 },
      { $id: '9', id: 2, titulo: 'Trabajo 2', estado: 'Terminado', idCliente: 1 },
    ],
  },
  presupuestos: {
    $id: '10',
    $values: [
      { $id: '11', id: 1, titulo: 'Presupuesto 1', estado: 'Aceptado', idCliente: 1 },
    ],
  },
  movimientosBalance: {
    $id: '12',
    $values: [],
  },
};

const mockBackendDTOMinimal = {
  $id: '1',
  id: 2,
  nombreCompleto: 'María García',
  balance: 0,
  telefono: { $id: '2', $values: [] },
  direccion: { $id: '3', $values: [] },
  trabajos: { $id: '4', $values: [] },
  presupuestos: { $id: '5', $values: [] },
  movimientosBalance: { $id: '6', $values: [] },
};

describe('clientesService', () => {
  describe('service structure', () => {
    it('has listar method', () => {
      expect(typeof clientesService.listar).toBe('function');
    });

    it('has obtenerPorId method', () => {
      expect(typeof clientesService.obtenerPorId).toBe('function');
    });

    it('has obtenerDetalle method', () => {
      expect(typeof clientesService.obtenerDetalle).toBe('function');
    });

    it('has crear method', () => {
      expect(typeof clientesService.crear).toBe('function');
    });

    it('has modificar method', () => {
      expect(typeof clientesService.modificar).toBe('function');
    });

    it('has eliminar method', () => {
      expect(typeof clientesService.eliminar).toBe('function');
    });

    it('has buscarSaldosNegativos method', () => {
      expect(typeof clientesService.buscarSaldosNegativos).toBe('function');
    });
  });

  describe('type definitions', () => {
    it('CrearClienteRequest has required fields', () => {
      const request: CrearClienteRequest = {
        nombreCompleto: 'Test Cliente',
      };
      expect(request.nombreCompleto).toBe('Test Cliente');
    });

    it('CrearClienteRequest has optional fields', () => {
      const request: CrearClienteRequest = {
        nombreCompleto: 'Test Cliente',
        CUIT: '20-12345678-9',
        telefono: ['11-2345-6789'],
        direccion: 'Calle Falsa 123',
      };
      expect(request.CUIT).toBe('20-12345678-9');
      expect(request.telefono).toHaveLength(1);
      expect(request.direccion).toBe('Calle Falsa 123');
    });

    it('ModificarClienteRequest allows partial updates', () => {
      const request: ModificarClienteRequest = {
        nombreCompleto: 'Nuevo Nombre',
      };
      expect(request.nombreCompleto).toBe('Nuevo Nombre');
    });
  });
});
