import { describe, it, expect } from 'vitest';
import { obtenerRolDesdeToken } from '../../utils/jwt';

// ============================================================================
// Helpers de prueba
// ============================================================================

/**
 * Codifica un string en base64url (sin padding, '+' -> '-', '/' -> '_'), el
 * mismo formato que usa un JWT real. TextEncoder cubre caracteres fuera de
 * latin1 (acentos, emojis) que btoa() solo no puede codificar.
 */
function codificarBase64Url(texto: string): string {
  let binario = '';
  for (const byte of new TextEncoder().encode(texto)) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Construye un JWT de prueba con formato header.payload.firma. La firma es un
 * placeholder: el helper solo decodifica el payload, no la valida.
 */
function crearToken(payload: unknown): string {
  return `header.${codificarBase64Url(JSON.stringify(payload))}.firma`;
}

// URI largo que .NET 9 serializa para ClaimTypes.Role en el payload crudo del
// JWT (JwtSecurityTokenHandler.WriteToken), ver issue #99.
const CLAIM_ROL_URI_LARGO =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

describe('obtenerRolDesdeToken (issue #99: rol desde el claim del JWT)', () => {
  it('decodifica el rol Administrador', () => {
    const token = crearToken({ role: 'Administrador' });
    expect(obtenerRolDesdeToken(token)).toBe('Administrador');
  });

  it('decodifica el rol Empleado', () => {
    const token = crearToken({ role: 'Empleado' });
    expect(obtenerRolDesdeToken(token)).toBe('Empleado');
  });

  it('decodifica el rol Cliente', () => {
    const token = crearToken({ role: 'Cliente' });
    expect(obtenerRolDesdeToken(token)).toBe('Cliente');
  });

  it('decodifica el rol Administrador desde el claim con URI largo (.NET)', () => {
    const token = crearToken({ [CLAIM_ROL_URI_LARGO]: 'Administrador' });
    expect(obtenerRolDesdeToken(token)).toBe('Administrador');
  });

  it('decodifica el rol Empleado desde el claim con URI largo (.NET)', () => {
    const token = crearToken({ [CLAIM_ROL_URI_LARGO]: 'Empleado' });
    expect(obtenerRolDesdeToken(token)).toBe('Empleado');
  });

  it('decodifica el rol Cliente desde el claim con URI largo (.NET)', () => {
    const token = crearToken({ [CLAIM_ROL_URI_LARGO]: 'Cliente' });
    expect(obtenerRolDesdeToken(token)).toBe('Cliente');
  });

  it('prioriza el claim corto "role" si ambos claims están presentes', () => {
    const token = crearToken({ role: 'Administrador', [CLAIM_ROL_URI_LARGO]: 'Empleado' });
    expect(obtenerRolDesdeToken(token)).toBe('Administrador');
  });

  it('acepta el claim de URI largo si el corto no es un rol válido', () => {
    const token = crearToken({ role: 'Invalido', [CLAIM_ROL_URI_LARGO]: 'Empleado' });
    expect(obtenerRolDesdeToken(token)).toBe('Empleado');
  });

  it('decodifica payloads con caracteres base64url (- y _) y unicode (emojis)', () => {
    // El payload con emojis 🔧 produce segmentos base64url con '-' y '_',
    // ejercitando la conversión base64url -> base64 y el decode UTF-8.
    const token = crearToken({ role: 'Cliente', d: '🔧🔧🔧🔧🔧🔧🔧🔧' });
    const payloadSegmento = token.split('.')[1];
    expect(payloadSegmento).toMatch(/[-_]/);
    expect(obtenerRolDesdeToken(token)).toBe('Cliente');
  });

  it('decodifica payloads con acentos (UTF-8 multibyte)', () => {
    const token = crearToken({ role: 'Empleado', nombre: 'José — Ñandú' });
    expect(obtenerRolDesdeToken(token)).toBe('Empleado');
  });

  it('devuelve null si el token es null', () => {
    expect(obtenerRolDesdeToken(null)).toBeNull();
  });

  it('devuelve null si el token es undefined', () => {
    expect(obtenerRolDesdeToken(undefined as unknown as null)).toBeNull();
  });

  it('devuelve null si el token es string vacío', () => {
    expect(obtenerRolDesdeToken('')).toBeNull();
  });

  it('devuelve null si el token no tiene forma JWT (menos de 3 partes)', () => {
    expect(obtenerRolDesdeToken('solo.dos')).toBeNull();
  });

  it('devuelve null si el payload contiene base64 inválido', () => {
    expect(obtenerRolDesdeToken('header.b@c#d.firma')).toBeNull();
  });

  it('devuelve null si el payload no es JSON válido', () => {
    const token = `header.${codificarBase64Url('{role:')}.firma`;
    expect(obtenerRolDesdeToken(token)).toBeNull();
  });

  it('devuelve null si el payload está vacío', () => {
    expect(obtenerRolDesdeToken('header..firma')).toBeNull();
  });

  it('devuelve null si el token no tiene el claim role (JWT viejo pre-cambio)', () => {
    const token = crearToken({ exp: 1234567890 });
    expect(obtenerRolDesdeToken(token)).toBeNull();
  });

  it('devuelve null si el token no tiene ninguno de los dos claims de rol', () => {
    const token = crearToken({ exp: 1234567890, name: 'Juan', nameid: '42' });
    expect(obtenerRolDesdeToken(token)).toBeNull();
  });

  it('devuelve null si el claim role tiene un valor desconocido', () => {
    const token = crearToken({ role: 'SuperAdmin' });
    expect(obtenerRolDesdeToken(token)).toBeNull();
  });

  it('devuelve null si el claim con URI largo tiene un valor desconocido', () => {
    const token = crearToken({ [CLAIM_ROL_URI_LARGO]: 'SuperAdmin' });
    expect(obtenerRolDesdeToken(token)).toBeNull();
  });
});
