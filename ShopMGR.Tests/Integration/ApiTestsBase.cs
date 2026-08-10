using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Contexto;
using Xunit;

namespace ShopMGR.Tests.Integration;

/// <summary>
/// Helpers compartidos de la suite de integración (docs/qa v1.0, issue #82).
/// Cada clase de tests crea SU PROPIO WebApplicationFactory => host, BD y
/// rate limiter independientes. El token compartido usa un factory aislado
/// para no consumir la cuota de login (5/min) de ninguna clase.
/// </summary>
public abstract class ApiTestsBase : IClassFixture<ShopMGRWebApplicationFactory>
{
    protected readonly ShopMGRWebApplicationFactory Factory;

    protected ApiTestsBase(ShopMGRWebApplicationFactory factory)
    {
        Factory = factory;
    }

    protected HttpClient CrearClienteAutenticado()
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            TokenCompartido.Value
        );
        return client;
    }

    // ----- JSON helpers ($id/$values por ReferenceHandler.IgnoreCycles) -----

    protected static JsonElement LeerValores(JsonElement root)
    {
        if (
            root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("$values", out var valores)
        )
            return valores;
        return root;
    }

    protected static JsonElement ObtenerPropiedad(JsonElement elemento, string nombre)
    {
        var existe = elemento.TryGetProperty(nombre, out var propiedad);
        Assert.True(existe, $"La propiedad '{nombre}' no existe en la respuesta.");
        return propiedad;
    }

    protected static string ExtraerCookieRefresh(HttpResponseMessage respuesta)
    {
        var setCookie = respuesta.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? string.Join("; ", cookies)
            : "";
        var prefijo = "refreshToken=";
        var inicio = setCookie.IndexOf(prefijo, StringComparison.OrdinalIgnoreCase);
        Assert.True(
            inicio >= 0,
            $"No se encontró la cookie refreshToken en Set-Cookie: {setCookie}"
        );
        inicio += prefijo.Length;
        var fin = setCookie.IndexOf(';', inicio);
        fin = fin < 0 ? setCookie.Length : fin;
        return setCookie[inicio..fin];
    }

    // ----- Acceso a BD para resolver IDs (Crear* devuelve el DTO, sin Id) -----

    protected async Task<int> ObtenerIdClientePorNombreAsync(string nombreCompleto)
    {
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var cliente = await contexto.Clientes.FirstOrDefaultAsync(c =>
            c.NombreCompleto == nombreCompleto
        );
        Assert.NotNull(cliente);
        return cliente.Id;
    }

    protected async Task<int> ObtenerIdTrabajoPorTituloAsync(string titulo)
    {
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var trabajo = await contexto.Trabajos.FirstOrDefaultAsync(t => t.Titulo == titulo);
        Assert.NotNull(trabajo);
        return trabajo.Id;
    }

    protected async Task<int> ObtenerIdPresupuestoPorTituloAsync(string titulo)
    {
        using var scope = Factory.Services.CreateScope();
        var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
        var presupuesto = await contexto.Presupuestos.FirstOrDefaultAsync(p =>
            p.Titulo == titulo
        );
        Assert.NotNull(presupuesto);
        return presupuesto.Id;
    }
}

/// <summary>
/// Un único login contra un factory aislado (el Lazy garantiza una sola
/// llamada a IniciarSesion en todo el proceso de test).
/// </summary>
internal static class TokenCompartido
{
    private static readonly Lazy<string> AccessToken = new(() =>
    {
        using var factory = new ShopMGRWebApplicationFactory();
        using var client = factory.CreateClient();
        var respuesta = client
            .PostAsJsonAsync(
                "/api/Auth/IniciarSesion",
                new { userName = Claves.AdminUsername, password = Claves.AdminPassword }
            )
            .GetAwaiter()
            .GetResult();
        Assert.Equal(System.Net.HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(
            respuesta.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        );
        return doc.RootElement.GetProperty("accessToken").GetString()!;
    });

    public static string Value => AccessToken.Value;
}
