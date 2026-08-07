// ============================================================================
// JWT helpers (issue #99): lectura de claims sin dependencias
// ============================================================================

import type { RolUsuario } from '../types';

// Nombres de claim de rol aceptados (se buscan en orden):
// - "role": estándar JWT (RFC 7519 / OIDC).
// - "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": URI largo
//   que .NET serializa para ClaimTypes.Role. El JwtSecurityTokenHandler de .NET 9
//   (ShopMGR.Aplicacion/Servicios/AdministrarAuth.cs: WriteToken) emite ESTE URI
//   en el payload crudo del JWT, no el claim corto. El middleware JWT lo mapea
//   internamente (por eso [Authorize(Roles="Administrador")] funciona), pero el
//   frontend lee el payload tal como viene y debe aceptar ambos formatos.
const CLAIMS_DE_ROL = [
  'role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const;

// Nombres de claim de id de usuario aceptados (se buscan en orden):
// - "nameid": variante corta estándar (misma prioridad que "role").
// - URI largo de .NET para ClaimTypes.NameIdentifier (mismo serializador que el rol).
const CLAIMS_ID_USUARIO = [
  'nameid',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier',
] as const;

// Nombres de claim de nombre de usuario aceptados (se buscan en orden):
// - "unique_name": lo que el JwtSecurityTokenHandler de .NET 9 emite para
//   ClaimTypes.Name (System.IdentityModel.Tokens.Jwt mapea Name -> unique_name).
// - "name": variante estándar OIDC.
// - URI largo de .NET para ClaimTypes.Name (mismo serializador que rol e id).
const CLAIMS_NOMBRE_USUARIO = [
  'unique_name',
  'name',
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Convierte base64url a base64 estándar: restaura '+' y '/', y re-agrega el
 * padding '=' que el formato url-safe omite.
 */
function base64UrlABase64(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(padding);
}

/**
 * Decodifica el segmento de payload (el del medio) de un JWT. No valida firma:
 * el token ya fue autenticado por el backend; solo leemos claims para la UI.
 * Lanza si el token no tiene forma JWT, el base64 es inválido o el JSON no parsea.
 */
function decodificarPayload(token: string): unknown {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('Formato JWT inválido');
  const payload = partes[1];
  // atob() devuelve los bytes como code units latin-1; los claims pueden traer
  // UTF-8 multibyte (nombres con acentos, p.ej. "José"), por eso se redecodifica
  // el buffer como UTF-8 antes de parsear el JSON.
  const binario = atob(base64UrlABase64(payload));
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json);
}

/**
 * Extrae el rol del JWT de acceso. El claim puede venir como "role" (estándar)
 * o como el URI largo de .NET
 * (http://schemas.microsoft.com/ws/2008/06/identity/claims/role). Se recorre en
 * orden y se devuelve el PRIMER claim con un RolUsuario válido: si el primero
 * trae un valor desconocido, se prueba el siguiente.
 * Fail-closed: token ausente o malformado, payload sin ninguno de los claims o
 * rol desconocido devuelven null — si no se puede probar el rol, la UI no lo asume.
 */
export function obtenerRolDesdeToken(accessToken: string | null): RolUsuario | null {
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;
  try {
    const payload = decodificarPayload(accessToken);
    if (!isRecord(payload)) return null;
    for (const claim of CLAIMS_DE_ROL) {
      const value = payload[claim];
      if (value === 'Administrador' || value === 'Empleado' || value === 'Cliente') {
        return value;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extrae el id de usuario del JWT de acceso (claim "nameid" o NameIdentifier de
 * .NET, serializado como URI largo). Se recorre en orden y se devuelve el PRIMER
 * claim con un id numérico válido: si el primero no es numérico, se prueba el
 * siguiente. Se usa para comparar contra los ids de ListarUsuariosAsync y
 * refrescar el token cuando el admin se cambia el rol a sí mismo.
 * Fail-closed: token ausente/malformado o id no numérico devuelven null.
 */
export function obtenerIdUsuarioDesdeToken(accessToken: string | null): number | null {
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;
  try {
    const payload = decodificarPayload(accessToken);
    if (!isRecord(payload)) return null;
    for (const claim of CLAIMS_ID_USUARIO) {
      const value = payload[claim];
      if (typeof value === 'string' && value.length > 0) {
        const numero = Number(value);
        if (Number.isInteger(numero)) return numero;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extrae el nombre de usuario del JWT de acceso. El claim puede venir como
 * "unique_name" (lo que .NET 9 emite para ClaimTypes.Name), "name" (OIDC) o el
 * URI largo de .NET. Se recorre en orden y se devuelve el PRIMER claim con un
 * valor no vacío (con trim). Se usa para mostrar el nombre en la barra lateral
 * y en la página de perfil (issue #112).
 * Fail-closed: token ausente/malformado o nombre vacío devuelven null — la UI
 * muestra el fallback "Mi cuenta", NUNCA el id de usuario.
 */
export function obtenerNombreUsuarioDesdeToken(accessToken: string | null): string | null {
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;
  try {
    const payload = decodificarPayload(accessToken);
    if (!isRecord(payload)) return null;
    for (const claim of CLAIMS_NOMBRE_USUARIO) {
      const value = payload[claim];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}
