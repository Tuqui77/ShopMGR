import type { Cliente, Trabajo, Presupuesto, MetricasMes, HorasRegistradas } from '../types';

export const metricasMock: MetricasMes = {
  ingresos: 45200,
  horasTrabajadas: 32.5,
  trabajosTerminados: 8,
  cambiosIngresos: 12,
  cambiosHoras: 8,
  cambiosTerminados: -3,
};

export const clientesMock: Cliente[] = [
  {
    id: 1,
    nombreCompleto: 'Juan Pérez',
    telefono: ['11-2345-6789', '11-9876-5432'],
    direccion: 'Calle Falsa 123, Buenos Aires',
    balance: -2500,
    trabajosCount: 3,
    presupuestosCount: 1,
  },
  {
    id: 2,
    nombreCompleto: 'María García',
    telefono: ['11-3456-7890'],
    direccion: 'Av. Siempre Viva 742',
    balance: 5000,
    trabajosCount: 5,
    presupuestosCount: 2,
  },
  {
    id: 3,
    nombreCompleto: 'Carlos Martínez',
    telefono: ['11-4567-8901'],
    balance: -8500,
    trabajosCount: 8,
    presupuestosCount: 0,
  },
  {
    id: 4,
    nombreCompleto: 'Ana Torres',
    telefono: ['11-5678-9012'],
    direccion: 'Av. Rivadavia 5000',
    balance: 0,
    trabajosCount: 1,
    presupuestosCount: 1,
  },
];

export const trabajosMock: Trabajo[] = [
  {
    id: 1,
    titulo: 'Frenos de disco',
    estado: 'iniciado',
    fechaInicio: '2026-03-15',
    horasEstimadas: 8,
    horasRegistradas: 4.5,
    fotosCount: 3,
    total: 13500,
    cliente: clientesMock[0],
  },
  {
    id: 2,
    titulo: 'Cambio de aceite',
    estado: 'pendiente',
    horasEstimadas: 1.5,
    horasRegistradas: 0,
    fotosCount: 0,
    total: 4500,
    cliente: clientesMock[1],
  },
  {
    id: 3,
    titulo: 'Suspensión completa',
    estado: 'iniciado',
    fechaInicio: '2026-03-10',
    horasEstimadas: 12,
    horasRegistradas: 9,
    fotosCount: 8,
    total: 36000,
    cliente: clientesMock[2],
  },
  {
    id: 4,
    titulo: 'Diagnóstico eléctrico',
    estado: 'terminado',
    fechaInicio: '2026-02-28',
    fechaFin: '2026-03-01',
    horasEstimadas: 3,
    horasRegistradas: 2.5,
    fotosCount: 5,
    total: 7500,
    cliente: clientesMock[3],
  },
];

export const presupuestosMock: Presupuesto[] = [
  {
    id: 1,
    titulo: 'Suspensión completa',
    descripcion: 'Reemplazo completo del sistema de suspensión incluyendo amortiguadores, bujes y componentes de seguridad.',
    estado: 'pendiente',
    fecha: '2026-03-18',
    cliente: clientesMock[2],
    horasEstimadas: 12,
    costoMateriales: 31000,
    costoLabor: 36000,
    costoInsumos: 3000,
    total: 70000,
    materiales: [
      { id: 1, descripcion: 'Amortiguadores delanteros x2', cantidad: 2, precioUnitario: 12000, subtotal: 24000 },
      { id: 2, descripcion: 'Bujes y rulemanes', cantidad: 1, precioUnitario: 5000, subtotal: 5000 },
      { id: 3, descripcion: 'Aceite y fluidos', cantidad: 1, precioUnitario: 2000, subtotal: 2000 },
    ],
  },
  {
    id: 2,
    titulo: 'Diagnosis eléctrico',
    estado: 'aceptado',
    fecha: '2026-03-17',
    cliente: clientesMock[3],
    horasEstimadas: 3,
    costoMateriales: 0,
    costoLabor: 9000,
    costoInsumos: 500,
    total: 9500,
    materiales: [],
  },
];

export const horasMock: HorasRegistradas[] = [
  {
    id: 1,
    idTrabajo: 1,
    horas: 1.5,
    descripcion: 'Cambio de pastillas adelante',
    fecha: '2026-03-19',
    valor: 4500,
  },
  {
    id: 2,
    idTrabajo: 1,
    horas: 2,
    descripcion: 'Inspección y diagnóstico inicial',
    fecha: '2026-03-17',
    valor: 6000,
  },
  {
    id: 3,
    idTrabajo: 1,
    horas: 1,
    descripcion: 'Toma de contacto',
    fecha: '2026-03-15',
    valor: 3000,
  },
];

export const valorHoraMock = 3000;
