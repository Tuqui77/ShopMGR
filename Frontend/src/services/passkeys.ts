import { apiClient } from './api';
import type { LoginResponse, PasskeyCredencial } from '../types';

// ============================================================================
// Passkeys (WebAuthn / FIDO2) — contrato con el backend .NET
// ============================================================================
//
// Endpoints reales (base /api, rutas de AuthController):
//   POST /Auth/passkeys/auth/opciones         -> AssertionOptions (login)
//   POST /Auth/passkeys/auth                  -> verifica assertion, devuelve LoginResponse
//   POST /Auth/passkeys/registrar/opciones    -> CredentialCreateOptions (requiere Bearer)
//   POST /Auth/passkeys/registrar             -> verifica attestation (requiere Bearer)
//
// Formato de binarios (verificado con Fido2NetLib 4.0.1):
//   - En las OPCIONES que envía el backend, los byte[] (challenge, user.id,
//     excludeCredentials[].id, allowCredentials[].id) llegan como base64url
//     SIN padding (Fido2NetLib usa su Base64UrlConverter para serializar).
//   - En los REQUESTS que envía el frontend, los byte[] de los DTOs
//     (firma, datosAutenticador, userHandle, datosClienteJson, attestation)
//     se envían como base64 ESTÁNDAR con padding (conversor por defecto de
//     System.Text.Json al deserializar byte[]).
//   - El campo rawId (y id) se envía como base64url SIN padding: el backend
//     lo decodifica explícitamente con DecodificarBase64Url.

// ============================================================================
// Helpers de encoding: ArrayBuffer <-> base64 <-> base64url
// ============================================================================

/** Convierte un string base64url (sin padding) a un ArrayBuffer. */
export function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytesToArrayBuffer(bytes);
}

/** Convierte un ArrayBuffer a base64url sin padding (lo que espera el backend para rawId/id). */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Convierte un ArrayBuffer a base64 estándar con padding (byte[] de los DTOs .NET). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer));
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function bytesToBase64(bytes: Uint8Array): string {
  // btoa recibe una binary string; se procesa por chunks para evitar
  // desbordar la pila con payloads grandes (attestation).
  let binary = '';
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

// ============================================================================
// Type guards para respuestas del backend (datos externos: unknown + guards)
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const AUTHENTICATOR_ATTACHMENTS: readonly AuthenticatorAttachment[] = ['platform', 'cross-platform'];
const RESIDENT_KEY_REQUIREMENTS: readonly ResidentKeyRequirement[] = ['required', 'preferred', 'discouraged'];
const USER_VERIFICATION_REQUIREMENTS: readonly UserVerificationRequirement[] = ['required', 'preferred', 'discouraged'];
const AUTHENTICATOR_TRANSPORTS: readonly AuthenticatorTransport[] = [
  'usb', 'nfc', 'ble', 'internal', 'hybrid',
];
const ATTESTATION_CONVEYANCES: readonly AttestationConveyancePreference[] = ['none', 'indirect', 'direct', 'enterprise'];

function isStringIn<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

// ---- Respuestas de opciones -------------------------------------------------

interface CreationOptionsResponse {
  challenge: string;
  rp: { id?: string; name: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{ id: string; type?: string; transports?: unknown[] }>;
  authenticatorSelection?: Record<string, unknown>;
  attestation?: unknown;
}

interface AssertionOptionsResponse {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{ id: string; type?: string; transports?: unknown[] }>;
  userVerification?: unknown;
}

function isCreationOptionsResponse(value: unknown): value is CreationOptionsResponse {
  if (!isRecord(value)) return false;
  if (typeof value.challenge !== 'string' || value.challenge === '') return false;
  if (!isRecord(value.rp) || typeof value.rp.name !== 'string') return false;
  if (!isRecord(value.user) || typeof value.user.id !== 'string') return false;
  if (!Array.isArray(value.pubKeyCredParams) || value.pubKeyCredParams.length === 0) return false;
  return value.pubKeyCredParams.every(
    (param) => isRecord(param) && typeof param.alg === 'number',
  );
}

function isAssertionOptionsResponse(value: unknown): value is AssertionOptionsResponse {
  return isRecord(value) && typeof value.challenge === 'string' && value.challenge !== '';
}

// ---- Respuesta de login -----------------------------------------------------

function isLoginResponse(value: unknown): value is LoginResponse {
  // El refresh token ya no viaja en el body: vive en cookie HttpOnly (issue #114).
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string'
  );
}

// ---- Listado de credenciales registradas -------------------------------------

function isPasskeyCredencial(value: unknown): value is PasskeyCredencial {
  if (!isRecord(value)) return false;
  if (typeof value.idCredencial !== 'string' || value.idCredencial === '') return false;
  if (typeof value.nombre !== 'string') return false;
  if (typeof value.fechaCreacion !== 'string') return false;
  if (value.ultimoUso !== null && typeof value.ultimoUso !== 'string') return false;
  return true;
}

/**
 * Extrae el listado de credenciales de /Auth/passkeys/listar. El backend usa
 * ReferenceHandler.IgnoreCycles, así que la respuesta puede ser un array plano
 * o un objeto {$id, $values} según el serializador (mismo patrón que
 * extractMovimientos en movimientos.ts). Descarta ítems que no cumplan el contrato.
 */
function extractPasskeys(data: unknown): PasskeyCredencial[] {
  if (!data) return [];
  const items = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.$values)
      ? data.$values
      : [];
  return items.filter(isPasskeyCredencial);
}

// ---- Credenciales del navegador ---------------------------------------------

export function isPublicKeyCredential(value: Credential | null): value is PublicKeyCredential {
  return value !== null && value.type === 'public-key' && 'rawId' in value;
}

function isAuthenticatorAttestationResponse(
  value: AuthenticatorResponse,
): value is AuthenticatorAttestationResponse {
  return 'attestationObject' in value;
}

function isAuthenticatorAssertionResponse(
  value: AuthenticatorResponse,
): value is AuthenticatorAssertionResponse {
  return 'authenticatorData' in value;
}

// ============================================================================
// Normalización de opciones backend -> opciones del navegador (WebAuthn)
// ============================================================================

function toPublicKeyCredentialDescriptor(raw: unknown): PublicKeyCredentialDescriptor | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id === '') return null;

  const descriptor: PublicKeyCredentialDescriptor = {
    type: 'public-key',
    id: base64UrlToArrayBuffer(raw.id),
  };

  if (Array.isArray(raw.transports)) {
    const transports = raw.transports.filter((t) => isStringIn(AUTHENTICATOR_TRANSPORTS, t));
    if (transports.length > 0) descriptor.transports = transports;
  }

  return descriptor;
}

function toAuthenticatorSelection(raw: unknown): AuthenticatorSelectionCriteria | undefined {
  if (!isRecord(raw)) return undefined;

  const selection: AuthenticatorSelectionCriteria = {};
  if (isStringIn(AUTHENTICATOR_ATTACHMENTS, raw.authenticatorAttachment)) {
    selection.authenticatorAttachment = raw.authenticatorAttachment;
  }
  if (isStringIn(RESIDENT_KEY_REQUIREMENTS, raw.residentKey)) {
    selection.residentKey = raw.residentKey;
  }
  if (isStringIn(USER_VERIFICATION_REQUIREMENTS, raw.userVerification)) {
    selection.userVerification = raw.userVerification;
  }
  if (typeof raw.requireResidentKey === 'boolean') {
    selection.requireResidentKey = raw.requireResidentKey;
  }
  return selection;
}

/**
 * Normaliza la respuesta de /passkeys/registrar/opciones a un
 * PublicKeyCredentialCreationOptions listo para navigator.credentials.create().
 * Los campos binarios llegan como base64url y se convierten a ArrayBuffer.
 */
export function normalizeCreationOptions(raw: unknown): PublicKeyCredentialCreationOptions {
  if (!isCreationOptionsResponse(raw)) {
    throw new Error('Respuesta de opciones de registro inválida');
  }

  const options: PublicKeyCredentialCreationOptions = {
    challenge: base64UrlToArrayBuffer(raw.challenge),
    rp: { id: raw.rp.id, name: raw.rp.name },
    user: {
      id: base64UrlToArrayBuffer(raw.user.id),
      name: raw.user.name,
      displayName: raw.user.displayName,
    },
    pubKeyCredParams: raw.pubKeyCredParams.map((param) => ({
      type: 'public-key' as const,
      alg: param.alg,
    })),
  };

  if (typeof raw.timeout === 'number' && raw.timeout > 0) {
    options.timeout = raw.timeout;
  }

  if (Array.isArray(raw.excludeCredentials)) {
    options.excludeCredentials = raw.excludeCredentials
      .map(toPublicKeyCredentialDescriptor)
      .filter((descriptor): descriptor is PublicKeyCredentialDescriptor => descriptor !== null);
  }

  const authenticatorSelection = toAuthenticatorSelection(raw.authenticatorSelection);
  if (authenticatorSelection) {
    options.authenticatorSelection = authenticatorSelection;
  }

  if (isStringIn(ATTESTATION_CONVEYANCES, raw.attestation)) {
    options.attestation = raw.attestation;
  }

  return options;
}

/**
 * Normaliza la respuesta de /passkeys/auth/opciones a un
 * PublicKeyCredentialRequestOptions listo para navigator.credentials.get().
 */
export function normalizeAssertionOptions(raw: unknown): PublicKeyCredentialRequestOptions {
  if (!isAssertionOptionsResponse(raw)) {
    throw new Error('Respuesta de opciones de inicio de sesión inválida');
  }

  const options: PublicKeyCredentialRequestOptions = {
    challenge: base64UrlToArrayBuffer(raw.challenge),
  };

  if (typeof raw.rpId === 'string' && raw.rpId !== '') {
    options.rpId = raw.rpId;
  }
  if (typeof raw.timeout === 'number' && raw.timeout > 0) {
    options.timeout = raw.timeout;
  }
  if (isStringIn(USER_VERIFICATION_REQUIREMENTS, raw.userVerification)) {
    options.userVerification = raw.userVerification;
  }
  if (Array.isArray(raw.allowCredentials)) {
    options.allowCredentials = raw.allowCredentials
      .map(toPublicKeyCredentialDescriptor)
      .filter((descriptor): descriptor is PublicKeyCredentialDescriptor => descriptor !== null);
  }

  return options;
}

// ============================================================================
// DTOs para los requests de verificación (contrato .NET)
// ============================================================================

function toLoginRequest(credential: PublicKeyCredential): Record<string, unknown> {
  if (!isAuthenticatorAssertionResponse(credential.response)) {
    throw new Error('La respuesta del autenticador no es una assertion');
  }

  const { response } = credential;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    respuestaAssertion: {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      firma: arrayBufferToBase64(response.signature),
      datosAutenticador: arrayBufferToBase64(response.authenticatorData),
      userHandle:
        response.userHandle !== null && response.userHandle.byteLength > 0
          ? arrayBufferToBase64(response.userHandle)
          : null,
      datosClienteJson: arrayBufferToBase64(response.clientDataJSON),
    },
  };
}

function toRegistroRequest(
  credential: PublicKeyCredential,
  nombreDispositivo: string,
): Record<string, unknown> {
  if (!isAuthenticatorAttestationResponse(credential.response)) {
    throw new Error('La respuesta del autenticador no es una attestation');
  }

  const { response } = credential;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    nombreDispositivo,
    respuestaAttestation: {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      attestation: arrayBufferToBase64(response.attestationObject),
      datosClienteJson: arrayBufferToBase64(response.clientDataJSON),
    },
  };
}

// ============================================================================
// Clasificación de errores (cancelación silenciosa vs errores visibles)
// ============================================================================

export type PasskeyErrorKind = 'canceled' | 'no-passkey' | 'expired' | 'network' | 'rate-limit' | 'unknown';

export const PASSKEY_ERROR_MESSAGES: Record<Exclude<PasskeyErrorKind, 'canceled'>, string> = {
  'no-passkey': 'No se encontró un passkey para este usuario. Probá con tu contraseña.',
  expired: 'La solicitud expiró. Probá de nuevo.',
  network: 'No se pudo conectar con el servidor. Revisá tu conexión.',
  'rate-limit': 'Demasiados intentos de inicio de sesión. Esperá un momento y probá de nuevo.',
  unknown: 'No se pudo verificar la passkey. Probá de nuevo.',
};

/**
 * Devuelve el mensaje visible para un error; null si la cancelación debe ser
 * silenciosa. Para rate-limit se prioriza el mensaje real del backend (429).
 */
export function passkeyErrorMessage(kind: PasskeyErrorKind, mensajeBackend?: string): string | null {
  if (kind === 'canceled') return null;
  if (kind === 'rate-limit') {
    return mensajeBackend !== undefined && mensajeBackend.length > 0
      ? mensajeBackend
      : PASSKEY_ERROR_MESSAGES['rate-limit'];
  }
  return PASSKEY_ERROR_MESSAGES[kind];
}

function isDomExceptionWithName(value: unknown, name: string): boolean {
  return (
    typeof DOMException !== 'undefined' &&
    value instanceof DOMException &&
    value.name === name
  );
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === 'string' && data.length > 0) return data;
  if (isRecord(data) && typeof data.error === 'string') return data.error;
  return '';
}

interface AxiosLikeError {
  isAxiosError?: boolean;
  response?: { status?: number; data: unknown } | null;
}

/** Extrae el mensaje de error plano del backend (data del response) o '' si no aplica. */
export function extractBackendMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as AxiosLikeError;
    return extractErrorMessage(axiosError.response?.data);
  }
  return '';
}

/**
 * Diferencia la cancelación del usuario (diálogo nativo WebAuthn o abort
 * propio) — que NO debe mostrar banner — de los errores de red/verificación
 * — que SÍ deben mostrar banner.
 */
export function classifyPasskeyError(error: unknown): PasskeyErrorKind {
  // El usuario descartó el diálogo nativo (NotAllowedError) o se abortó la
  // operación con AbortController (AbortError): silencioso.
  if (isDomExceptionWithName(error, 'AbortError') || isDomExceptionWithName(error, 'NotAllowedError')) {
    return 'canceled';
  }

  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as AxiosLikeError;
    if (!axiosError.response) return 'network';
    // El rate limiter del backend (OnRejected en Program.cs) responde 429 con
    // un mensaje propio; se muestra tal cual.
    if (axiosError.response.status === 429) return 'rate-limit';

    const message = extractErrorMessage(axiosError.response.data);
    // Cadenas reales del backend (verificado en AuthController y AdministracionPasskeys):
    //   "Error al autenticar con passkey"            -> BadRequest (string plano)
    //   "Challenge de auth no encontrado o expirado" -> InvalidOperationException
    //   "No se encontró un challenge válido..."      -> InvalidOperationException
    if (message.includes('autenticar con passkey')) return 'no-passkey';
    if (message.toLowerCase().includes('expirad') || message.toLowerCase().includes('no encontrado')) {
      return 'expired';
    }
    return 'unknown';
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'canceled';
  }

  return 'unknown';
}

// ============================================================================
// Service
// ============================================================================

export const passkeysService = {
  /** Obtiene las opciones para iniciar sesión con passkey. */
  async obtenerOpcionesAuth(signal?: AbortSignal): Promise<PublicKeyCredentialRequestOptions> {
    const { data } = await apiClient.post<unknown>('/Auth/passkeys/auth/opciones', null, { signal });
    return normalizeAssertionOptions(data);
  },

  /** Verifica la assertion de login y devuelve los tokens. */
  async verificarAuth(credential: PublicKeyCredential): Promise<LoginResponse> {
    const { data } = await apiClient.post<unknown>('/Auth/passkeys/auth', toLoginRequest(credential));
    if (!isLoginResponse(data)) {
      throw new Error('Respuesta de autenticación inválida');
    }
    return data;
  },

  /** Obtiene las opciones para registrar un passkey (requiere sesión iniciada). */
  async obtenerOpcionesRegistro(signal?: AbortSignal): Promise<PublicKeyCredentialCreationOptions> {
    const { data } = await apiClient.post<unknown>('/Auth/passkeys/registrar/opciones', null, { signal });
    return normalizeCreationOptions(data);
  },

  /** Verifica la attestation y registra el passkey con el nombre del dispositivo. */
  async verificarRegistro(credential: PublicKeyCredential, nombreDispositivo: string): Promise<void> {
    await apiClient.post('/Auth/passkeys/registrar', toRegistroRequest(credential, nombreDispositivo));
  },

  /** Lista las credenciales del usuario autenticado (el idUsuario sale del claim JWT). */
  async listar(): Promise<PasskeyCredencial[]> {
    const { data } = await apiClient.get<unknown>('/Auth/passkeys/listar');
    return extractPasskeys(data);
  },

  /** Renombra una credencial; idCredencial se reenvía tal cual vino del listado (base64 estándar). */
  async editarNombre(idCredencial: string, nombreNuevo: string): Promise<void> {
    await apiClient.patch('/Auth/passkeys/editar', null, {
      params: { idCredencial, nombreNuevo },
    });
  },

  /** Elimina una credencial; idCredencial se reenvía tal cual vino del listado (base64 estándar). */
  async eliminar(idCredencial: string): Promise<void> {
    await apiClient.delete('/Auth/passkeys/eliminar', {
      params: { idCredencial },
    });
  },
};
