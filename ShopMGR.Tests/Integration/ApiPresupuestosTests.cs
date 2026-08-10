using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;
using Xunit;

namespace ShopMGR.Tests.Integration;

/// <summary>
/// TC-PRE-01..11 (CRUD presupuestos + estados + costo hora) y H4
/// (ActualizarPresupuesto). Requiere la configuración ValorHoraDeTrabajo
/// (el Bootstrap no la siembra): se crea vía API en InitializeAsync
/// (endpoint idempotente — docs/qa + AdministracionPresupuestos.cs).
/// </summary>
public class ApiPresupuestosTests : ApiTestsBase, IAsyncLifetime
{
    private const decimal CostoHoraSeed = 100m;

    public ApiPresupuestosTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

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

    private async Task<(HttpClient client, int idCliente)> CrearClienteBaseAsync(string sufijo)
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

    [Fact]
    public async Task TC_PRE_01_CrearPresupuestoValido_Devuelve200YPersisteMateriales()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"presupuesto {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var presupuesto = await contexto.Presupuestos.FirstOrDefaultAsync(p =>
                p.Titulo == titulo
            );
            Assert.NotNull(presupuesto);
            Assert.True(presupuesto.Id > 0);
            var materiales = await contexto
                .Materiales.Where(m => m.IdPresupuesto == presupuesto.Id)
                .ToListAsync();
            Assert.True(
                materiales.Count > 0,
                "Los materiales deben persistirse junto al presupuesto"
            );
        }
    }

    [Fact]
    public async Task TC_PRE_02_CrearPresupuestoSinTitulo_Devuelve400()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"presupuesto sin titulo {Guid.NewGuid():N}"
        );

        var respuesta = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            new { horasEstimadas = 4, idCliente }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("title", out _), "Debe ser ProblemDetails");
    }

    [Fact]
    public async Task TC_PRE_03_ListarPresupuestos_DevuelveArray()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"listar presupuesto {Guid.NewGuid():N}"
        );
        var crear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, $"Presupuesto listado {Guid.NewGuid():N}")
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);

        var respuesta = await client.GetAsync("/api/Presupuestos/ListarPresupuestos");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        Assert.Equal(JsonValueKind.Array, valores.ValueKind);
        Assert.True(valores.EnumerateArray().Any(), "Debe haber al menos un presupuesto");
    }

    [Fact]
    public async Task TC_PRE_04_ObtenerPresupuestoIdInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync(
            "/api/Presupuestos/ObtenerPresupuestoPorId?idPresupuesto=999999"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(
            "No existe un presupuesto con el Id 999999",
            doc.RootElement.GetProperty("error").GetString()
        );
    }

    [Fact]
    public async Task TC_PRE_05_ObtenerPresupuestosPorClienteSinDatos_Devuelve404()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente sin presupuestos {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idCliente = await ObtenerIdClientePorNombreAsync(nombre);

        var respuesta = await client.GetAsync(
            $"/api/Presupuestos/ObtenerPresupuestosPorCliente?idCliente={idCliente}"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        Assert.Equal(
            $"No se encontraron presupuestos para el cliente con ID {idCliente}.",
            await respuesta.Content.ReadAsStringAsync()
        );
    }

    [Fact]
    public async Task TC_PRE_06_AceptarPresupuesto_CambiaEstadoAAceptado()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"aceptar {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto aceptar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdPresupuestoPorTituloAsync(titulo);

        var respuesta = await client.PatchAsync(
            $"/api/Presupuestos/AceptarPresupuesto?idPresupuesto={id}",
            null
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var presupuesto = await contexto.Presupuestos.FindAsync(id);
        Assert.Equal(EstadoPresupuesto.Aceptado, presupuesto.Estado);
    }

    [Fact]
    public async Task TC_PRE_07_RechazarPresupuesto_CambiaEstadoARechazado()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"rechazar {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto rechazar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdPresupuestoPorTituloAsync(titulo);

        var respuesta = await client.PatchAsync(
            $"/api/Presupuestos/RechazarPresupuesto?idPresupuesto={id}",
            null
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var presupuesto = await contexto.Presupuestos.FindAsync(id);
        Assert.Equal(EstadoPresupuesto.Rechazado, presupuesto.Estado);
    }

    [Fact]
    public async Task TC_PRE_08_ActualizarPresupuesto_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"actualizar {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto actualizar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdPresupuestoPorTituloAsync(titulo);
        var tituloNuevo = $"{titulo} - modificado";

        // El servicio ActualizarPresupuesto usa entidad.HorasEstimadas!.Value y
        // entidad.Titulo! sin validar: el body debe traer los campos no-nullable
        // (400/500 si faltan). Materiales: [] evita el binding requerido.
        var respuesta = await client.PatchAsJsonAsync(
            $"/api/Presupuestos/ActualizarPresupuesto?idPresupuesto={id}",
            new
            {
                titulo = tituloNuevo,
                descripcion = "Descripción modificada",
                horasEstimadas = 3.0,
                idCliente,
                materiales = Array.Empty<object>(),
            }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(
            "Presupuesto modificado correctamente",
            await respuesta.Content.ReadAsStringAsync()
        );
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var presupuesto = await contexto.Presupuestos.FindAsync(id);
        Assert.Equal(tituloNuevo, presupuesto.Titulo);
    }

    [Fact]
    public async Task TC_PRE_09_EliminarPresupuesto_Devuelve200YPosterior404()
    {
        var (client, idCliente) = await CrearClienteBaseAsync(
            $"eliminar presupuesto {Guid.NewGuid():N}"
        );
        var titulo = $"Presupuesto eliminar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Presupuestos/CrearPresupuesto",
            CrearPresupuestoBody(idCliente, titulo)
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdPresupuestoPorTituloAsync(titulo);

        var respuesta = await client.DeleteAsync(
            $"/api/Presupuestos/EliminarPresupuesto?idPresupuesto={id}"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(
            "Presupuesto eliminado correctamente.",
            await respuesta.Content.ReadAsStringAsync()
        );

        var posterior = await client.GetAsync(
            $"/api/Presupuestos/ObtenerPresupuestoPorId?idPresupuesto={id}"
        );
        Assert.Equal(HttpStatusCode.NotFound, posterior.StatusCode);
    }

    [Fact]
    public async Task TC_PRE_10_ObtenerCostoHoraDeTrabajo_Devuelve200()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync(
            "/api/Presupuestos/ObtenerCostoHoraDeTrabajo"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var costo = decimal.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(costo >= 0, "El costo hora debe ser un decimal no negativo");
    }

    [Fact]
    public async Task TC_PRE_11_ActualizarCostoHora_PersisteElNuevoValor()
    {
        using var client = CrearClienteAutenticado();

        var actualizar = await client.PatchAsync(
            "/api/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto=150",
            null
        );

        Assert.Equal(HttpStatusCode.OK, actualizar.StatusCode);
        // El endpoint serializa decimal como "150.0" (JSON), no "150". Parseo con
        // InvariantCulture: el runner usa es-AR donde "." es separador de miles.
        Assert.Equal(150m, decimal.Parse(await actualizar.Content.ReadAsStringAsync(), CultureInfo.InvariantCulture));

        var obtener = await client.GetAsync(
            "/api/Presupuestos/ObtenerCostoHoraDeTrabajo"
        );
        Assert.Equal(HttpStatusCode.OK, obtener.StatusCode);
        Assert.Equal(150m, decimal.Parse(await obtener.Content.ReadAsStringAsync(), CultureInfo.InvariantCulture));
    }
}
