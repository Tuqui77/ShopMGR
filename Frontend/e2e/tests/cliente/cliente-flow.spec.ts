import { test, expect } from '../../fixtures/api.fixture';
import { crearNombreClienteUnico, crearTelefonoE2E } from '../../fixtures/data.factory';
import { ClientesPage } from '../../pages/ClientesPage';
import { ClienteDetallePage } from '../../pages/ClienteDetallePage';
import { ClienteFormComponent } from '../../components/ClienteFormComponent';
import { Nav } from '../../components/Nav';

/**
 * Flujo cliente (issue #84): crear vía UI (FAB → modal) y eliminar vía UI
 * (detalle → menú → confirmar). El cleanup por API borra lo creado por UI.
 */
test.describe('Flujo cliente', () => {
  test('crear cliente desde el FAB y verlo en el detalle', async ({ page }) => {
    const nombre = crearNombreClienteUnico();
    const telefono = crearTelefonoE2E();
    const nav = new Nav(page);
    const formulario = new ClienteFormComponent(page);
    const clientes = new ClientesPage(page);

    await page.goto('/');
    await nav.crearClienteDesdeFAB();
    await formulario.completar(nombre, telefono);
    await formulario.enviar();

    await nav.navegarDesdeSidebar('Clientes');
    await clientes.buscar(nombre);
    await clientes.verCliente(nombre);
    await clientes.abrirCliente(nombre);
    await new ClienteDetallePage(page).verNombre(nombre);
  });

  test('eliminar cliente desde el detalle', async ({ page, api }) => {
    const nombre = crearNombreClienteUnico();
    const cliente = await api.crearCliente(nombre);
    expect(cliente.id, 'La API debe devolver el id del cliente creado').toBeGreaterThan(0);

    await page.goto('/clientes');
    await new ClientesPage(page).buscar(nombre);
    await new ClientesPage(page).abrirCliente(nombre);
    const detalle = new ClienteDetallePage(page);
    await detalle.verNombre(nombre);
    await detalle.eliminarCliente();

    const clientes = new ClientesPage(page);
    await clientes.buscar(nombre);
    await clientes.verClienteOculto(nombre);
  });
});
