import { test, expect } from '../../fixtures/api.fixture';
import { crearNombreClienteUnico, crearTituloTrabajoUnico } from '../../fixtures/data.factory';
import { TrabajosPage } from '../../pages/TrabajosPage';
import { TrabajoDetallePage } from '../../pages/TrabajoDetallePage';
import { TrabajoFormComponent } from '../../components/TrabajoFormComponent';
import { HoursModalComponent } from '../../components/HoursModalComponent';
import { Nav } from '../../components/Nav';

/**
 * Flujo trabajo (issue #84). Modo serial: el trabajo creado por UI en el test
 * 1 se consume en el test 2 (iniciar → registrar horas → terminar).
 *
 * Precondición: el costo hora debe estar configurado o "Guardar Horas" queda
 * disabled (HoursModal). Se precarga vía API en beforeAll.
 */
test.describe('Flujo trabajo', () => {
  test.describe.configure({ mode: 'serial' });

  let idCliente: number;
  let nombreCliente: string;
  let tituloTrabajo = '';
  /** Valor previo de la config de costo hora: se restaura en afterAll. */
  let costoHoraOriginal: number | null = null;

  test.beforeAll(async ({ api }) => {
    const cliente = await api.crearCliente(crearNombreClienteUnico());
    idCliente = cliente.id;
    nombreCliente = cliente.nombreCompleto;
    // Captura el valor previo ANTES de mutar la config de la SUT.
    costoHoraOriginal = await api.tryGetCostoHora();
    await api.setCostoHora(5000);
  });

  test.afterAll(async ({ api }) => {
    const trabajo = tituloTrabajo ? await api.buscarTrabajoPorTitulo(tituloTrabajo) : null;
    if (trabajo) await api.eliminarTrabajo(trabajo.id);
    if (idCliente) await api.eliminarCliente(idCliente);
    // Restaura la config previa para no dejar la SUT mutada. Si no existía
    // config original (null), el PATCH del setup deja 5000 — documentado en
    // el reporte (el flujo de horas requiere costo configurado sí o sí).
    if (costoHoraOriginal !== null) {
      await api.setCostoHora(costoHoraOriginal);
    }
  });

  test('crear trabajo desde el FAB y verlo en la lista', async ({ page }) => {
    tituloTrabajo = crearTituloTrabajoUnico();
    const nav = new Nav(page);
    const formulario = new TrabajoFormComponent(page);
    const trabajos = new TrabajosPage(page);

    await page.goto('/');
    await nav.crearTrabajoDesdeFAB();
    await formulario.completar(tituloTrabajo, nombreCliente);
    await formulario.enviar();

    await nav.navegarDesdeSidebar('Trabajos');
    await trabajos.verTrabajo(tituloTrabajo);
  });

  test('iniciar trabajo, registrar horas y terminar', async ({ page }) => {
    const trabajos = new TrabajosPage(page);
    const detalle = new TrabajoDetallePage(page);
    const horasModal = new HoursModalComponent(page);

    await trabajos.goto('/trabajos');
    await trabajos.abrirTrabajo(tituloTrabajo);

    // Pendiente → Iniciado (sin confirm nativo en esta acción)
    await detalle.iniciarTrabajo();

    // Iniciado → "Registrar horas" aparece en el menú (abre HoursModal en
    // modo 'hours' con el trabajo preseleccionado). Scope al menú: el FAB de
    // ProtectedLayout también expone "Registrar Horas" (case-insensitive).
    await detalle.botonOpciones.click();
    await detalle.menuOpciones.getByRole('button', { name: 'Registrar horas' }).click();
    await horasModal.completarYGuardar(2, 'Cambio de aceite realizado');
    await horasModal.verExito(2);
    await detalle.verHorasRegistradas(2);

    // Iniciado → Terminado (usa confirm() nativo del browser)
    await detalle.terminarTrabajo(page);
  });
});
