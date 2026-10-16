/**
 * Interpretación de los errores que devuelve la API (issue #148).
 *
 * Centraliza el parseo de los formatos de error del backend para que los
 * formularios puedan mostrar el mensaje real en vez de un texto genérico:
 *
 * - `ValidationProblemDetails` de ASP.NET Core (`{ errors: { Campo: [...] } }`)
 * - `{ error: string }` del `ExceptionHandlingMiddleware`
 * - `{ detail: string }` (ProblemDetails)
 * - `{ message: string }` (genérico)
 * - `errors` como string suelto
 * - Fallback diferenciado por status HTTP / error de conexión
 *
 * Todas las funciones son puras y **nunca lanzan**: ante una entrada
 * inesperada devuelven un resultado vacío (o un mensaje genérico accionable).
 */

export interface ApiErrorInfo {
  /** Errores por campo, con la clave normalizada a camelCase. */
  fieldErrors: Record<string, string>;
  /** Mensaje general (no asociado a un campo); `null` si no hay uno explícito. */
  generalMessage: string | null;
  /** Todos los mensajes detectados, aplanados y en orden. */
  allMessages: string[];
}

/** Mensaje para errores sin respuesta HTTP (red caída, servidor inalcanzable). */
export const MENSAJE_ERROR_CONEXION =
  'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';

/** Fallbacks accionables por status cuando el backend no manda un mensaje. */
const MENSAJES_POR_STATUS: Record<number, string> = {
  400: 'Revisá los datos ingresados: hay campos inválidos.',
  401: 'Tu sesión venció. Volvé a iniciar sesión.',
  403: 'No tenés permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'La operación entra en conflicto con los datos actuales.',
  500: 'Ocurrió un error en el servidor. Intentá de nuevo en unos minutos.',
};

interface RespuestaExtraida {
  data: unknown;
  status: number | null;
  hasResponse: boolean;
}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Extrae `response.data` / `response.status` de un error tipo Axios, sin lanzar. */
function extraerRespuesta(error: unknown): RespuestaExtraida {
  if (!esObjeto(error)) {
    return { data: undefined, status: null, hasResponse: false };
  }
  const response = error['response'];
  if (!esObjeto(response)) {
    return { data: undefined, status: null, hasResponse: false };
  }
  const status = response['status'];
  return {
    data: response['data'],
    status: typeof status === 'number' ? status : null,
    hasResponse: true,
  };
}

/** Status HTTP del error, o `null` si no hay respuesta. */
export function getApiErrorStatus(error: unknown): number | null {
  return extraerRespuesta(error).status;
}

function primerMensaje(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const mensaje = valor.trim();
  return mensaje.length > 0 ? mensaje : null;
}

/** Normaliza una clave PascalCase del backend a camelCase (`HorasEstimadas` → `horasEstimadas`). */
function normalizarCampo(clave: string): string {
  if (clave.length === 0) return clave;
  // Claves totalmente en mayúsculas (CUIT, ID) → minúsculas.
  if (clave === clave.toUpperCase()) return clave.toLowerCase();
  return clave.charAt(0).toLowerCase() + clave.slice(1);
}

/** Mensajes no vacíos contenidos en un valor del diccionario `errors`. */
function mensajesDeCampo(valor: unknown): string[] {
  const unico = primerMensaje(valor);
  if (unico) return [unico];
  if (!Array.isArray(valor)) return [];
  const mensajes: string[] = [];
  for (const item of valor) {
    const mensaje = primerMensaje(item);
    if (mensaje) mensajes.push(mensaje);
  }
  return mensajes;
}

/**
 * Parsea **solo** los mensajes presentes en el body del error (sin fallbacks).
 * Es la base de `getApiErrorInfo` y del helper que lanza `Error` en los servicios.
 */
export function parseApiErrorBody(error: unknown): ApiErrorInfo {
  const vacio: ApiErrorInfo = { fieldErrors: {}, generalMessage: null, allMessages: [] };

  try {
    const { data } = extraerRespuesta(error);
    if (!esObjeto(data)) return vacio;

    const fieldErrors: Record<string, string> = {};
    const allMessages: string[] = [];

    const errorsRaw = data['errors'];
    let errorsSueltos: string | null = null;
    if (esObjeto(errorsRaw)) {
      for (const [clave, valor] of Object.entries(errorsRaw)) {
        const mensajes = mensajesDeCampo(valor);
        if (mensajes.length === 0) continue;
        const campo = normalizarCampo(clave);
        if (!(campo in fieldErrors)) {
          fieldErrors[campo] = mensajes[0];
        }
        allMessages.push(...mensajes);
      }
    } else if (typeof errorsRaw === 'string' && errorsRaw.trim().length > 0) {
      errorsSueltos = errorsRaw.trim();
      allMessages.push(errorsSueltos);
    }

    const general =
      primerMensaje(data['error']) ??
      primerMensaje(data['detail']) ??
      primerMensaje(data['message']) ??
      errorsSueltos;
    if (general && !allMessages.includes(general)) allMessages.push(general);

    if (allMessages.length === 0) return vacio;
    return { fieldErrors, generalMessage: general, allMessages };
  } catch {
    return vacio;
  }
}

/**
 * Normaliza cualquier error de la API a mensajes utilizables por la UI.
 * Nunca lanza.
 */
export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  try {
    const body = parseApiErrorBody(error);
    if (body.allMessages.length > 0) return body;

    const { hasResponse, status } = extraerRespuesta(error);
    if (hasResponse && status !== null) {
      const mensaje = MENSAJES_POR_STATUS[status] ?? `Error ${status}`;
      return { fieldErrors: {}, generalMessage: mensaje, allMessages: [mensaje] };
    }

    return {
      fieldErrors: {},
      generalMessage: MENSAJE_ERROR_CONEXION,
      allMessages: [MENSAJE_ERROR_CONEXION],
    };
  } catch {
    return {
      fieldErrors: {},
      generalMessage: MENSAJE_ERROR_CONEXION,
      allMessages: [MENSAJE_ERROR_CONEXION],
    };
  }
}

/**
 * Conveniencia para los formularios: separa los errores por campo (solo los que
 * tienen slot en el form) del mensaje a mostrar en el bloque de submit.
 *
 * Si el backend devuelve errores de campos que el form no puede mostrar, el
 * primero de ellos se usa como mensaje de submit para no perder información.
 */
export function splitApiErrors(
  error: unknown,
  knownFields: readonly string[],
): { fieldErrors: Record<string, string>; submit: string | null } {
  const { fieldErrors: todos, generalMessage, allMessages } = getApiErrorInfo(error);
  const camposConocidos = new Set(knownFields);
  const fieldErrors: Record<string, string> = {};
  let hayCamposSinSlot = false;

  for (const [campo, mensaje] of Object.entries(todos)) {
    if (camposConocidos.has(campo)) {
      fieldErrors[campo] = mensaje;
    } else {
      hayCamposSinSlot = true;
    }
  }

  let submit: string | null = generalMessage;
  if (submit === null && hayCamposSinSlot) {
    submit = allMessages[0] ?? null;
  }

  return { fieldErrors, submit };
}
