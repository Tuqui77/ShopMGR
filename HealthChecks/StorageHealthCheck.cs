using Microsoft.Extensions.Diagnostics.HealthChecks;

public class StorageHealthCheck : IHealthCheck
{
    private readonly string _basePath;

    //TODO(#133): Mover los path a configuración para separar el health check de los detalles del deployment

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
        // El directorio .health lo crea Program.cs al arrancar: este chequeo es solo lectura
        // (corre cada ~10 segundos por pod, no se hace I/O de escritura durante el probe).
        var carpetaImagenes = Path.Combine(_basePath, "imagenes");
        var carpetaHealthCheck = Path.Combine(carpetaImagenes, ".health");
        var existeDirectorio = Directory.Exists(carpetaHealthCheck);

        if (!existeDirectorio)
        {
            return Task.FromResult(
                HealthCheckResult.Unhealthy(
                    $"El directorio '{carpetaHealthCheck}' no existe o no está montado."
                )
            );
        }

        try
        {
            // Count() fuerza la enumeración real del directorio (lectura).
            var archivos = Directory.EnumerateFiles(carpetaHealthCheck).Count();

            return Task.FromResult(
                HealthCheckResult.Healthy(
                    $"Directorio '{carpetaHealthCheck}' legible ({archivos} archivos)."
                )
            );
        }
        catch (UnauthorizedAccessException ex)
        {
            return Task.FromResult(
                HealthCheckResult.Unhealthy(
                    $"Sin permiso de lectura sobre '{carpetaHealthCheck}': {ex.Message}",
                    ex
                )
            );
        }
    }
}
