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
  const json = atob(base64UrlABase64(payload));
  return JSON.parse(json);
}

/**
 * Extrae el rol del JWT de acceso. El claim puede venir como "role" (estándar)
 * o como el URI largo de .NET
 * (http://schemas.microsoft.com/ws/2008/06/identity/claims/role). Se devuelve el
 * primer claim que tenga un RolUsuario válido.
 * Fail-closed: token ausente o malformado, payload sin ninguno de los claims o
 * rol desconocido devuelven null — si no se puede probar el rol, la UI no lo asume.
 */
export function obtenerRolDesdeToken(accessToken: string | null): RolUsuario | null {
  if (typeof accessToken !== 'string' || accessToken.length === 0) return null;
  try {
    const payload = decodificarPayload(accessToken);
    if (!isRecord(payload)) return null;
    for (const claim of CLAIMS_DE_ROL) {
      const role = payload[claim];
      if (role === 'Administrador' || role === 'Empleado' || role === 'Cliente') {
        return role;
      }
    }
    return null;
  } catch {
    return null;
  }
}
