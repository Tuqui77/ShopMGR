import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useStore } from '../../store';
import { ClienteForm } from '../../components/ClienteForm';

// Issue #117: el bloque de teléfonos en creación se simplificó a un único
// campo opcional "Teléfono" con descripción opcional (sin botón "+", sin lista).
const { crearMutateAsync, modificarMutateAsync } = vi.hoisted(() => ({
  crearMutateAsync: vi.fn(),
  modificarMutateAsync: vi.fn(),
}));

vi.mock('../../hooks/useClientes', () => ({
  useCrearCliente: () => ({ mutateAsync: crearMutateAsync, isPending: false }),
  useModificarCliente: () => ({ mutateAsync: modificarMutateAsync, isPending: false }),
}));

describe('ClienteForm - teléfono único con descripción en creación (issue #117)', () => {
  beforeEach(() => {
    useStore.setState({ showClienteForm: true, editingCliente: null });
    crearMutateAsync.mockReset();
    modificarMutateAsync.mockReset();
    // No resolver nunca el mutateAsync evita que el submit dispare el
    // setTimeout(handleClose) que mutaría el store compartido a mitad de test.
    crearMutateAsync.mockReturnValue(new Promise(() => {}));
    modificarMutateAsync.mockReturnValue(new Promise(() => {}));
  });

  const completarNombre = () => {
    fireEvent.change(screen.getByPlaceholderText('Juan Pérez'), {
      target: { value: 'Juan Pérez' },
    });
  };

  const escribirTelefono = (telefono: string) => {
    fireEvent.change(screen.getByPlaceholderText('Número de teléfono'), {
      target: { value: telefono },
    });
  };

  const escribirDescripcion = (descripcion: string) => {
    fireEvent.change(screen.getByPlaceholderText('Descripción (ej: Celular, Trabajo)'), {
      target: { value: descripcion },
    });
  };

  const clickCrearCliente = () => {
    fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
  };

  const obtenerPayload = async () => {
    await waitFor(() => expect(crearMutateAsync).toHaveBeenCalledTimes(1));
    return crearMutateAsync.mock.calls[0][0] as {
      nombreCompleto: string;
      telefono: { telefono: string; descripcion: string }[];
    };
  };

  it('persiste el teléfono con descripción default "Principal" si la descripción queda vacía', async () => {
    render(<ClienteForm />);
    completarNombre();
    escribirTelefono('11 1234-5678');

    clickCrearCliente();

    const payload = await obtenerPayload();
    expect(payload.telefono).toEqual([
      { telefono: '11 1234-5678', descripcion: 'Principal' },
    ]);
  });

  it('persiste la descripción escrita junto al teléfono', async () => {
    render(<ClienteForm />);
    completarNombre();
    escribirTelefono('11 1234-5678');
    escribirDescripcion('Celular');

    clickCrearCliente();

    const payload = await obtenerPayload();
    expect(payload.telefono).toEqual([
      { telefono: '11 1234-5678', descripcion: 'Celular' },
    ]);
  });

  it('envía telefono: [] si el teléfono está vacío, ignorando la descripción escrita', async () => {
    render(<ClienteForm />);
    completarNombre();
    escribirDescripcion('Celular');

    clickCrearCliente();

    const payload = await obtenerPayload();
    expect(payload.telefono).toEqual([]);
  });

  it('valida la longitud mínima de 10 dígitos: no ejecuta el submit y muestra el error', async () => {
    render(<ClienteForm />);
    completarNombre();
    escribirTelefono('123');

    clickCrearCliente();

    expect(
      await screen.findByText('El teléfono debe tener al menos 10 dígitos')
    ).toBeInTheDocument();
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('no existen botón "Agregar teléfono" ni lista; el placeholder de descripción sí está presente (regresión #117)', () => {
    render(<ClienteForm />);

    expect(screen.queryByRole('button', { name: 'Agregar teléfono' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar teléfono' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Editar teléfono' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar teléfono' })).toBeNull();
    // Sin duplicados: un único input de teléfono y una única descripción.
    expect(screen.queryAllByPlaceholderText('Número de teléfono')).toHaveLength(1);
    expect(screen.queryAllByPlaceholderText('Descripción (ej: Celular, Trabajo)')).toHaveLength(1);
    expect(screen.getByText('Teléfono (opcional)')).toBeInTheDocument();
  });
});
