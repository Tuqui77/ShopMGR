using System.Globalization;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Fido2NetLib;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Modelo;
using ShopMGR.WebApi.Controllers;
using Xunit;

namespace ShopMGR.Tests;

/// <summary>
/// Tests del contrato de migración de RefreshToken a cookie HttpOnly (#114 SEV-001).
///
/// Contrato esperado (definido por QA, no necesariamente lo que hace el código actual):
/// - La cookie se emite con Path=/api/Auth, HttpOnly, SameSite=Strict y Secure según config.
/// - El borrado (CerrarSesion) usa los MISMOS CookieOptions que la creación; si no,
///   el navegador no matchea la cookie original y el logout no la elimina.
/// - El body JSON de RespuestaLogin NO expone RefreshToken ([JsonIgnore]).
///
/// Si un test falla contra la implementación actual, es un bug a reportar, no un test roto.
/// </summary>
public class AuthControllerTests
{
    private const string NombreCookie = "refreshToken";
    private const string PathEsperado = "/api/Auth";

    // ─────────────────────── Helpers ───────────────────────

    private static (
        AuthController Controller,
        DefaultHttpContext HttpContext
    ) CrearController(
        Mock<IAdministrarAuth> authMock,
        Mock<IAdministracionPasskeys> passkeysMock,
        bool secure,
        bool conCookieRefresh,
        string? idUsuario = null
    )
    {
        var configuracion = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Auth:RefreshTokenCookie.Secure"] = secure ? "true" : "false",
                }
            )
            .Build();

        var controller = new AuthController(
            authMock.Object,
            passkeysMock.Object,
            new Mock<IFido2>().Object,
            configuracion
        );

        var httpContext = new DefaultHttpContext();
        if (conCookieRefresh)
            httpContext.Request.Headers["Cookie"] = $"{NombreCookie}=token-viejo";

        if (idUsuario != null)
        {
            httpContext.User = new ClaimsPrincipal(
                new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, idUsuario)],
                    authenticationType: "Test"
                )
            );
        }

        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        return (controller, httpContext);
    }

    private static Dictionary<string, string> ParsearSetCookie(string setCookie)
    {
        var atributos = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (
            var parte in setCookie.Split(
                ';',
                StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries
            )
        )
        {
            var indiceIgual = parte.IndexOf('=');
            if (indiceIgual < 0)
                atributos[parte] = "true"; // atributo booleano: secure / httponly
            else
                atributos[parte[..indiceIgual].Trim()] = parte[(indiceIgual + 1)..].Trim();
        }

        return atributos;
    }

    private static Dictionary<string, string> ObtenerCookieDeRespuesta(
        DefaultHttpContext httpContext
    )
    {
        var setCookie = httpContext.Response.Headers["Set-Cookie"];
        setCookie.Count.Should().BeGreaterThan(0, "se esperaba una cookie de respuesta");
        return ParsearSetCookie(setCookie.ToString());
    }

    private static void VerificarAtributosCookie(
        Dictionary<string, string> cookie,
        string valorEsperado,
        bool secure,
        string pathEsperado = PathEsperado
    )
    {
        cookie[NombreCookie].Should().Be(valorEsperado);
        cookie["httponly"].Should().Be("true", "el refresh token debe viajar solo en cookie HttpOnly");
        cookie["samesite"].Should().Be("strict", "la cookie debe restringirse al mismo sitio");
        cookie["path"].Should().Be(pathEsperado, $"la cookie debe viajar solo a {pathEsperado}");
        cookie
            .ContainsKey("secure")
            .Should()
            .Be(secure, "Secure debe reflejar Auth:RefreshTokenCookie.Secure de la config");
    }

    private static void VerificarExpiracion(
        Dictionary<string, string> cookie,
        DateTimeOffset esperado
    )
    {
        var expira = DateTimeOffset.ParseExact(
            cookie["expires"],
            "R",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal
        );
        expira.Should().BeCloseTo(esperado, TimeSpan.FromMinutes(5));
    }

    private static void VerificarBodyNoFiltraRefreshToken(object? valor)
    {
        // camelCase, igual que la serialización de MVC en producción (Program.cs usa ReferenceHandler.IgnoreCycles)
        var json = JsonSerializer.Serialize(
            valor,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
        );
        json.Should().Contain("\"accessToken\"");
        json.ToLowerInvariant().Should().NotContain("refresh");
    }

    // ─────────────── 1. Serialización de RespuestaLogin ───────────────

    [Fact]
    public void RespuestaLogin_CuandoSeSerializa_DeberiaOcultarRefreshTokenYExponerAccessToken()
    {
        // Arrange
        var respuesta = new RespuestaLogin("access-123", "refresh-456", false);

        // Act + Assert
        VerificarBodyNoFiltraRefreshToken(respuesta);
    }

    // ─────────────── 2. IniciarSesion ───────────────

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task IniciarSesion_CuandoCredencialesValidas_DeberiaSetejarCookieConAtributosCorrectos(
        bool secure
    )
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(
            authMock,
            passkeysMock,
            secure,
            conCookieRefresh: false
        );
        authMock
            .Setup(x => x.IniciarSesion(It.IsAny<UsuarioDTO>()))
            .ReturnsAsync(new RespuestaLogin("access-token", "refresh-token", false));

        // Act
        var resultado = await controller.IniciarSesion(
            new UsuarioDTO { UserName = "usuario", Password = "clave" }
        );

        // Assert
        resultado.Should().BeOfType<OkObjectResult>();

        var cookie = ObtenerCookieDeRespuesta(httpContext);
        VerificarAtributosCookie(cookie, "refresh-token", secure);
        VerificarExpiracion(cookie, DateTimeOffset.UtcNow.AddDays(30));

        // El body de la respuesta no filtra el refresh token
        VerificarBodyNoFiltraRefreshToken(((OkObjectResult)resultado).Value);
    }

    // ─────────────── 3. Refrescar ───────────────

    [Fact]
    public async Task Refrescar_CuandoNoHayCookie_DeberiaRetornar401()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, _) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: false);

        // Act
        var resultado = await controller.Refrescar();

        // Assert
        resultado.Should().BeOfType<UnauthorizedResult>();
        ((UnauthorizedResult)resultado).StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
        authMock.Verify(x => x.Refrescar(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Refrescar_CuandoCookieValida_DeberiaRotarCookieYDevolverAccessTokenNuevo()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: true);
        authMock
            .Setup(x => x.Refrescar("token-viejo"))
            .ReturnsAsync(new RespuestaLogin("nuevo-access", "nuevo-refresh", false));

        // Act
        var resultado = await controller.Refrescar();

        // Assert
        resultado
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<RespuestaLogin>()
            .Which.AccessToken.Should().Be("nuevo-access");

        var cookie = ObtenerCookieDeRespuesta(httpContext);
        VerificarAtributosCookie(cookie, "nuevo-refresh", secure: true);
        VerificarExpiracion(cookie, DateTimeOffset.UtcNow.AddDays(30));
    }

    [Fact]
    public async Task Refrescar_CuandoTokenInvalido_DeberiaRetornar401SinRotarCookie()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: true);
        authMock
            .Setup(x => x.Refrescar(It.IsAny<string>()))
            .ReturnsAsync((RespuestaLogin?)null);

        // Act
        var resultado = await controller.Refrescar();

        // Assert
        resultado.Should().BeOfType<UnauthorizedObjectResult>();
        ((UnauthorizedObjectResult)resultado)
            .StatusCode.Should()
            .Be(StatusCodes.Status401Unauthorized);
        httpContext
            .Response.Headers["Set-Cookie"].Count.Should()
            .Be(0, "un token inválido no debe rotar la cookie");
    }

    // ─────────────── 4. CerrarSesion ───────────────

    [Fact]
    public async Task CerrarSesion_CuandoHayCookie_DeberiaRevocarEnServicioYBorrarCookieConMismosAtributos()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: true, idUsuario: "42");
        authMock.Setup(x => x.CerrarSesion(It.IsAny<int>(), It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        var resultado = await controller.CerrarSesion();

        // Assert
        resultado.Should().BeOfType<OkObjectResult>();
        authMock.Verify(x => x.CerrarSesion(42, "token-viejo"), Times.Once);

        // El borrado debe usar los MISMOS atributos que la creación para que el
        // navegador matchee la cookie original (hallazgo preliminar #2).
        var cookie = ObtenerCookieDeRespuesta(httpContext);
        cookie[NombreCookie].Should().BeEmpty();
        VerificarAtributosCookie(cookie, "", secure: true);
        VerificarExpiracion(cookie, DateTimeOffset.UnixEpoch);
    }

    [Fact]
    public async Task CerrarSesion_CuandoNoHayCookie_DeberiaRetornarOkSinRevocarEnServicio()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: false);
        authMock.Setup(x => x.CerrarSesion(It.IsAny<int>(), It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        var resultado = await controller.CerrarSesion();

        // Assert
        resultado.Should().BeOfType<OkObjectResult>();
        authMock.Verify(x => x.CerrarSesion(It.IsAny<int>(), It.IsAny<string>()), Times.Never);

        // Aunque no llegue cookie, el logout SIEMPRE intenta limpiar la cookie
        ObtenerCookieDeRespuesta(httpContext)[NombreCookie].Should().BeEmpty();
    }

    // ─────────────── 5. RegistrarUsuario ───────────────

    [Fact]
    public async Task RegistrarUsuario_CuandoUsuarioCreado_DeberiaNoSetejarCookie()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: false);
        authMock
            .Setup(x => x.RegistrarUsuarioAsync(It.IsAny<UsuarioDTO>()))
            .ReturnsAsync(new Usuario());

        // Act
        var resultado = await controller.RegistrarUsuario(
            new UsuarioDTO { UserName = "nuevo", Password = "clave" }
        );

        // Assert
        resultado.Should().BeOfType<OkObjectResult>();
        httpContext
            .Response.Headers["Set-Cookie"].Count.Should()
            .Be(0, "registrar usuario no debe emitir cookie de refresh token");
    }

    // ─────────────── 6. IniciarSesionConPasskey ───────────────

    [Fact]
    public async Task IniciarSesionConPasskey_CuandoAutenticacionExitosa_DeberiaSetejarCookie()
    {
        // Arrange
        var authMock = new Mock<IAdministrarAuth>();
        var passkeysMock = new Mock<IAdministracionPasskeys>();
        var (controller, httpContext) = CrearController(authMock, passkeysMock, secure: true, conCookieRefresh: false);
        passkeysMock
            .Setup(x => x.CompletarAuthAsync(It.IsAny<AuthenticatorAssertionRawResponse>()))
            .ReturnsAsync(new Usuario { Id = 1, UserName = "usuario-passkey" });
        authMock
            .Setup(x => x.FinalizarAuthPasskey(It.IsAny<Usuario>()))
            .ReturnsAsync(new RespuestaLogin("pass-access", "pass-refresh", false));

        var request = new IniciarSesionPasskeyRequest
        {
            Id = "credencial-1",
            RawId = "AQID", // base64url válido → decodifica a [1, 2, 3]
            RespuestaAssertion = new AuthAssertionResponseDTO
            {
                Id = "credencial-1",
                RawId = "AQID",
                Firma = [1, 2],
                DatosAutenticador = [3, 4],
                UserHandle = [5, 6],
                DatosClienteJson = [7, 8],
            },
        };

        // Act
        var resultado = await controller.IniciarSesionConPasskey(request);

        // Assert
        resultado.Should().BeOfType<OkObjectResult>();

        var cookie = ObtenerCookieDeRespuesta(httpContext);
        VerificarAtributosCookie(cookie, "pass-refresh", secure: true);
        VerificarExpiracion(cookie, DateTimeOffset.UtcNow.AddDays(30));
    }
}
