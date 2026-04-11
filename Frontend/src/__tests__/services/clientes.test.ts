import { describe, it, expect } from 'vitest';
import { 
  clientesService, 
  type CrearClienteRequest, 
  type ModificarClienteRequest 
} from '../../services/clientes';

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
        telefono: [],
      };
      expect(request.nombreCompleto).toBe('Test Cliente');
    });

    it('CrearClienteRequest has optional fields', () => {
      const request: CrearClienteRequest = {
        nombreCompleto: 'Test Cliente',
        Cuit: '20123456789',
        telefono: [{ telefono: '11-2345-6789', descripcion: 'Celular' }],
        direccion: [{ calle: 'Calle Falsa', altura: '123' }],
      };
      expect(request.Cuit).toBe('20123456789');
      expect(request.telefono).toHaveLength(1);
      expect(request.direccion).toHaveLength(1);
    });

    it('ModificarClienteRequest allows partial updates', () => {
      const request: ModificarClienteRequest = {
        nombreCompleto: 'Nuevo Nombre',
      };
      expect(request.nombreCompleto).toBe('Nuevo Nombre');
    });
  });
});
