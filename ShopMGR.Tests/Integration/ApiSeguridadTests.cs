using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ShopMGR.Tests.Integration;

/// <summary>
/// TC-AUTH-06/07 (contrato JWT) + login incorrecto/correcto. 2 logins en
/// esta clase (límite 5/min).
/// </summary>
public class ApiSeguridadTests : ApiTestsBase
{
    public ApiSeguridadTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_AUTH_06_EndpointProtegidoSinToken_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.GetAsync("/api/Auth");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task TC_AUTH_07_EndpointProtegidoConTokenValido_Devuelve200()
    {
        using var client = CrearClienteAutenticado();

        var respuesta = await client.GetAsync("/api/Auth");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Autenticado", await respuesta.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task LoginContrasenaIncorrecta_Devuelve400()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = Claves.AdminUsername, password = "incorrecta" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal(
            "Nombre de usuario o contraseña incorrectos",
            await respuesta.Content.ReadAsStringAsync()
        );
    }

    [Fact]
    public async Task LoginCorrecto_Devuelve200ConJwt()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = Claves.AdminUsername, password = Claves.AdminPassword }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var accessToken = doc.RootElement.GetProperty("accessToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(accessToken));
    }
}

/// <summary>
/// TC-EXP-02 (rate limit login 429). Factory propio y aislado: el 6º
/// IniciarSesion en 1 min desde la misma IP (127.0.0.1 en TestServer)
/// debe ser rechazado con 429 — docs/qa test-cases.md R1.
/// </summary>
public class ApiRateLimitTests : IDisposable
{
    private readonly ShopMGRWebApplicationFactory _factory = new();

    public void Dispose()
    {
        _factory.Dispose();
        GC.SuppressFinalize(this);
    }

    [Fact]
    public async Task TC_EXP_02_SextoLoginEnUnMinuto_Devuelve429()
    {
        using var client = _factory.CreateClient();
        HttpStatusCode? ultimoStatus = null;
        string? ultimoBody = null;

        for (var i = 0; i < 6; i++)
        {
            var respuesta = await client.PostAsJsonAsync(
                "/api/Auth/IniciarSesion",
                new { userName = Claves.AdminUsername, password = Claves.AdminPassword }
            );
            ultimoStatus = respuesta.StatusCode;
            ultimoBody = await respuesta.Content.ReadAsStringAsync();
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, ultimoStatus);
        using var doc = JsonDocument.Parse(ultimoBody!);
        Assert.Equal(
            "Demasiados intentos de inicio de sesión, inténtelo de nuevo en unos minutos",
            doc.RootElement.GetProperty("error").GetString()
        );
    }
}
