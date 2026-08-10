import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../services/api';
import {
  base64UrlToArrayBuffer,
  arrayBufferToBase64Url,
  arrayBufferToBase64,
  classifyPasskeyError,
  passkeyErrorMessage,
  extractBackendMessage,
  normalizeAssertionOptions,
  normalizeCreationOptions,
  passkeysService,
} from '../../services/passkeys';

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPatch = vi.mocked(apiClient.patch);
const mockedDelete = vi.mocked(apiClient.delete);

function bytesToBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function bufferToBytes(buffer: BufferSource): Uint8Array {
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

describe('passkeys: encoding helpers', () => {
  it('base64UrlToArrayBuffer decodifica base64url sin padding', () => {
    const buffer = base64UrlToArrayBuffer('aGVsbG8'); // "hello"
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(bufferToBytes(buffer)).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it('arrayBufferToBase64Url encode sin padding', () => {
    expect(arrayBufferToBase64Url(bytesToBuffer(new Uint8Array([104, 101, 108, 108, 111])))).toBe('aGVsbG8');
  });

  it('roundtrip base64url string se mantiene', () => {
    const input = 'aGVsbG8';
    expect(arrayBufferToBase64Url(base64UrlToArrayBuffer(input))).toBe(input);
  });

  it('roundtrip con bytes arbitrarios (incluye + y / reemplazados por - y _)', () => {
    const bytes = new Uint8Array([0, 255, 128, 64, 251, 126, 1, 192]);
    const encoded = arrayBufferToBase64Url(bytesToBuffer(bytes));
    expect(encoded).not.toMatch(/[+/]/);
    expect(bufferToBytes(base64UrlToArrayBuffer(encoded))).toEqual(bytes);
  });

  it('arrayBufferToBase64 produce base64 estándar con padding', () => {
    expect(arrayBufferToBase64(bytesToBuffer(new Uint8Array([104, 101, 108, 108, 111])))).toBe('aGVsbG8=');
  });
});

describe('passkeys: classifyPasskeyError', () => {
  it('AbortError (DOMException) es cancelación silenciosa', () => {
    const err = new DOMException('Abort', 'AbortError');
    expect(classifyPasskeyError(err)).toBe('canceled');
    expect(passkeyErrorMessage('canceled')).toBeNull();
  });

  it('NotAllowedError (DOMException) es cancelación silenciosa', () => {
    const err = new DOMException('Not allowed', 'NotAllowedError');
    expect(classifyPasskeyError(err)).toBe('canceled');
    expect(passkeyErrorMessage('canceled')).toBeNull();
  });

  it('Error con name AbortError es cancelación silenciosa', () => {
    const err = new Error('abortado');
    err.name = 'AbortError';
    expect(classifyPasskeyError(err)).toBe('canceled');
  });

  it('error axios sin response es network', () => {
    const err = { isAxiosError: true };
    expect(classifyPasskeyError(err)).toBe('network');
    expect(passkeyErrorMessage('network')).toBe('No se pudo conectar con el servidor. Revisá tu conexión.');
  });

  it('error axios 429 es rate-limit y muestra el mensaje real del backend', () => {
    const mensaje = 'Demasiados intentos de inicio de sesión. Esperá 60 segundos e intentá de nuevo.';
    const err = { isAxiosError: true, response: { status: 429, data: mensaje } };
    expect(classifyPasskeyError(err)).toBe('rate-limit');
    expect(passkeyErrorMessage('rate-limit', extractBackendMessage(err))).toBe(mensaje);
  });

  it('error axios 429 con data { error } muestra el mensaje real del backend', () => {
    const mensaje = 'Demasiados intentos de inicio de sesión. Esperá 60 segundos e intentá de nuevo.';
    const err = { isAxiosError: true, response: { status: 429, data: { error: mensaje } } };
    expect(classifyPasskeyError(err)).toBe('rate-limit');
    expect(passkeyErrorMessage('rate-limit', extractBackendMessage(err))).toBe(mensaje);
  });

  it('error axios 429 sin mensaje usa el fallback de rate-limit', () => {
    const err = { isAxiosError: true, response: { status: 429, data: null } };
    expect(classifyPasskeyError(err)).toBe('rate-limit');
    expect(passkeyErrorMessage('rate-limit')).toBe(
      'Demasiados intentos de inicio de sesión. Esperá un momento y probá de nuevo.',
    );
  });

  it('mensaje "autenticar con passkey" es no-passkey', () => {
    const err = { isAxiosError: true, response: { status: 400, data: 'Error al autenticar con passkey' } };
    expect(classifyPasskeyError(err)).toBe('no-passkey');
    expect(passkeyErrorMessage('no-passkey')).toBe('No se encontró un passkey para este usuario. Probá con tu contraseña.');
  });

  it('mensaje "expirado" es expired', () => {
    const err = { isAxiosError: true, response: { status: 400, data: 'Challenge de auth no encontrado o expirado' } };
    expect(classifyPasskeyError(err)).toBe('expired');
    expect(passkeyErrorMessage('expired')).toBe('La solicitud expiró. Probá de nuevo.');
  });

  it('error desconocido es unknown', () => {
    expect(classifyPasskeyError('algo raro')).toBe('unknown');
    expect(passkeyErrorMessage('unknown')).toBe('No se pudo verificar la passkey. Probá de nuevo.');
  });
});

describe('passkeys: normalizeAssertionOptions', () => {
  it('normaliza un challenge válido (base64url -> ArrayBuffer)', () => {
    const options = normalizeAssertionOptions({ challenge: 'aGVsbG8' });
    expect(options.challenge).toBeInstanceOf(ArrayBuffer);
    expect(bufferToBytes(options.challenge)).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it('aplica rpId, timeout y userVerification cuando vienen', () => {
    const options = normalizeAssertionOptions({
      challenge: 'aGVsbG8',
      rpId: 'localhost',
      timeout: 60000,
      userVerification: 'preferred',
    });
    expect(options.rpId).toBe('localhost');
    expect(options.timeout).toBe(60000);
    expect(options.userVerification).toBe('preferred');
  });

  it('lanza error con challenge inválido', () => {
    expect(() => normalizeAssertionOptions({ challenge: '' })).toThrow(
      'Respuesta de opciones de inicio de sesión inválida',
    );
  });
});

describe('passkeys: normalizeCreationOptions', () => {
  it('normaliza un create válido con challenge y user.id', () => {
    const options = normalizeCreationOptions({
      challenge: 'aGVsbG8',
      rp: { name: 'ShopMGR' },
      user: { id: 'dXNlcg', name: 'juan', displayName: 'Juan' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    });
    expect(options.challenge).toBeInstanceOf(ArrayBuffer);
    expect(bufferToBytes(options.challenge)).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
    expect(options.rp.name).toBe('ShopMGR');
    expect(options.user.id).toBeInstanceOf(ArrayBuffer);
    expect(bufferToBytes(options.user.id)).toEqual(new Uint8Array([117, 115, 101, 114])); // "user"
    expect(options.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
  });

  it('lanza error con estructura inválida', () => {
    expect(() => normalizeCreationOptions({})).toThrow('Respuesta de opciones de registro inválida');
  });
});

// ============================================================================
// Service: listar / editarNombre / eliminar
// ============================================================================

const PASSKEY_VALIDA = {
  idCredencial: 'aGVsbG8=',
  nombre: 'iPhone de Juan',
  fechaCreacion: '2026-07-01T10:00:00',
  ultimoUso: '2026-07-02T10:00:00',
};

describe('passkeysService.listar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve las credenciales cuando el backend responde un array plano', async () => {
    mockedGet.mockResolvedValue({ data: [PASSKEY_VALIDA] });
    const result = await passkeysService.listar();
    expect(mockedGet).toHaveBeenCalledWith('/Auth/passkeys/listar');
    expect(result).toEqual([PASSKEY_VALIDA]);
  });

  it('devuelve las credenciales cuando el backend responde {$id, $values}', async () => {
    mockedGet.mockResolvedValue({ data: { $id: '1', $values: [PASSKEY_VALIDA] } });
    const result = await passkeysService.listar();
    expect(result).toEqual([PASSKEY_VALIDA]);
  });

  it('acepta ultimoUso null (nunca usado)', async () => {
    mockedGet.mockResolvedValue({
      data: [{ idCredencial: 'aGVsbG8=', nombre: 'MacBook', fechaCreacion: '2026-07-01T10:00:00', ultimoUso: null }],
    });
    const [result] = await passkeysService.listar();
    expect(result.ultimoUso).toBeNull();
  });

  it('devuelve [] cuando el backend responde null', async () => {
    mockedGet.mockResolvedValue({ data: null });
    expect(await passkeysService.listar()).toEqual([]);
  });

  it('filtra ítems que no cumplen el contrato', async () => {
    mockedGet.mockResolvedValue({
      data: [
        PASSKEY_VALIDA,
        { idCredencial: 123, nombre: 'Sin id válido', fechaCreacion: '2026-07-01T10:00:00', ultimoUso: null },
        { idCredencial: 'YmFk', nombre: 'Sin fechaCreacion', ultimoUso: null },
        { idCredencial: 'YmFk', nombre: 'ultimoUso numérico', fechaCreacion: '2026-07-01T10:00:00', ultimoUso: 5 },
        null,
      ],
    });
    const result = await passkeysService.listar();
    expect(result).toEqual([PASSKEY_VALIDA]);
  });
});

describe('passkeysService.editarNombre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía PATCH con los params idCredencial y nombreNuevo', async () => {
    mockedPatch.mockResolvedValue({ data: 'Nombre de la passkey modificado' });
    await passkeysService.editarNombre('aGVsbG8=', 'MacBook Pro');
    expect(mockedPatch).toHaveBeenCalledWith('/Auth/passkeys/editar', null, {
      params: { idCredencial: 'aGVsbG8=', nombreNuevo: 'MacBook Pro' },
    });
  });

  it('no transforma el idCredencial (se reenvía tal cual vino del listado)', async () => {
    const idConSlash = 'ab+/cd==';
    mockedPatch.mockResolvedValue({ data: 'Nombre de la passkey modificado' });
    await passkeysService.editarNombre(idConSlash, 'Nuevo');
    const params = vi.mocked(mockedPatch.mock.calls[0]?.[2])?.params;
    expect(params).toEqual({ idCredencial: 'ab+/cd==', nombreNuevo: 'Nuevo' });
  });
});

describe('passkeysService.eliminar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía DELETE con el param idCredencial', async () => {
    mockedDelete.mockResolvedValue({ data: 'Passkey eliminada correctamente' });
    await passkeysService.eliminar('aGVsbG8=');
    expect(mockedDelete).toHaveBeenCalledWith('/Auth/passkeys/eliminar', {
      params: { idCredencial: 'aGVsbG8=' },
    });
  });
});

// ============================================================================
// Service: flujo WebAuthn (obtenerOpcionesAuth / verificarAuth /
// obtenerOpcionesRegistro / verificarRegistro)
// ============================================================================

/** Mock de una AuthenticatorAssertionResponse (respuesta del autenticador al login). */
function makeAssertionResponse(userHandle: ArrayBuffer = bytesToBuffer(new Uint8Array([7]))): AuthenticatorAssertionResponse {
  return {
    clientDataJSON: bytesToBuffer(new Uint8Array([1, 2])),
    authenticatorData: bytesToBuffer(new Uint8Array([3, 4])),
    signature: bytesToBuffer(new Uint8Array([5, 6])),
    userHandle,
  } as AuthenticatorAssertionResponse;
}

/** Mock de una AuthenticatorAttestationResponse (respuesta del autenticador al registro). */
function makeAttestationResponse(): AuthenticatorAttestationResponse {
  return {
    clientDataJSON: bytesToBuffer(new Uint8Array([1, 2])),
    attestationObject: bytesToBuffer(new Uint8Array([8, 9])),
    getTransports: () => ['internal'] as AuthenticatorTransport[],
  } as AuthenticatorAttestationResponse;
}

/** Mock de una PublicKeyCredential con los campos mínimos del contrato. */
function makeCredential(response: AuthenticatorResponse): PublicKeyCredential {
  return {
    id: 'cred-id',
    rawId: bytesToBuffer(new Uint8Array([10, 11])),
    response,
    type: 'public-key',
    getClientExtensionResults: () => ({}),
    toJSON: () => ({}),
  } as PublicKeyCredential;
}

describe('passkeysService.obtenerOpcionesAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hace POST a /auth/opciones y normaliza la respuesta a opciones de assertion', async () => {
    mockedPost.mockResolvedValue({
      data: { challenge: 'aGVsbG8', rpId: 'localhost', timeout: 60000, userVerification: 'preferred' },
    });

    const options = await passkeysService.obtenerOpcionesAuth();

    expect(mockedPost).toHaveBeenCalledWith('/Auth/passkeys/auth/opciones', null, { signal: undefined });
    expect(options.challenge).toBeInstanceOf(ArrayBuffer);
    expect(bufferToBytes(options.challenge)).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
    expect(options.rpId).toBe('localhost');
    expect(options.userVerification).toBe('preferred');
  });

  it('propaga el AbortSignal al POST', async () => {
    const signal = new AbortController().signal;
    mockedPost.mockResolvedValue({ data: { challenge: 'aGVsbG8' } });

    await passkeysService.obtenerOpcionesAuth(signal);

    expect(mockedPost.mock.calls[0]?.[2]?.signal).toBe(signal);
  });
});

describe('passkeysService.verificarAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hace POST a /auth con el DTO de assertion y devuelve los tokens', async () => {
    mockedPost.mockResolvedValue({ data: { accessToken: 'token-abc' } });

    const resultado = await passkeysService.verificarAuth(makeCredential(makeAssertionResponse()));

    expect(mockedPost).toHaveBeenCalledWith('/Auth/passkeys/auth', {
      id: 'cred-id',
      rawId: arrayBufferToBase64Url(bytesToBuffer(new Uint8Array([10, 11]))),
      respuestaAssertion: {
        id: 'cred-id',
        rawId: arrayBufferToBase64Url(bytesToBuffer(new Uint8Array([10, 11]))),
        firma: arrayBufferToBase64(bytesToBuffer(new Uint8Array([5, 6]))),
        datosAutenticador: arrayBufferToBase64(bytesToBuffer(new Uint8Array([3, 4]))),
        userHandle: arrayBufferToBase64(bytesToBuffer(new Uint8Array([7]))),
        datosClienteJson: arrayBufferToBase64(bytesToBuffer(new Uint8Array([1, 2]))),
      },
    });
    expect(resultado).toEqual({ accessToken: 'token-abc' });
  });

  it('envía userHandle null cuando el autenticador no devuelve handle', async () => {
    const response = makeAssertionResponse(new ArrayBuffer(0));
    mockedPost.mockResolvedValue({ data: { accessToken: 'token-abc' } });

    await passkeysService.verificarAuth(makeCredential(response));

    const body = mockedPost.mock.calls[0]?.[1] as { respuestaAssertion: { userHandle: unknown } };
    expect(body.respuestaAssertion.userHandle).toBeNull();
  });

  it('rechaza cuando la respuesta no es un LoginResponse válido (fail-closed)', async () => {
    mockedPost.mockResolvedValue({ data: { resultado: 'raro' } });

    await expect(passkeysService.verificarAuth(makeCredential(makeAssertionResponse()))).rejects.toThrow(
      'Respuesta de autenticación inválida',
    );
  });
});

describe('passkeysService.obtenerOpcionesRegistro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hace POST a /registrar/opciones y normaliza la respuesta a opciones de creación', async () => {
    mockedPost.mockResolvedValue({
      data: {
        challenge: 'aGVsbG8',
        rp: { name: 'ShopMGR' },
        user: { id: 'dXNlcg', name: 'juan', displayName: 'Juan' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      },
    });

    const options = await passkeysService.obtenerOpcionesRegistro();

    expect(mockedPost).toHaveBeenCalledWith('/Auth/passkeys/registrar/opciones', null, { signal: undefined });
    expect(options.challenge).toBeInstanceOf(ArrayBuffer);
    expect(options.rp.name).toBe('ShopMGR');
    expect(options.user.id).toBeInstanceOf(ArrayBuffer);
    expect(options.pubKeyCredParams).toEqual([{ type: 'public-key', alg: -7 }]);
  });
});

describe('passkeysService.verificarRegistro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hace POST a /registrar con el DTO de attestation y el nombre del dispositivo', async () => {
    mockedPost.mockResolvedValue({ data: 'Passkey registrada' });

    await passkeysService.verificarRegistro(makeCredential(makeAttestationResponse()), 'iPhone de Juan');

    expect(mockedPost).toHaveBeenCalledWith('/Auth/passkeys/registrar', {
      id: 'cred-id',
      rawId: arrayBufferToBase64Url(bytesToBuffer(new Uint8Array([10, 11]))),
      nombreDispositivo: 'iPhone de Juan',
      respuestaAttestation: {
        id: 'cred-id',
        rawId: arrayBufferToBase64Url(bytesToBuffer(new Uint8Array([10, 11]))),
        attestation: arrayBufferToBase64(bytesToBuffer(new Uint8Array([8, 9]))),
        datosClienteJson: arrayBufferToBase64(bytesToBuffer(new Uint8Array([1, 2]))),
      },
    });
  });
});
