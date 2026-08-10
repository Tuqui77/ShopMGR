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
/// TC-TRA-01..13 (CRUD trabajos + transiciones de estado). Usa el token
/// compartido (0 logins propios). TC-TRA-07 (estado sin datos) corre en
/// ApiTrabajosEstadoVaciosTests con BD fresca.
/// </summary>
public class ApiTrabajosTests : ApiTestsBase, IAsyncLifetime
{
    private const decimal CostoHoraSeed = 100m;

    public ApiTrabajosTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    // Seed idempotente de ValorHoraDeTrabajo: AgregarHorasDeTrabajo en un trabajo
    // sin presupuesto requiere ObtenerCostoHoraDeTrabajo configurado (404 si falta).
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

    private async Task<(HttpClient client, int idCliente)> CrearClienteYClienteAsync(
        string sufijo
    )
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

    [Fact]
    public async Task TC_TRA_01_CrearTrabajoValido_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"trabajo {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, estado = EstadoTrabajo.Pendiente.ToString() }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var persistido = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
        Assert.NotNull(persistido);
        Assert.True(persistido.Id > 0);
        Assert.Equal(EstadoTrabajo.Pendiente, persistido.Estado);
    }

    [Fact]
    public async Task TC_TRA_02_CrearTrabajoSinTitulo_Devuelve400()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"trabajo sin titulo {Guid.NewGuid():N}"
        );

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { idCliente }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("title", out _), "Debe ser ProblemDetails");
    }

    [Fact]
    public async Task TC_TRA_03_CrearTrabajoSinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo = $"Sin token {Guid.NewGuid():N}", idCliente = 1 }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task TC_TRA_04_ListarTrabajos_DevuelveArrayConElCreado()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"listar trabajo {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo listado {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);

        var respuesta = await client.GetAsync("/api/Trabajos/ObtenerListaTrabajos");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        Assert.Equal(JsonValueKind.Array, valores.ValueKind);
        var titulos = valores
            .EnumerateArray()
            .Select(item =>
                item.TryGetProperty("titulo", out var t) ? t.GetString() : null
            )
            .ToList();
        Assert.Contains(titulo, titulos);
    }

    [Fact]
    public async Task TC_TRA_05_ObtenerTrabajoIdInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync(
            "/api/Trabajos/ObtenerTrabajoPorId?idTrabajo=999999"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(
            "No existe un trabajo con el Id 999999",
            doc.RootElement.GetProperty("error").GetString()
        );
    }

    [Fact]
    public async Task TC_TRA_06_ObtenerTrabajosPorClienteSinDatos_Devuelve404()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente sin trabajos {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idCliente = await ObtenerIdClientePorNombreAsync(nombre);

        var respuesta = await client.GetAsync(
            $"/api/Trabajos/ObtenerTrabajosPorCliente?idCliente={idCliente}"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        Assert.Equal(
            $"No se encontraron trabajos para el cliente con ID {idCliente}.",
            await respuesta.Content.ReadAsStringAsync()
        );
    }

    [Fact]
    public async Task TC_TRA_08_IniciarTrabajo_CambiaEstadoAIniciado()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"iniciar {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo iniciar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente, estado = EstadoTrabajo.Pendiente.ToString() }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idTrabajo = await ObtenerIdTrabajoPorTituloAsync(titulo);

        var respuesta = await client.PatchAsync(
            $"/api/Trabajos/IniciarTrabajo?idTrabajo={idTrabajo}",
            null
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(
            $"Trabajo #{idTrabajo} marcado como iniciado.",
            await respuesta.Content.ReadAsStringAsync()
        );
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var trabajo = await contexto.Trabajos.FindAsync(idTrabajo);
        Assert.Equal(EstadoTrabajo.Iniciado, trabajo.Estado);
    }

    [Fact]
    public async Task TC_TRA_09_TerminarTrabajo_CambiaEstadoATerminado()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"terminar {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo terminar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idTrabajo = await ObtenerIdTrabajoPorTituloAsync(titulo);

        // TerminarTrabajo persiste un MovimientoBalance con TotalLabor.Value:
        // el trabajo necesita horas para que TotalLabor no sea null (400 si falta).
        var horas = await client.PostAsJsonAsync(
            "/api/Trabajos/AgregarHorasDeTrabajo",
            new
            {
                horas = 2.5,
                descripcion = "Horas para terminar",
                fecha = "2026-08-09",
                idTrabajo,
            }
        );
        Assert.Equal(HttpStatusCode.OK, horas.StatusCode);

        var respuesta = await client.PatchAsync(
            $"/api/Trabajos/TerminarTrabajo?idTrabajo={idTrabajo}",
            null
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(
            $"Trabajo #{idTrabajo} marcado como terminado.",
            await respuesta.Content.ReadAsStringAsync()
        );
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var trabajo = await contexto.Trabajos.FindAsync(idTrabajo);
        Assert.Equal(EstadoTrabajo.Terminado, trabajo.Estado);
    }

    [Fact]
    public async Task TC_TRA_10_ModificarTrabajo_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"modificar trabajo {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo modificar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idTrabajo = await ObtenerIdTrabajoPorTituloAsync(titulo);
        var descripcionNueva = $"Descripción modificada {Guid.NewGuid():N}";

        // ModificarTrabajo.Titulo es string no-nullable: omitirlo provoca 400 de
        // validación automática del binding, nunca llega al controller.
        var respuesta = await client.PatchAsJsonAsync(
            $"/api/Trabajos/ModificarTrabajo?idTrabajo={idTrabajo}",
            new
            {
                titulo,
                descripcion = descripcionNueva,
                idCliente,
                estado = EstadoTrabajo.Pendiente.ToString(),
            }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Trabajo actualizado correctamente.", await respuesta.Content.ReadAsStringAsync());
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var trabajo = await contexto.Trabajos.FindAsync(idTrabajo);
        Assert.Equal(descripcionNueva, trabajo.Descripcion);
    }

    [Fact]
    public async Task TC_TRA_11_AgregarHorasDeTrabajo_Devuelve200YPersiste()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"horas {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo horas {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idTrabajo = await ObtenerIdTrabajoPorTituloAsync(titulo);

        var respuesta = await client.PostAsJsonAsync(
            "/api/Trabajos/AgregarHorasDeTrabajo",
            new
            {
                horas = 2.5,
                descripcion = "Horas de prueba",
                fecha = "2026-08-09",
                idTrabajo,
            }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var body = await respuesta.Content.ReadAsStringAsync();
        Assert.Contains(
            $"horas de trabajo agregadas al trabajo con ID {idTrabajo} correctamente.",
            body
        );
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var horas = await contexto.HorasYDescripcion.FirstOrDefaultAsync(h =>
            h.IdTrabajo == idTrabajo
        );
        Assert.NotNull(horas);
        Assert.Equal(2.5f, horas.Horas);
    }

    [Fact]
    public async Task TC_TRA_12_EliminarTrabajo_Devuelve200YPosterior404()
    {
        var (client, idCliente) = await CrearClienteYClienteAsync(
            $"eliminar trabajo {Guid.NewGuid():N}"
        );
        var titulo = $"Trabajo eliminar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Trabajos/CrearTrabajo",
            new { titulo, idCliente }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var idTrabajo = await ObtenerIdTrabajoPorTituloAsync(titulo);

        var respuesta = await client.DeleteAsync(
            $"/api/Trabajos/EliminarTrabajo?idTrabajo={idTrabajo}"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Trabajo eliminado correctamente.", await respuesta.Content.ReadAsStringAsync());

        var posterior = await client.GetAsync(
            $"/api/Trabajos/ObtenerTrabajoPorId?idTrabajo={idTrabajo}"
        );
        Assert.Equal(HttpStatusCode.NotFound, posterior.StatusCode);
    }

    [Fact]
    public async Task TC_TRA_13_EliminarTrabajoInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.DeleteAsync("/api/Trabajos/EliminarTrabajo?idTrabajo=999999");

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
    }
}

/// <summary>
/// TC-TRA-07 (trabajos por estado sin datos) — requiere BD fresca (sin
/// trabajos Terminado), por eso va en su propia clase con su propio factory.
/// </summary>
public class ApiTrabajosEstadoVaciosTests : ApiTestsBase
{
    public ApiTrabajosEstadoVaciosTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_TRA_07_ObtenerTrabajosPorEstadoSinDatos_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync(
            $"/api/Trabajos/ObtenerTrabajosPorEstado?estado={EstadoTrabajo.Terminado}"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        Assert.Equal(
            $"No se encontro ningun trabajo {EstadoTrabajo.Terminado}.",
            await respuesta.Content.ReadAsStringAsync()
        );
    }
}
