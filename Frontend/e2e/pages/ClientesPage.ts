import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** POM de la lista de clientes `/clientes` (issue #84). */
export class ClientesPage extends BasePage {
  readonly buscador = this.page.getByPlaceholder('Buscar cliente...');
  readonly vacio = this.page.getByText('No se encontraron clientes');

  /** Filtra la lista por el texto del buscador. */
  async buscar(nombre: string): Promise<void> {
    await this.buscador.fill(nombre);
  }

  /** Navega al detalle de un cliente por su tarjeta (link accesible). */
  async abrirCliente(nombre: string): Promise<void> {
    await this.tarjetaCliente(nombre).click();
  }

  /** El cliente debe estar visible en la lista (existe). */
  async verCliente(nombre: string): Promise<void> {
    await expect(this.tarjetaCliente(nombre)).toBeVisible({ timeout: 15_000 });
  }

  /** El cliente debe haber desaparecido de la lista (eliminado). */
  async verClienteOculto(nombre: string): Promise<void> {
    await expect(this.tarjetaCliente(nombre)).toHaveCount(0, { timeout: 15_000 });
  }

  private tarjetaCliente(nombre: string) {
    return this.page.getByRole('link', { name: new RegExp(nombre) });
  }
}
