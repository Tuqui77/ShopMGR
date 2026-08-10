using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests.Integration;

/// <summary>
/// TC-AUTH-01..05 (login). Máximo 5 llamadas a IniciarSesion por clase
/// (límite rate limiter: 5/min por IP — docs/qa test-cases.md R1).
/// </summary>
public class ApiAuthTests : ApiTestsBase
{
    public ApiAuthTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_AUTH_01_LoginValido_DevuelveJwtYCookieRefresh()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = Claves.AdminUsername, password = Claves.AdminPassword }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var accessToken = doc.RootElement.GetProperty("accessToken").GetString();
        Assert.False(string.IsNullOrWhiteSpace(accessToken), "accessToken no debe estar vacío");
        Assert.False(doc.RootElement.GetProperty("requiereCambioContraseña").GetBoolean());
        Assert.False(
            doc.RootElement.TryGetProperty("refreshToken", out _),
            "refreshToken debe estar ausente del body ([JsonIgnore])"
        );

        var setCookie = string.Join(
            "; ",
            respuesta.Headers.GetValues("Set-Cookie")
        );
        Assert.Contains("refreshToken=", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("HttpOnly", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("SameSite=Strict", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Path=/api/Auth", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Expires=", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TC_AUTH_02_LoginContrasenaIncorrecta_Devuelve400()
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
    public async Task TC_AUTH_03_LoginUsuarioInexistente_Devuelve400ConMismoMensaje()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = "no-existe-xyz", password = Claves.AdminPassword }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal(
            "Nombre de usuario o contraseña incorrectos",
            await respuesta.Content.ReadAsStringAsync()
        );
    }

    [Fact]
    public async Task TC_AUTH_04_LoginBodyMalformado_Devuelve400()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = Claves.AdminUsername }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("title", out _), "Debe ser ProblemDetails");
    }

    [Fact]
    public async Task TC_AUTH_05_LoginBodyVacio_Devuelve400()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsJsonAsync("/api/Auth/IniciarSesion", new { });

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.TryGetProperty("title", out _), "Debe ser ProblemDetails");
    }
}

/// <summary>
/// TC-AUTH-08..11 (refresh/logout). 3 logins en esta clase (límite 5/min).
/// </summary>
public class ApiAuthRefreshTests : ApiTestsBase
{
    public ApiAuthRefreshTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    private async Task<HttpResponseMessage> LoginAsync(HttpClient client) =>
        await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName = Claves.AdminUsername, password = Claves.AdminPassword }
        );

    [Fact]
    public async Task TC_AUTH_08_RefrescarSinCookie_Devuelve401()
    {
        using var client = Factory.CreateClient();

        var respuesta = await client.PostAsync("/api/Auth/Refrescar", null);

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task TC_AUTH_09_RefrescarConCookieValida_RotaElToken()
    {
        using var client = Factory.CreateClient();
        var login = await LoginAsync(client);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var setCookieOriginal = string.Join("; ", login.Headers.GetValues("Set-Cookie"));

        var respuesta = await client.PostAsync("/api/Auth/Refrescar", null);

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        using var doc = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var accessTokenNuevo = doc.RootElement.GetProperty("accessToken").GetString();
        // El accessToken puede ser byte-idéntico si login y refresh ocurren en el
        // mismo segundo (misma exp, sin jti). La rotación observable es la cookie.
        Assert.False(string.IsNullOrEmpty(accessTokenNuevo));

        var setCookieNuevo = string.Join("; ", respuesta.Headers.GetValues("Set-Cookie"));
        Assert.Contains("refreshToken=", setCookieNuevo, StringComparison.OrdinalIgnoreCase);
        Assert.NotEqual(setCookieOriginal, setCookieNuevo);
        Assert.Contains("HttpOnly", setCookieNuevo, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Path=/api/Auth", setCookieNuevo, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TC_AUTH_10_CerrarSesion_BorraLaCookie()
    {
        using var client = Factory.CreateClient();
        var login = await LoginAsync(client);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var setCookieOriginal = string.Join("; ", login.Headers.GetValues("Set-Cookie"));

        var respuesta = await client.PostAsync("/api/Auth/CerrarSesion", null);

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal(
            "Sesión cerrada correctamente",
            await respuesta.Content.ReadAsStringAsync()
        );
        var setCookieBorrado = string.Join("; ", respuesta.Headers.GetValues("Set-Cookie"));
        Assert.Contains("refreshToken=", setCookieBorrado, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Path=/api/Auth", setCookieBorrado, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("HttpOnly", setCookieBorrado, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Expires=", setCookieBorrado, StringComparison.OrdinalIgnoreCase);
        var valorOriginal = ExtraerCookieRefresh(login);
        var valorBorrado = ExtraerCookieRefresh(respuesta);
        Assert.NotEqual(valorOriginal, valorBorrado);
    }

    [Fact]
    public async Task TC_AUTH_11_RefreshTokenRevocado_Devuelve401()
    {
        using var client = Factory.CreateClient(
            new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                HandleCookies = false,
            }
        );
        var login = await LoginAsync(client);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookieVieja = ExtraerCookieRefresh(login);
        var accessToken = JsonDocument
            .Parse(await login.Content.ReadAsStringAsync())
            .RootElement.GetProperty("accessToken")
            .GetString();

        var cerrarSesion = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/CerrarSesion");
        cerrarSesion.Headers.TryAddWithoutValidation("Cookie", $"refreshToken={cookieVieja}");
        cerrarSesion.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var respuestaLogout = await client.SendAsync(cerrarSesion);
        Assert.Equal(HttpStatusCode.OK, respuestaLogout.StatusCode);

        var refrescar = new HttpRequestMessage(HttpMethod.Post, "/api/Auth/Refrescar");
        refrescar.Headers.TryAddWithoutValidation("Cookie", $"refreshToken={cookieVieja}");
        var respuesta = await client.SendAsync(refrescar);

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        Assert.Equal(
            "Refresh Token inválido",
            await respuesta.Content.ReadAsStringAsync()
        );
    }
}

/// <summary>
/// TC-AUTH-12 (registro nuevo). 1 registro + 1 login de verificación
/// (límite registro: 1/min por IP).
/// </summary>
public class ApiRegistroTests : ApiTestsBase
{
    public ApiRegistroTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_AUTH_12_RegistroUsuarioNuevo_Devuelve200YPersiste()
    {
        using var client = Factory.CreateClient();
        var userName = $"nuevo_{Guid.NewGuid():N}";

        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/RegistrarUsuario",
            new { userName, password = "Passw0rd!" }
        );

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        Assert.Equal("Usuario creado con exito", await respuesta.Content.ReadAsStringAsync());

        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            var usuario = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
                .FirstOrDefaultAsync(contexto.Usuarios, u => u.UserName == userName);
            Assert.NotNull(usuario);
        }

        var login = await client.PostAsJsonAsync(
            "/api/Auth/IniciarSesion",
            new { userName, password = "Passw0rd!" }
        );
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }
}

/// <summary>
/// TC-AUTH-13 (registro duplicado). El usuario duplicado se siembra por BD
/// para hacer una sola llamada a RegistrarUsuario (límite 1/min).
/// </summary>
public class ApiRegistroDuplicadoTests : ApiTestsBase
{
    public ApiRegistroDuplicadoTests(ShopMGRWebApplicationFactory factory)
        : base(factory) { }

    [Fact]
    public async Task TC_AUTH_13_RegistroUsuarioDuplicado_Devuelve400()
    {
        var userName = $"dup_{Guid.NewGuid():N}";
        using (var scope = Factory.Services.CreateScope())
        {
            var contexto = scope.ServiceProvider.GetRequiredService<ShopMGRDbContexto>();
            contexto.Usuarios.Add(new Usuario { UserName = userName, PasswordHash = "x" });
            await contexto.SaveChangesAsync();
        }

        using var client = Factory.CreateClient();
        var respuesta = await client.PostAsJsonAsync(
            "/api/Auth/RegistrarUsuario",
            new { userName, password = "Passw0rd!" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal(
            "El nombre de usuario ya esta en uso",
            await respuesta.Content.ReadAsStringAsync()
        );
    }
}
