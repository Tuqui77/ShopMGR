using Microsoft.Extensions.Diagnostics.HealthChecks;

public class StorageHealthCheck : IHealthCheck
{
    private readonly string _basePath;

    //TODO(#133): Mover los paths a configuración para separar el health check de los detalles del deployment

    public StorageHealthCheck()
        : this(Directory.GetCurrentDirectory()) { }

    public StorageHealthCheck(string basePath)
    {
        ArgumentNullException.ThrowIfNull(basePath);
        _basePath = basePath;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext contexto,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var carpetaImagenes = Path.Combine(_basePath, "imagenes");
            var carpetaHealthCheck = Path.Combine(carpetaImagenes, ".health");

            // Crear el directorio si no existe (antes lo hacía Program.cs al arrancar y la app
            // crasheaba si el volumen era read-only; ahora /ready reporta Unhealthy en su lugar).
            Directory.CreateDirectory(carpetaHealthCheck);

            // Verificar lectura: enumerar los archivos fuerza la lectura real del directorio.
            var archivos = Directory.EnumerateFiles(carpetaHealthCheck).Count();

            // Verificar escritura con un probe: escribir, leer y borrar dentro del directorio.
            var rutaProbe = Path.Combine(carpetaHealthCheck, $".probe-{Guid.NewGuid():N}.tmp");
            try
            {
                File.WriteAllText(rutaProbe, "ok");
                File.ReadAllText(rutaProbe);
            }
            finally
            {
                if (File.Exists(rutaProbe))
                {
                    File.Delete(rutaProbe);
                }
            }

            return Task.FromResult(
                HealthCheckResult.Healthy(
                    $"Directorio '{carpetaHealthCheck}' accesible en lectura y escritura ({archivos} archivos)."
                )
            );
        }
        catch (Exception ex)
        {
            // Nunca dejar que una excepción se escape del check: cualquier fallo
            // (IOException, UnauthorizedAccessException, path inválido, etc.) reporta Unhealthy.
            return Task.FromResult(
                HealthCheckResult.Unhealthy(
                    $"No se pudo verificar el almacenamiento de imágenes (base: '{_basePath}'): {ex.Message}",
                    ex
                )
            );
        }
    }
}
