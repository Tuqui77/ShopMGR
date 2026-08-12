using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Contexto;
using Xunit;

namespace ShopMGR.Tests.Integration;

/// <summary>
/// TC-TRA-14..17 / TC-PRE-12..13 — validación de referencias en CrearAsync
/// (fix issue #126): IdCliente/IdPresupuesto inexistentes ya no producen
/// FK violation (500) sino KeyNotFoundException (404). Incluye positivos
/// para evitar regresión del flujo de creación.
/// </summary>
public class ApiIssue126Tests : ApiTestsBase, IAsyncLifetime
{
    private const decimal CostoHoraSeed = 100m;

    public ApiIssue126Tests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    // CrearPresupuesto requiere ValorHoraDeTrabajo configurado (el Bootstrap no lo siembra):
    // sin el seed, ObtenerCostoHoraDeTrabajo lanza KeyNotFoundException y el 404
    // de TC_PRE_12 no sería el del fix sino el del costo hora.
    public async Task InitializeAsync()
    {
        using var client = CrearClienteAutenticado();
        var seed = await client.PatchAsync(
            $"/api/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto={CostoHoraSeed}",
            null
        );
        Assert.Equal(HttpStatusCode.OK, seed.StatusCode);
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(HttpClient client, int idCliente)> CrearClienteAsync(string sufijo)
    {
        var client = CrearClienteAutenticado();
        var nombre = $"Cliente {sufijo}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idCliente = await ObtenerIdClientePorNombreAsync(nombre);
        return (client, idCliente);
    }

    private object CrearPresupuestoBody(int idCliente, string titulo) => new
    {
        titulo,
        horasEstimadas = 4,
        idCliente,
        materiales = new[]
        {
            new { descripcion = "Material de prueba", precio = 250.50m, cantidad = 2.0 },
        },
    };

    private static async Task AssertErrorEnBody(HttpResponseMessage respuesta, string esperado)
    {
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(esperado, doc.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task TC_TRA_14_CrearTrabajoConClienteInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();
        var titulo = $"Trabajo cliente inexistente {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente = 999999 }
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        await AssertErrorEnBody(respuesta, "No existe un cliente con id 999999");
        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var persistido = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
            Assert.Null(persistido);
        }
    }

    [Fact]
    public async Task TC_TRA_15_CrearTrabajoConPresupuestoInexistente_Devuelve404()
    {
        var (client, idCliente) = await CrearClienteAsync(
            $"trabajo presupuesto inexistente {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo presupuesto inexistente {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, idPresupuesto = 999999 }
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        await AssertErrorEnBody(respuesta, "No existe un presupuesto con id 999999");
        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var persistido = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
            Assert.Null(persistido);
        }
    }

    [Fact]
    public async Task TC_TRA_16_CrearTrabajoClienteValidoSinPresupuesto_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteAsync(
            $"trabajo sin presupuesto {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo sin presupuesto {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var persistido = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
        Assert.NotNull(persistido);
        Assert.Equal(idCliente, persistido.IdCliente);
        Assert.Null(persistido.IdPresupuesto);
    }

    [Fact]
    public async Task TC_TRA_17_CrearTrabajoConClienteYPresupuestoValidos_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteAsync(
            $"trabajo con presupuesto {Guid.NewGuid():N}"
        );
        var tituloPresupuesto = $"Presupuesto para trabajo {Guid.NewGuid():N}";
        var crearPresupuesto = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, tituloPresupuesto)
        );
        Assert.Equal(HttpStatusCode.OK, crearPresupuesto.StatusCode);
        var idPresupuesto = await ObtenerIdPresupuestoPorTituloAsync(tituloPresupuesto);
        var titulo = $"Trabajo con presupuesto {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, idPresupuesto }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var persistido = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
        Assert.NotNull(persistido);
        Assert.Equal(idCliente, persistido.IdCliente);
        Assert.Equal(idPresupuesto, persistido.IdPresupuesto);
    }

    [Fact]
    public async Task TC_PRE_12_CrearPresupuestoConClienteInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();
        var titulo = $"Presupuesto cliente inexistente {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(999999, titulo)
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        await AssertErrorEnBody(respuesta, "No existe un cliente con id 999999");
        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var persistido = await contexto.Presupuestos.FirstOrDefaultAsync(p =>
                p.Titulo == titulo
            );
            Assert.Null(persistido);
        }
    }

    [Fact]
    public async Task TC_PRE_13_CrearPresupuestoConClienteValido_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteAsync(
            $"presupuesto valido {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto valido {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var persistido = await contexto.Presupuestos.FirstOrDefaultAsync(p => p.Titulo == titulo);
        Assert.NotNull(persistido);
        Assert.Equal(idCliente, persistido.IdCliente);
    }
}
