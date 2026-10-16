import { describe, it, expect } from 'vitest';
import {
  MENSAJE_ERROR_CONEXION,
  getApiErrorInfo,
  getApiErrorStatus,
  splitApiErrors,
} from '../../utils/apiErrors';

/** Error con la forma que expone Axios en `catch`. */
function axiosError(status: number, data: unknown): unknown {
  return { isAxiosError: true, response: { status, data } };
}

describe('getApiErrorInfo - ValidationProblemDetails', () => {
  it('extrae un solo campo y normaliza la clave PascalCase → camelCase', () => {
    const error = axiosError(400, {
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: {
        HorasEstimadas: ['El campo horas estimadas tiene que estar entre 1 y 1000'],
      },
    });

    const info = getApiErrorInfo(error);

    expect(info.fieldErrors).toEqual({
      horasEstimadas: 'El campo horas estimadas tiene que estar entre 1 y 1000',
    });
    expect(info.generalMessage).toBeNull();
    expect(info.allMessages).toEqual([
      'El campo horas estimadas tiene que estar entre 1 y 1000',
    ]);
  });

  it('extrae varios campos y conserva el orden de los mensajes', () => {
    const error = axiosError(400, {
      errors: {
        Titulo: ['El título es obligatorio'],
        HorasEstimadas: ['Fuera de rango'],
      },
    });

    const info = getApiErrorInfo(error);

    expect(info.fieldErrors).toEqual({
      titulo: 'El título es obligatorio',
      horasEstimadas: 'Fuera de rango',
    });
    expect(info.generalMessage).toBeNull();
    expect(info.allMessages).toEqual(['El título es obligatorio', 'Fuera de rango']);
  });

  it('toma el primer mensaje no vacío por campo y conserva todos en allMessages', () => {
    const error = axiosError(400, {
      errors: {
        Titulo: ['', 'El título es obligatorio', 'Muy corto'],
      },
    });

    const info = getApiErrorInfo(error);

    expect(info.fieldErrors.titulo).toBe('El título es obligatorio');
    expect(info.allMessages).toEqual(['El título es obligatorio', 'Muy corto']);
  });

  it('normaliza claves con acrónimos (CUIT/ID)', () => {
    const error = axiosError(400, {
      errors: { CUIT: ['inválido'], ID: ['requerido'], IdCliente: ['requerido'] },
    });

    const info = getApiErrorInfo(error);

    expect(info.fieldErrors).toEqual({
      cuit: 'inválido',
      id: 'requerido',
      idCliente: 'requerido',
    });
  });

  it('ignora valores no-string dentro de `errors`', () => {
    const error = axiosError(400, {
      errors: { campo1: 123, campo2: null, campo3: ['válido'] },
    });

    const info = getApiErrorInfo(error);

    expect(info.fieldErrors).toEqual({ campo3: 'válido' });
    expect(info.allMessages).toEqual(['válido']);
  });

  it('soporta `errors` como string suelto', () => {
    const info = getApiErrorInfo(axiosError(400, { errors: 'Algo salió mal' }));

    expect(info.fieldErrors).toEqual({});
    expect(info.generalMessage).toBe('Algo salió mal');
    expect(info.allMessages).toEqual(['Algo salió mal']);
  });
});

describe('getApiErrorInfo - formatos generales', () => {
  it('extrae `{ error }` (ExceptionHandlingMiddleware)', () => {
    const info = getApiErrorInfo(axiosError(500, { error: 'Explotó el motor' }));

    expect(info).toEqual({
      fieldErrors: {},
      generalMessage: 'Explotó el motor',
      allMessages: ['Explotó el motor'],
    });
  });

  it('extrae `{ detail }` (ProblemDetails)', () => {
    const info = getApiErrorInfo(
      axiosError(400, { title: 'Bad Request', detail: 'Detalle del problema' }),
    );

    expect(info.generalMessage).toBe('Detalle del problema');
    expect(info.allMessages).toEqual(['Detalle del problema']);
  });

  it('extrae `{ message }`', () => {
    const info = getApiErrorInfo(axiosError(400, { message: 'Mensaje genérico' }));

    expect(info.generalMessage).toBe('Mensaje genérico');
  });

  it('prioriza los errores por campo sobre el mensaje general', () => {
    const info = getApiErrorInfo(
      axiosError(400, { error: 'General', errors: { titulo: ['Por campo'] } }),
    );

    expect(info.fieldErrors).toEqual({ titulo: 'Por campo' });
    expect(info.allMessages).toEqual(['Por campo', 'General']);
  });
});

describe('getApiErrorInfo - fallbacks', () => {
  it('mensaje de conexión cuando no hay `response`', () => {
    const info = getApiErrorInfo(new Error('Network Error'));

    expect(info.fieldErrors).toEqual({});
    expect(info.generalMessage).toBe(MENSAJE_ERROR_CONEXION);
    expect(info.allMessages).toEqual([MENSAJE_ERROR_CONEXION]);
  });

  it('mensaje de conexión cuando el error no es un objeto', () => {
    for (const valor of ['boom', 42, null, undefined, true]) {
      expect(getApiErrorInfo(valor).generalMessage).toBe(MENSAJE_ERROR_CONEXION);
    }
  });

  it('ignora un `data` que no es objeto', () => {
    const info = getApiErrorInfo(axiosError(400, 'texto plano'));

    expect(info.generalMessage).toBe('Revisá los datos ingresados: hay campos inválidos.');
  });

  it.each([
    [400, 'Revisá los datos ingresados: hay campos inválidos.'],
    [401, 'Tu sesión venció. Volvé a iniciar sesión.'],
    [403, 'No tenés permisos para realizar esta acción.'],
    [404, 'No se encontró el recurso solicitado.'],
    [409, 'La operación entra en conflicto con los datos actuales.'],
    [500, 'Ocurrió un error en el servidor. Intentá de nuevo en unos minutos.'],
  ])('fallback diferenciado para status %i', (status, mensaje) => {
    const info = getApiErrorInfo({ isAxiosError: true, response: { status } });

    expect(info.generalMessage).toBe(mensaje);
    expect(info.allMessages).toEqual([mensaje]);
  });

  it('fallback genérico con el status cuando no está mapeado', () => {
    const info = getApiErrorInfo(axiosError(418, {}));

    expect(info.generalMessage).toBe('Error 418');
  });

  it('nunca lanza ante entradas inesperadas', () => {
    const entradas: unknown[] = [
      { response: null },
      { response: {} },
      { response: { status: 'no-numérico', data: {} } },
      { response: { status: 400, data: { errors: [] } } },
      { response: { status: 400, data: { errors: [1, 2] } } },
      { response: { status: 400, data: { errors: { a: {} } } } },
    ];

    for (const valor of entradas) {
      expect(() => getApiErrorInfo(valor)).not.toThrow();
    }
  });
});

describe('getApiErrorStatus', () => {
  it('devuelve el status cuando existe', () => {
    expect(getApiErrorStatus(axiosError(404, {}))).toBe(404);
  });

  it('devuelve null cuando no hay respuesta', () => {
    expect(getApiErrorStatus(new Error('x'))).toBeNull();
    expect(getApiErrorStatus({})).toBeNull();
  });
});

describe('splitApiErrors', () => {
  it('separa campos conocidos y deja submit null cuando todos tienen slot', () => {
    const error = axiosError(400, {
      errors: { HorasEstimadas: ['El campo horas estimadas tiene que estar entre 1 y 1000'] },
    });

    const { fieldErrors, submit } = splitApiErrors(error, ['titulo', 'horasEstimadas']);

    expect(fieldErrors).toEqual({
      horasEstimadas: 'El campo horas estimadas tiene que estar entre 1 y 1000',
    });
    expect(submit).toBeNull();
  });

  it('manda al submit el mensaje de un campo sin slot', () => {
    const error = axiosError(400, { errors: { CampoDesconocido: ['Mensaje del backend'] } });

    const { fieldErrors, submit } = splitApiErrors(error, ['titulo']);

    expect(fieldErrors).toEqual({});
    expect(submit).toBe('Mensaje del backend');
  });

  it('prefiere el mensaje general cuando existe', () => {
    const { fieldErrors, submit } = splitApiErrors(axiosError(409, { error: 'Conflicto' }), []);

    expect(fieldErrors).toEqual({});
    expect(submit).toBe('Conflicto');
  });

  it('no setea submit cuando todos los campos tienen slot', () => {
    const { fieldErrors, submit } = splitApiErrors(
      axiosError(400, { errors: { HorasEstimadas: ['fuera de rango'] } }),
      ['horasEstimadas'],
    );

    expect(fieldErrors).toEqual({ horasEstimadas: 'fuera de rango' });
    expect(submit).toBeNull();
  });

  it('nunca lanza con entradas inesperadas', () => {
    expect(() => splitApiErrors(undefined, ['titulo'])).not.toThrow();
    expect(splitApiErrors({}, [])).toEqual({
      fieldErrors: {},
      submit: MENSAJE_ERROR_CONEXION,
    });
  });
});

describe('getApiErrorStatus - errores malformados', () => {
  it('devuelve null si la respuesta no tiene status numérico', () => {
    expect(getApiErrorStatus({ response: { status: '500' } })).toBeNull();
    expect(getApiErrorStatus({ response: null })).toBeNull();
    expect(getApiErrorStatus(null)).toBeNull();
  });
});
