using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Xunit;

namespace ShopMGR.Tests;

public class HealthChecksTests
{
    private static HealthCheckContext CrearContexto() => new();

    #region LivenessHealthCheck

    [Fact]
    public async Task LivenessHealthCheck_DeberiaRetornarHealthy()
    {
        // Arrange
        var check = new LivenessHealthCheck();

        // Act
        var resultado = await check.CheckHealthAsync(CrearContexto());

        // Assert
        resultado.Status.Should().Be(HealthStatus.Healthy);
    }

    #endregion

    #region StorageHealthCheck

    [Fact]
    public async Task StorageHealthCheck_DeberiaRetornarUnhealthyCuandoElDirectorioNoExiste()
    {
        // Arrange: el directorio .health lo crea el startup; si no existe es porque
        // el volumen no está montado (o nadie lo creó) -> readiness en Unhealthy.
        var basePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        try
        {
            var check = new StorageHealthCheck(basePath);

            // Act
            var resultado = await check.CheckHealthAsync(CrearContexto());

            // Assert
            resultado.Status.Should().Be(HealthStatus.Unhealthy);
            resultado.Description.Should().Contain(Path.Combine(basePath, "imagenes", ".health"));
        }
        finally
        {
            if (Directory.Exists(basePath))
            {
                Directory.Delete(basePath, recursive: true);
            }
        }
    }

    [Fact]
    public async Task StorageHealthCheck_DeberiaRetornarHealthyCuandoElDirectorioExisteYEsLegible()
    {
        // Arrange
        var basePath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        var carpetaHealthCheck = Path.Combine(basePath, "imagenes", ".health");
        try
        {
            Directory.CreateDirectory(carpetaHealthCheck);
            File.WriteAllText(Path.Combine(carpetaHealthCheck, "archivo.txt"), "contenido");

            var check = new StorageHealthCheck(basePath);

            // Act
            var resultado = await check.CheckHealthAsync(CrearContexto());

            // Assert
            resultado.Status.Should().Be(HealthStatus.Healthy);
            resultado.Description.Should().Contain("1 archivos");
        }
        finally
        {
            if (Directory.Exists(basePath))
            {
                Directory.Delete(basePath, recursive: true);
            }
        }
    }

    [Fact]
    public void StorageHealthCheck_DeberiaResolverseDesdeInyeccionDeDependencias()
    {
        // Arrange: replicar el registro de Program.cs (AddCheck<StorageHealthCheck>) para
        // garantizar que el contenedor resuelve el check sin parámetros no resolubles.
        var servicios = new ServiceCollection();
        servicios
            .AddHealthChecks()
            .AddCheck<StorageHealthCheck>(
                "Storage",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]
            );
        using var proveedor = servicios.BuildServiceProvider();

        // Act
        var opciones = proveedor.GetRequiredService<IOptions<HealthCheckServiceOptions>>();
        var registro = opciones.Value.Registrations.Single(r => r.Name == "Storage");
        var check = registro.Factory(proveedor);

        // Assert
        check.Should().BeOfType<StorageHealthCheck>();
    }

    #endregion
}
