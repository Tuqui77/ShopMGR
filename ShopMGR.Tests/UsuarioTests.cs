using System.Reflection;
using FluentAssertions;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests;

/// <summary>
/// Tests de <see cref="Usuario.EliminarRefreshTokensExpirados"/> (issue #116 OPS-001).
///
/// Contrato verificado: se eliminan de la colección en memoria todos los tokens con
/// <c>EstaExpirado == true</c>, sin importar si están revocados o no. El estado revocado
/// NO protege al token de la purga; la única condición es la expiración.
///
/// Los setters privados de <c>CreadoEn</c>/<c>ExpiraEn</c>/<c>RevocadoEn</c> se manipulan
/// por reflexión para simular tokens en el pasado sin modificar producción.
/// </summary>
public class UsuarioTests
{
    [Fact]
    public void EliminarRefreshTokensExpirados_CuandoHayTokensExpirados_DeberiaEliminarlos()
    {
        // Arrange
        var usuario = CrearUsuario();
        var expirado = usuario.CrearRefreshToken("hash-expirado", TimeSpan.FromDays(30));
        var valido = usuario.CrearRefreshToken("hash-valido", TimeSpan.FromDays(30));
        var revocadoNoExpirado = usuario.CrearRefreshToken("hash-revocado", TimeSpan.FromDays(30));
        revocadoNoExpirado.Revocar();

        SetFechas(
            expirado,
            creadoEn: DateTime.Now.AddDays(-31),
            expiraEn: DateTime.Now.AddHours(-1)
        );

        // Act
        usuario.EliminarRefreshTokensExpirados();

        // Assert
        usuario.RefreshTokens.Should().HaveCount(2);
        usuario
            .RefreshTokens.Select(t => t.Hash)
            .Should()
            .BeEquivalentTo("hash-valido", "hash-revocado");
        usuario.RefreshTokens.Should().NotContain(t => t.Hash == "hash-expirado");
    }

    [Fact]
    public void EliminarRefreshTokensExpirados_CuandoNoHayExpirados_DeberiaNoEliminarNada()
    {
        // Arrange
        var usuario = CrearUsuario();
        usuario.CrearRefreshToken("hash-1", TimeSpan.FromDays(30));
        usuario.CrearRefreshToken("hash-2", TimeSpan.FromDays(30));
        usuario.CrearRefreshToken("hash-3", TimeSpan.FromDays(30));

        // Act
        usuario.EliminarRefreshTokensExpirados();

        // Assert
        usuario.RefreshTokens.Should().HaveCount(3);
        usuario.RefreshTokens.Select(t => t.Hash).Should().BeEquivalentTo("hash-1", "hash-2", "hash-3");
    }

    [Fact]
    public void EliminarRefreshTokensExpirados_CuandoTokenRevocadoYExpirado_DeberiaEliminarlo()
    {
        // Arrange
        var usuario = CrearUsuario();
        var revocadoYExpirado = usuario.CrearRefreshToken("hash-rev-exp", TimeSpan.FromDays(30));
        revocadoYExpirado.Revocar();
        SetFechas(
            revocadoYExpirado,
            creadoEn: DateTime.Now.AddDays(-31),
            expiraEn: DateTime.Now.AddHours(-1)
        );

        var valido = usuario.CrearRefreshToken("hash-valido", TimeSpan.FromDays(30));

        // Act
        usuario.EliminarRefreshTokensExpirados();

        // Assert
        usuario.RefreshTokens.Should().ContainSingle(t => t.Hash == "hash-valido");
    }

    [Fact]
    public void CrearRefreshToken_DeberiaAsignarCreadoEnYExpiraEn()
    {
        // Arrange
        var usuario = CrearUsuario();

        // Act
        var token = usuario.CrearRefreshToken("hash", TimeSpan.FromDays(30));

        // Assert
        token.Hash.Should().Be("hash");
        token.IdUsuario.Should().Be(usuario.Id);
        token.CreadoEn.Should().BeCloseTo(DateTime.Now, TimeSpan.FromMinutes(1));
        token.ExpiraEn.Should().BeCloseTo(token.CreadoEn.AddDays(30), TimeSpan.FromSeconds(1));
        token.EstaExpirado.Should().BeFalse();
        token.EstaRevocado.Should().BeFalse();
    }

    // ─────────────────────── Helpers ───────────────────────

    private static Usuario CrearUsuario() =>
        new() { Id = 1, UserName = "admin", PasswordHash = "hash" };

    /// <summary>
    /// Setea por reflexión las fechas del token (setters privados) para simular
    /// tokens expirados/revocados sin tocar el código de producción.
    /// </summary>
    private static void SetFechas(
        RefreshToken token,
        DateTime? creadoEn = null,
        DateTime? expiraEn = null,
        DateTime? revocadoEn = null
    )
    {
        if (creadoEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.CreadoEn), creadoEn.Value);
        if (expiraEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.ExpiraEn), expiraEn.Value);
        if (revocadoEn.HasValue)
            SetPrivado(token, nameof(RefreshToken.RevocadoEn), revocadoEn.Value);
    }

    private static void SetPrivado(RefreshToken token, string nombrePropiedad, object valor) =>
        typeof(RefreshToken)
            .GetProperty(nombrePropiedad, BindingFlags.Instance | BindingFlags.Public)!
            .SetValue(token, valor);
}
