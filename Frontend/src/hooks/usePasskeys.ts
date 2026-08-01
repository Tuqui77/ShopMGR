import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { passkeysService } from '../services/passkeys';

// ============================================================================
// Queries
// ============================================================================

/** Lista las passkeys del usuario autenticado. */
export function usePasskeys() {
  return useQuery({
    queryKey: ['passkeys'],
    queryFn: () => passkeysService.listar(),
  });
}

// ============================================================================
// Mutations
// ============================================================================

/** Renombra una passkey y refresca la lista. */
export function useRenombrarPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idCredencial, nombreNuevo }: { idCredencial: string; nombreNuevo: string }) =>
      passkeysService.editarNombre(idCredencial, nombreNuevo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passkeys'] });
    },
  });
}

/** Elimina una passkey y refresca la lista. */
export function useEliminarPasskey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idCredencial: string) => passkeysService.eliminar(idCredencial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passkeys'] });
    },
  });
}
