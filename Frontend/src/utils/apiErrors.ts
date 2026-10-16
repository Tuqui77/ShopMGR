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

/** Mapa slot-del-form → claves (alias) que puede usar el backend para ese campo. */
export type CamposConAlias = Record<string, readonly string[]>;

interface CampoBackend {
  /** Clave del backend normalizada a camelCase, conservando el path anidado. */
  clave: string;
  /** Mensajes no vacíos del campo, en orden de aparición. */
  mensajes: string[];
}

/**
 * Extrae del body del error los campos con **todos** sus mensajes (no solo el
 * primero). Nunca lanza: ante una entrada inesperada devuelve `[]`.
 */
function extraerCamposDelBackend(error: unknown): CampoBackend[] {
  try {
    const { data } = extraerRespuesta(error);
    if (!esObjeto(data)) return [];

    const errorsRaw = data['errors'];
    if (!esObjeto(errorsRaw)) return [];

    const campos: CampoBackend[] = [];
    for (const [clave, valor] of Object.entries(errorsRaw)) {
      const mensajes = mensajesDeCampo(valor);
      if (mensajes.length === 0) continue;
      campos.push({ clave: normalizarCampo(clave), mensajes });
    }
    return campos;
  } catch {
    return [];
  }
}

/** Último segmento de una clave anidada (`Direccion[0].Calle` → `Calle`). */
function ultimoSegmentoDeClave(clave: string): string {
  const ultimoPunto = clave.lastIndexOf('.');
  return ultimoPunto === -1 ? clave : clave.slice(ultimoPunto + 1);
}

/**
 * Busca el slot del form cuya lista de alias coincide con la clave del backend.
 * Primero prueba coincidencia exacta case-insensitive; si falla, compara el
 * último segmento de la clave (paths anidados como `Direccion[0].Calle`).
 */
function buscarSlot(clave: string, campos: CamposConAlias): string | null {
  const claveNormalizada = clave.toLowerCase();
  const sufijoNormalizado = ultimoSegmentoDeClave(clave).toLowerCase();

  for (const [slot, alias] of Object.entries(campos)) {
    if (alias.some((a) => a.toLowerCase() === claveNormalizada)) return slot;
  }
  for (const [slot, alias] of Object.entries(campos)) {
    if (alias.some((a) => a.toLowerCase() === sufijoNormalizado)) return slot;
  }
  return null;
}

/**
 * Conveniencia para los formularios: reparte los errores del backend entre los
 * slots del form y el bloque de submit.
 *
 * Garantías:
 * - Cada mensaje se muestra **una sola vez**: no se duplica entre un input y el
 *   bloque de submit, ni entre dos slots.
 * - Ningún mensaje se pierde: los campos sin slot (o con más de un error) van a
 *   `submit`, junto al mensaje general.
 *
 * Con `campos = {}` (form sin slots con alias) se mantiene el comportamiento
 * histórico: `submit = generalMessage ?? allMessages[0]`.
 */
export function splitApiErrors(
  error: unknown,
  campos: CamposConAlias,
): { fieldErrors: Record<string, string>; submit: string | null } {
  const { generalMessage, allMessages } = getApiErrorInfo(error);

  if (Object.keys(campos).length === 0) {
    return { fieldErrors: {}, submit: generalMessage ?? allMessages[0] ?? null };
  }

  const fieldErrors: Record<string, string> = {};
  const consumidos = new Set<string>();
  const restos: string[] = [];

  for (const { clave, mensajes } of extraerCamposDelBackend(error)) {
    const slot = buscarSlot(clave, campos);
    if (slot !== null && !(slot in fieldErrors)) {
      fieldErrors[slot] = mensajes[0];
      consumidos.add(mensajes[0]);
      restos.push(...mensajes.slice(1));
    } else {
      restos.push(...mensajes);
    }
  }

  const partes: string[] = [];
  const agregar = (mensaje: string | null) => {
    if (!mensaje || consumidos.has(mensaje) || partes.includes(mensaje)) return;
    partes.push(mensaje);
  };

  agregar(generalMessage);
  for (const resto of restos) agregar(resto);

  return { fieldErrors, submit: partes.length > 0 ? partes.join('\n') : null };
}
