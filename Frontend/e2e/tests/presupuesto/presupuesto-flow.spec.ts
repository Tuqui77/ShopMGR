import { test, expect } from '../../fixtures/api.fixture';
import { crearNombreClienteUnico, crearTituloPresupuestoUnico } from '../../fixtures/data.factory';
import { PresupuestosPage } from '../../pages/PresupuestosPage';
import { PresupuestoDetallePage } from '../../pages/PresupuestoDetallePage';
import { TrabajosPage } from '../../pages/TrabajosPage';
import { PresupuestoFormComponent } from '../../components/PresupuestoFormComponent';
import { Nav } from '../../components/Nav';

/**
 * Flujo presupuesto (issue #84). Modo serial: el presupuesto creado en el
 * test 1 se acepta en el test 2 (crea un trabajo automático con el mismo
 * título — AdministracionTrabajos.CrearDesdePresupuestoAsync).
 */
test.describe('Flujo presupuesto', () => {
  test.describe.configure({ mode: 'serial' });

  let idCliente: number;
  let nombreCliente: string;
  let tituloPresupuesto = '';

  test.beforeAll(async ({ api }) => {
    const cliente = await api.crearCliente(crearNombreClienteUnico());
    idCliente = cliente.id;
    nombreCliente = cliente.nombreCompleto;
  });

  test.afterAll(async ({ api }) => {
    // El trabajo creado por la aceptación debe borrarse antes que el cliente
    // (FK trabajo→cliente)
    const trabajo = tituloPresupuesto ? await api.buscarTrabajoPorTitulo(tituloPresupuesto) : null;
    if (trabajo) await api.eliminarTrabajo(trabajo.id);
    if (idCliente) await api.eliminarCliente(idCliente);
  });

  test('crear presupuesto desde el FAB y verlo en la lista', async ({ page }) => {
    tituloPresupuesto = crearTituloPresupuestoUnico();
    const nav = new Nav(page);
    const formulario = new PresupuestoFormComponent(page);
    const presupuestos = new PresupuestosPage(page);

    await page.goto('/');
    await nav.crearPresupuestoDesdeFAB();
    await formulario.seleccionarCliente(nombreCliente);
    await formulario.completarDatos(tituloPresupuesto, 4);
    await formulario.enviar();

    await nav.navegarDesdeSidebar('Presupuestos');
    await presupuestos.verPresupuesto(tituloPresupuesto);
    await presupuestos.verBadgeEstado(tituloPresupuesto, 'Pendiente');
  });

  test('aceptar presupuesto crea un trabajo en la lista', async ({ page }) => {
    const presupuestos = new PresupuestosPage(page);
    const detalle = new PresupuestoDetallePage(page);
    const trabajos = new TrabajosPage(page);

    await presupuestos.goto('/presupuestos');
    await presupuestos.abrirPresupuesto(tituloPresupuesto);
    await detalle.aceptarPresupuesto(); // assert badge Aceptado + modal cierra

    // El trabajo generado automáticamente comparte el título del presupuesto
    await trabajos.goto('/trabajos');
    await trabajos.verTrabajo(tituloPresupuesto);
  });
});
