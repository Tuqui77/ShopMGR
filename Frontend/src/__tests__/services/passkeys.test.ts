import { describe, it, expect } from 'vitest';
import {
  base64UrlToArrayBuffer,
  arrayBufferToBase64Url,
  arrayBufferToBase64,
  classifyPasskeyError,
  passkeyErrorMessage,
  extractBackendMessage,
  normalizeAssertionOptions,
  normalizeCreationOptions,
} from '../../services/passkeys';

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
