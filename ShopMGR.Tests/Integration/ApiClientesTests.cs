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
/// TC-CLI-01..15 (CRUD clientes). Usa el token compartido (0 logins propios).
/// TC-CLI-06 (lista vacía) corre en ApiClientesVaciosTests con BD fresca.
/// </summary>
public class ApiClientesTests : ApiTestsBase
{
    public ApiClientesTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_CLI_01_CrearClienteValido_Devuelve200YPersiste()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente {Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre, cuit = "20-12345678-9" }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(nombre, doc.RootElement.GetProperty("nombreCompleto").GetString());

        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var persistido = await contexto.Clientes.FirstOrDefaultAsync(c =>
            c.NombreCompleto == nombre
        );
        Assert.NotNull(persistido);
        Assert.True(persistido.Id > 0);
    }

    [Fact]
    public async Task TC_CLI_02_CrearClienteSinNombre_Devuelve400()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { cuit = "20-12345678-9" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("title", out _), "Debe ser ProblemDetails");
    }

    [Fact]
    public async Task TC_CLI_03_CrearClienteNombreDuplicado_Devuelve400()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente dup {Guid.NewGuid():N}";
        var primero = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, primero.StatusCode);

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(
            $"Ya existe un cliente llamado {nombre}",
            doc.RootElement.GetProperty("error").GetString()
        );
    }

    [Fact]
    public async Task TC_CLI_04_CrearClienteSinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = $"Sin token {Guid.NewGuid():N}" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task TC_CLI_05_ListarClientes_DevuelveArrayConLosCreados()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente listado {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerListaClientes");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var valores = LeerValores(doc.RootElement);
        Assert.Equal(JsonValueKind.Array, valores.ValueKind);
        var nombres = valores
            .EnumerateArray()
            .Select(item =>
                item.TryGetProperty("nombreCompleto", out var n) ? n.GetString() : null
            )
            .ToList();
        Assert.Contains(nombre, nombres);
    }

    [Fact]
    public async Task TC_CLI_07_ObtenerClienteIdInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync(
            "/api/Cliente/ObtenerClientePorId?idCliente=999999"
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(
            "No se encontró un cliente con el ID 999999.",
            doc.RootElement.GetProperty("error").GetString()
        );
    }

    [Fact]
    public async Task TC_CLI_08_ObtenerDetalle_DevuelveDireccionesYTelefonos()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente detalle {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new
            {
                nombreCompleto = nombre,
                direccion = new[]
                {
                    new
                    {
                        calle = "Av. Siempreviva",
                        altura = "742",
                        ciudad = "Springfield",
                    },
                },
                telefono = new[] { new { telefono = "011-5555-1234" } },
            }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdClientePorNombreAsync(nombre);

        var respuesta = await client.GetAsync(
            $"/api/Cliente/ObtenerDetallePorId?idCliente={id}"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var direccion = LeerValores(doc.RootElement.GetProperty("direccion"));
        Assert.Equal(JsonValueKind.Array, direccion.ValueKind);
        Assert.True(
            direccion.EnumerateArray().Any(),
            "El cliente debe tener al menos una dirección persistida"
        );
        var telefono = LeerValores(doc.RootElement.GetProperty("telefono"));
        Assert.Equal(JsonValueKind.Array, telefono.ValueKind);
        Assert.True(
            telefono.EnumerateArray().Any(),
            "El cliente debe tener al menos un teléfono persistido"
        );
    }

    [Fact]
    public async Task TC_CLI_09_BuscarClientePorNombreExacto_Devuelve200()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente Busqueda {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);

        var respuesta = await client.GetAsync(
            $"/api/Cliente/ObtenerClientePorNombre?nombre={Uri.EscapeDataString(nombre)}"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(nombre, doc.RootElement.GetProperty("nombreCompleto").GetString());
    }

    [Fact]
    public async Task TC_CLI_10_BuscarClienteNombreVacio_Devuelve400()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerClientePorNombre?nombre=");

        // ?nombre= no enlaza (query vacío → null): la validación automática del
        // binding devuelve 400 ProblemDetails antes de llegar al check del controller.
        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("type", out _));
    }

    [Fact]
    public async Task TC_CLI_11_ModificarClienteExistente_Devuelve200YPersiste()
    {
        using var client = CrearClienteAutenticado();
        var nombreOriginal = $"Cliente modificar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombreOriginal }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdClientePorNombreAsync(nombreOriginal);
        var nombreNuevo = $"{nombreOriginal} - editado";

        var respuesta = await client.PatchAsJsonAsync(
            $"/api/Cliente/ModificarCliente?idCliente={id}",
            new { nombreCompleto = nombreNuevo, cuit = "20-99999999-9" }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Cliente actualizado correctamente.", await respuesta.Content.ReadAsStringAsync());

        var obtener = await client.GetAsync(
            $"/api/Cliente/ObtenerClientePorId?idCliente={id}"
        );
        using var doc = JsonDocument.Parse(await obtener.Content.ReadAsStringAsync());
        Assert.Equal(nombreNuevo, doc.RootElement.GetProperty("nombreCompleto").GetString());
    }

    [Fact]
    public async Task TC_CLI_12_ModificarClienteInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.PatchAsJsonAsync(
            "/api/Cliente/ModificarCliente?idCliente=999999",
            new { nombreCompleto = "Nadie" }
        );

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.Equal(
            "No se encontró un cliente con el ID 999999.",
            doc.RootElement.GetProperty("error").GetString()
        );
    }

    [Fact]
    public async Task TC_CLI_13_EliminarClienteExistente_Devuelve200YPosterior404()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente eliminar {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdClientePorNombreAsync(nombre);

        var respuesta = await client.DeleteAsync(
            $"/api/Cliente/EliminarCliente?idCliente={id}"
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Cliente eliminado correctamente.", await respuesta.Content.ReadAsStringAsync());

        var posterior = await client.GetAsync(
            $"/api/Cliente/ObtenerClientePorId?idCliente={id}"
        );
        Assert.Equal(HttpStatusCode.NotFound, posterior.StatusCode);
    }

    [Fact]
    public async Task TC_CLI_14_EliminarClienteInexistente_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.DeleteAsync("/api/Cliente/EliminarCliente?idCliente=999999");

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
    }

    [Fact]
    public async Task TC_CLI_15_CrearMovimiento_ReflejaElBalance()
    {
        using var client = CrearClienteAutenticado();
        var nombre = $"Cliente balance {Guid.NewGuid():N}";
        var crear = await client.PostAsJsonAsync(
            "/api/Cliente/CrearCliente",
            new { nombreCompleto = nombre }
        );
        Assert.Equal(HttpStatusCode.OK, crear.StatusCode);
        var id = await ObtenerIdClientePorNombreAsync(nombre);

        var antes = await client.GetAsync($"/api/Cliente/ObtenerClientePorId?idCliente={id}");
        using var docAntes = JsonDocument.Parse(await antes.Content.ReadAsStringAsync());
        var balanceAntes = docAntes.RootElement.GetProperty("balance").GetDecimal();

        var monto = 150.50m;
        var movimiento = await client.PostAsJsonAsync(
            "/api/Cliente/CrearMovimiento",
            new
            {
                monto,
                descripcion = "Movimiento de prueba",
                fecha = "2026-08-09",
                tipo = TipoMovimiento.Pago.ToString(),
                idCliente = id,
            }
        );
        Assert.Equal(HttpStatusCode.OK, movimiento.StatusCode);

        var despues = await client.GetAsync($"/api/Cliente/ObtenerClientePorId?idCliente={id}");
        using var docDespues = JsonDocument.Parse(await despues.Content.ReadAsStringAsync());
        var balanceDespues = docDespues.RootElement.GetProperty("balance").GetDecimal();
        Assert.Equal(balanceAntes + monto, balanceDespues);
    }
}

/// <summary>
/// TC-CLI-06 (lista sin datos) — requiere BD fresca (sin clientes),
/// por eso va en su propia clase con su propio factory.
/// </summary>
public class ApiClientesVaciosTests : ApiTestsBase
{
    public ApiClientesVaciosTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_CLI_06_ListarClientesSinDatos_Devuelve404()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync("/api/Cliente/ObtenerListaClientes");

        Assert.Equal(HttpStatusCode.NotFound, respuesta.StatusCode);
        Assert.Equal("No se encontraron clientes.", await respuesta.Content.ReadAsStringAsync());
    }
}
