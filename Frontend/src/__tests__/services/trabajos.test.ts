import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trabajosService } from '../../services/trabajos';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: { post: vi.fn() },
}));

describe('trabajosService.subirFotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses apiClient (client with auth interceptors) to upload photos', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: 'foto-url' });

    const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
    await trabajosService.subirFotos(42, [file]);

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
      '/Trabajos/AgregarFotosTrabajo?idTrabajo=42',
      expect.any(FormData),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': undefined }) }),
    );

    // Content-Type desactivado: evita que axios serialice el FormData a JSON;
    // el browser setea multipart/form-data con su boundary automáticamente.
    const config = vi.mocked(apiClient.post).mock.calls[0]?.[2];
    expect(config?.headers).toHaveProperty('Content-Type', undefined);
  });

  it('returns the backend response payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: 'http://foto-url' });

    const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
    const result = await trabajosService.subirFotos(7, [file]);

    expect(result).toBe('http://foto-url');
  });
});
