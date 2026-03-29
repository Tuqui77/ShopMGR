import { describe, it, expect } from 'vitest';
import type {
  EstadoTrabajo,
  EstadoPresupuesto,
  TipoMovimiento,
  Cliente,
  Trabajo,
  Presupuesto,
  HorasDeTrabajo,
  Foto,
  Material,
  CrearClienteRequest,
  ModificarClienteRequest,
  CrearTrabajoRequest,
  ModificarTrabajoRequest,
  RegistrarHorasRequest,
  CrearPresupuestoRequest,
  ModificarPresupuestoRequest,
  MovimientoBalance,
  MetricasMes,
} from '../../types';

describe('Type definitions', () => {
  describe('EstadoTrabajo', () => {
    it('accepts Pendiente', () => {
      const estado: EstadoTrabajo = 'Pendiente';
      expect(estado).toBe('Pendiente');
    });

    it('accepts Iniciado', () => {
      const estado: EstadoTrabajo = 'Iniciado';
      expect(estado).toBe('Iniciado');
    });

    it('accepts Terminado', () => {
      const estado: EstadoTrabajo = 'Terminado';
      expect(estado).toBe('Terminado');
    });
  });

  describe('EstadoPresupuesto', () => {
    it('accepts Pendiente', () => {
      const estado: EstadoPresupuesto = 'Pendiente';
      expect(estado).toBe('Pendiente');
    });

    it('accepts Aceptado', () => {
      const estado: EstadoPresupuesto = 'Aceptado';
      expect(estado).toBe('Aceptado');
    });

    it('accepts Rechazado', () => {
      const estado: EstadoPresupuesto = 'Rechazado';
      expect(estado).toBe('Rechazado');
    });
  });

  describe('TipoMovimiento', () => {
    it('accepts all movement types', () => {
      const tipos: TipoMovimiento[] = ['Pago', 'Cargo', 'Anticipo', 'Compra', 'Ajuste'];
      expect(tipos).toHaveLength(5);
    });
  });

  describe('Cliente', () => {
    it('creates a valid Cliente object', () => {
      const cliente: Cliente = {
        id: 1,
        nombreCompleto: 'Juan Pérez',
        telefono: ['11-2345-6789'],
        direccion: 'Calle Falsa 123',
        balance: 5000,
        trabajosCount: 3,
        presupuestosCount: 1,
      };
      expect(cliente.id).toBe(1);
      expect(cliente.nombreCompleto).toBe('Juan Pérez');
    });

    it('allows optional fields', () => {
      const cliente: Cliente = {
        id: 1,
        nombreCompleto: 'Juan Pérez',
        telefono: [],
        balance: 0,
        trabajosCount: 0,
        presupuestosCount: 0,
      };
      expect(cliente.direccion).toBeUndefined();
      expect(cliente.cuit).toBeUndefined();
    });
  });

  describe('Trabajo', () => {
    it('creates a valid Trabajo object', () => {
      const trabajo: Trabajo = {
        id: 1,
        titulo: 'Frenos de disco',
        estado: 'Iniciado',
        horasRegistradas: 4.5,
        fotosCount: 2,
        cliente: null,
        clienteId: 1,
      };
      expect(trabajo.id).toBe(1);
      expect(trabajo.estado).toBe('Iniciado');
    });

    it('allows optional fields', () => {
      const trabajo: Trabajo = {
        id: 1,
        titulo: 'Test',
        estado: 'Pendiente',
        horasRegistradas: 0,
        fotosCount: 0,
        cliente: null,
        clienteId: 1,
        fechaInicio: '2026-03-15',
        fechaFin: '2026-03-20',
        horasEstimadas: 8,
        totalLabor: 24000,
        idPresupuesto: 5,
      };
      expect(trabajo.fechaInicio).toBeDefined();
      expect(trabajo.horasEstimadas).toBe(8);
    });
  });

  describe('Presupuesto', () => {
    it('creates a valid Presupuesto object', () => {
      const presupuesto: Presupuesto = {
        id: 1,
        titulo: 'Reparación completa',
        estado: 'Pendiente',
        fecha: '2026-03-15',
        cliente: {
          id: 1,
          nombreCompleto: 'Juan Pérez',
          telefono: [],
          balance: 0,
          trabajosCount: 0,
          presupuestosCount: 0,
        },
        horasEstimadas: 12,
        costoMateriales: 10000,
        costoLabor: 36000,
        costoInsumos: 2000,
        total: 48000,
        materiales: [],
      };
      expect(presupuesto.total).toBe(48000);
    });
  });

  describe('HorasDeTrabajo', () => {
    it('creates a valid HorasDeTrabajo object', () => {
      const horas: HorasDeTrabajo = {
        id: 1,
        idTrabajo: 1,
        horas: 2.5,
        descripcion: 'Cambio de aceite',
        fecha: '2026-03-15',
      };
      expect(horas.horas).toBe(2.5);
    });
  });

  describe('Material', () => {
    it('creates a valid Material object', () => {
      const material: Material = {
        id: 1,
        descripcion: 'Filtro de aceite',
        cantidad: 2,
        precioUnitario: 1500,
        subtotal: 3000,
      };
      expect(material.subtotal).toBe(3000);
    });
  });

  describe('Request DTOs', () => {
    it('creates valid CrearClienteRequest', () => {
      const request: CrearClienteRequest = {
        nombreCompleto: 'Juan Pérez',
        CUIT: '20-12345678-9',
        telefono: ['11-2345-6789'],
        direccion: 'Calle Falsa 123',
      };
      expect(request.nombreCompleto).toBeDefined();
    });

    it('creates valid ModificarClienteRequest (partial)', () => {
      const request: ModificarClienteRequest = {
        nombreCompleto: 'Juan Pérez Actualizado',
      };
      expect(request.nombreCompleto).toBe('Juan Pérez Actualizado');
    });

    it('creates valid CrearTrabajoRequest', () => {
      const request: CrearTrabajoRequest = {
        titulo: 'Nuevo trabajo',
        idCliente: 1,
      };
      expect(request.titulo).toBe('Nuevo trabajo');
    });

    it('creates valid RegistrarHorasRequest', () => {
      const request: RegistrarHorasRequest = {
        idTrabajo: 1,
        horas: 2,
        descripcion: 'Trabajo realizado',
      };
      expect(request.horas).toBe(2);
    });

    it('creates valid CrearPresupuestoRequest', () => {
      const request: CrearPresupuestoRequest = {
        titulo: 'Presupuesto',
        horasEstimadas: 10,
        idCliente: 1,
        descripcion: 'Descripción',
        materiales: [
          { descripcion: 'Material 1', cantidad: 1, precioUnitario: 1000 },
        ],
      };
      expect(request.materiales).toHaveLength(1);
    });
  });

  describe('MetricasMes', () => {
    it('creates valid MetricasMes object', () => {
      const metricas: MetricasMes = {
        ingresos: 50000,
        horasTrabajadas: 40,
        trabajosTerminados: 10,
        cambiosIngresos: 15,
        cambiosHoras: 5,
        cambiosTerminados: 2,
      };
      expect(metricas.ingresos).toBe(50000);
      expect(metricas.trabajosTerminados).toBe(10);
    });
  });
});
