import { readFileSync } from 'node:fs';
import { expect, test as base, type APIRequestContext } from '@playwright/test';
import { ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_STATE } from './auth.fixture';
import { crearTelefonoE2E } from './data.factory';

/**
 * Cliente HTTP autenticado contra la API real (issue #84).
 *
 * El token se obtiene del storageState generado por el setup (project 'setup')
 * y se reutiliza: NO suma llamadas a /Auth/IniciarSesion. El rate limit del
 * backend es 5/min/IP y el setup (1) + el spec de auth (3 logins UI) ya
 * consumen 4 — el login por API extra chocaba con el límite (429).
 *
 * Login por API solo como fallback (envs sin storageState).
 *
 * Único propósito: SETUP/CLEANUP de datos y precargado de estado (costo hora).
 * Las aserciones de negocio SIEMPRE van por la UI (POMs + specs).
 */

export interface ClienteCreado {
  id: number;
  nombreCompleto: string;
}

export interface TrabajoCreado {
  id: number;
  titulo: string;
}

export interface PresupuestoCreado {
  id: number;
  titulo: string;
}

export type EstadoTrabajoE2E = 'Pendiente' | 'Iniciado' | 'Terminado';

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  /**
   * Lee el accessToken persistido en el storageState del setup. El store de la
   * app persiste `{ state: { accessToken } }` en la entry 'shopmgr-storage'
   * del localStorage (Zustand persist).
   */
  private storageToken(): string | null {
    try {
      const raw = readFileSync(AUTH_STATE, 'utf-8');
      const state = JSON.parse(raw) as {
        origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
      };
      const entries = state.origins?.flatMap((o) => o.localStorage ?? []) ?? [];
      const entry = entries.find((l) => l.name === 'shopmgr-storage');
      if (!entry) return null;
      const parsed = JSON.parse(entry.value) as { state?: { accessToken?: unknown } };
      return typeof parsed.state?.accessToken === 'string' ? parsed.state.accessToken : null;
    } catch {
      return null;
    }
  }

  private async token(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    const persisted = this.storageToken();
    if (persisted) {
      this.accessToken = persisted;
      return persisted;
    }
    // Fallback: login por API (correr un archivo suelto sin el setup).
    const response = await this.request.post('/api/Auth/IniciarSesion', {
      data: { userName: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(response.ok(), 'Login por API del fixture debió responder 2xx').toBeTruthy();
    const body = (await response.json()) as { accessToken?: string };
    expect(body.accessToken, 'IniciarSesion debió devolver accessToken').toBeTruthy();
    this.accessToken = body.accessToken as string;
    return this.accessToken;
  }

  private async headers(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.token()}` };
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.request.get(path, { headers: await this.headers() });
    expect(response.ok(), `GET ${path} debió responder 2xx`).toBeTruthy();
    return (await response.json()) as T;
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await this.request.post(path, {
      headers: await this.headers(),
      data: data ?? {},
    });
    expect(response.ok(), `POST ${path} debió responder 2xx`).toBeTruthy();
    return (await response.json()) as T;
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    const response = await this.request.patch(path, {
      headers: await this.headers(),
      data: data ?? {},
    });
    expect(response.ok(), `PATCH ${path} debió responder 2xx`).toBeTruthy();
    return (await response.json()) as T;
  }

  async delete(path: string): Promise<void> {
    const response = await this.request.delete(path, { headers: await this.headers() });
    expect(response.ok(), `DELETE ${path} debió responder 2xx`).toBeTruthy();
  }

  // ---------------------------------------------------------------------------
  // Helpers de negocio (setup/cleanup)
  // ---------------------------------------------------------------------------

  /**
   * Crea un cliente y devuelve su id. OJO: `CrearCliente` NO incluye el id en
   * la respuesta (solo nombreCompleto/cuit/balance/direccion/telefono), así que
   * se busca por nombre contra la lista (ObtenerListaClientes).
   *
   * El teléfono debe ser ÚNICO por creación: el backend valida UNIQUE y
   * rechaza duplicados con 400 "Ya existe un teléfono...".
   */
  async crearCliente(nombreCompleto: string): Promise<ClienteCreado> {
    await this.post('/api/Cliente/CrearCliente', {
      nombreCompleto,
      telefono: [{ telefono: crearTelefonoE2E(), descripcion: 'Principal' }],
    });
    const cliente = await this.buscarClientePorNombre(nombreCompleto);
    if (!cliente) {
      throw new Error(`No se pudo obtener el cliente creado: ${nombreCompleto}`);
    }
    return cliente;
  }

  async eliminarCliente(id: number): Promise<void> {
    await this.delete(`/api/Cliente/EliminarCliente?idCliente=${id}`);
  }

  /**
   * Crea un trabajo y, si `estado` es Iniciado/Terminado, lo transiciona por el
   * endpoint dedicado (la creación siempre nace Pendiente en el backend).
   *
   * OJO: `CrearTrabajo` NO incluye el id en la respuesta, así que se busca por
   * título contra la lista (ObtenerListaTrabajos).
   */
  async crearTrabajo(
    titulo: string,
    idCliente: number,
    estado: EstadoTrabajoE2E = 'Pendiente'
  ): Promise<TrabajoCreado> {
    await this.post('/api/Trabajos/CrearTrabajo', {
      titulo,
      idCliente,
    });
    const trabajo = await this.buscarTrabajoPorTitulo(titulo);
    if (!trabajo) {
      throw new Error(`No se pudo obtener el trabajo creado: ${titulo}`);
    }
    if (estado === 'Iniciado') {
      await this.patch(`/api/Trabajos/IniciarTrabajo?idTrabajo=${trabajo.id}`);
    } else if (estado === 'Terminado') {
      await this.patch(`/api/Trabajos/IniciarTrabajo?idTrabajo=${trabajo.id}`);
      await this.patch(`/api/Trabajos/TerminarTrabajo?idTrabajo=${trabajo.id}`);
    }
    return trabajo;
  }

  /** Registra horas de trabajo vía API (rango válido 0.25-8). */
  async asignarHoras(idTrabajo: number, horas: number, descripcion: string): Promise<void> {
    await this.post('/api/Trabajos/AgregarHorasDeTrabajo', {
      idTrabajo,
      horas,
      descripcion,
      fecha: new Date().toISOString().slice(0, 10),
    });
  }

  async eliminarTrabajo(id: number): Promise<void> {
    await this.delete(`/api/Trabajos/EliminarTrabajo?idTrabajo=${id}`);
  }

  /**
   * Crea un presupuesto. `materiales: []` es obligatorio: el backend (issue
   * #126) no tolera null y devuelve 500 en CalcularCostos.
   */
  async crearPresupuesto(
    titulo: string,
    idCliente: number,
    horasEstimadas = 4
  ): Promise<PresupuestoCreado> {
    return this.post<PresupuestoCreado>('/api/Presupuestos/CrearPresupuesto', {
      titulo,
      idCliente,
      horasEstimadas,
      materiales: [],
    });
  }

  async aceptarPresupuesto(id: number): Promise<void> {
    await this.patch(`/api/Presupuestos/AceptarPresupuesto?idPresupuesto=${id}`);
  }

  async eliminarPresupuesto(id: number): Promise<void> {
    await this.delete(`/api/Presupuestos/EliminarPresupuesto?idPresupuesto=${id}`);
  }

  /** Precarga el costo hora de trabajo (config global). Se restaura en cleanup. */
  async setCostoHora(costo: number): Promise<void> {
    await this.patch(`/api/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto=${costo}`);
  }

  /**
   * Devuelve el costo hora configurado, o null si la config no existe (el
   * backend responde KeyNotFoundException/500 sin "ValorHoraDeTrabajo").
   * Permite al spec capturar el valor previo y restaurarlo en cleanup.
   */
  async tryGetCostoHora(): Promise<number | null> {
    const response = await this.request.get('/api/Presupuestos/ObtenerCostoHoraDeTrabajo', {
      headers: await this.headers(),
    });
    if (!response.ok()) return null;
    return (await response.json()) as number;
  }

  async getCostoHora(): Promise<number> {
    return this.get<number>('/api/Presupuestos/ObtenerCostoHoraDeTrabajo');
  }

  // ---------------------------------------------------------------------------
  // Búsquedas para cleanup (los listados vienen envueltos en {$id, $values})
  // ---------------------------------------------------------------------------

  private unwrapList<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    const e = raw as { $values?: T[] } | null;
    return e?.$values ?? [];
  }

  async listarTrabajos(): Promise<TrabajoCreado[]> {
    const raw = await this.get<unknown>('/api/Trabajos/ObtenerListaTrabajos');
    return this.unwrapList<TrabajoCreado>(raw);
  }

  async buscarTrabajoPorTitulo(titulo: string): Promise<TrabajoCreado | null> {
    const trabajos = await this.listarTrabajos();
    return trabajos.find((t) => t.titulo === titulo) ?? null;
  }

  async listarClientes(): Promise<ClienteCreado[]> {
    const raw = await this.get<unknown>('/api/Cliente/ObtenerListaClientes');
    return this.unwrapList<ClienteCreado>(raw);
  }

  async buscarClientePorNombre(nombre: string): Promise<ClienteCreado | null> {
    const clientes = await this.listarClientes();
    return clientes.find((c) => c.nombreCompleto === nombre) ?? null;
  }
}

/**
 * `test` extendido con el fixture `api` — los specs importan de acá.
 * Scope worker: se instancia UNA vez por worker y el token del setup queda
 * cacheado en la instancia (0 llamadas extra a IniciarSesion).
 */
export const test = base.extend<object, { api: ApiClient }>({
  api: [
    async ({ playwright }, use) => {
      const requestContext = await playwright.request.newContext();
      await use(new ApiClient(requestContext));
      await requestContext.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
