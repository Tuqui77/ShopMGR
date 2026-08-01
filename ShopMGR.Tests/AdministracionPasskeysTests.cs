using FluentAssertions;
using Moq;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests;

/// <summary>
/// Tests de AdministracionPasskeys.
/// El foco principal es la validación de ownership (#109 IDOR):
/// un usuario NO puede editar ni eliminar una passkey que no le pertenece.
/// </summary>
public class AdministracionPasskeysTests
{
    private readonly Mock<IRepositorioPasskeys> _repositorioMock;
    private readonly AdministracionPasskeys _servicio;

    public AdministracionPasskeysTests()
    {
        _repositorioMock = new Mock<IRepositorioPasskeys>();

        // Las dependencias no usadas por los métodos testeados (DbContexto,
        // IConfiguration, IFido2) se pasan como null, igual que en
        // AdministracionClientesTests con el mapper.
        _servicio = new AdministracionPasskeys(null!, _repositorioMock.Object, null!, null!);
    }

    private static Passkey CrearPasskey(int idUsuario, byte[]? idCredencial = null)
    {
        return new Passkey(
            idCredencial ?? new byte[] { 1, 2, 3, 4 },
            new byte[] { 9, 8, 7, 6 },
            "Dispositivo de prueba",
            idUsuario
        );
    }

    // ─────────────────────── EditarNombrePasskey ───────────────────────

    [Fact]
    public async Task EditarNombrePasskey_CuandoCredencialPerteneceAlUsuario_DeberiaActualizarNombre()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        var credencial = CrearPasskey(idUsuario: 10, idCredencial);
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync(credencial);

        // Act
        await _servicio.EditarNombrePasskey(idCredencial, idUsuario: 10, "Nuevo nombre");

        // Assert
        credencial.Nombre.Should().Be("Nuevo nombre");
        _repositorioMock.Verify(x => x.ActualizarAsync(credencial), Times.Once);
    }

    [Fact]
    public async Task EditarNombrePasskey_CuandoCredencialNoPerteneceAlUsuario_DeberiaLanzarInvalidOperationException()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        var credencial = CrearPasskey(idUsuario: 10, idCredencial); // Dueño real: usuario 10
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync(credencial);

        // Act
        var accion = () => _servicio.EditarNombrePasskey(idCredencial, idUsuario: 999, "Nombre robado");

        // Assert
        await accion.Should().ThrowAsync<InvalidOperationException>();
        _repositorioMock.Verify(x => x.ActualizarAsync(It.IsAny<Passkey>()), Times.Never);
    }

    [Fact]
    public async Task EditarNombrePasskey_CuandoCredencialNoExiste_DeberiaLanzarArgumentException()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync((Passkey?)null);

        // Act
        var accion = () => _servicio.EditarNombrePasskey(idCredencial, idUsuario: 10, "Nombre");

        // Assert
        await accion.Should().ThrowAsync<ArgumentException>();
        _repositorioMock.Verify(x => x.ActualizarAsync(It.IsAny<Passkey>()), Times.Never);
    }

    // ─────────────────────── EliminarPasskeyAsync ───────────────────────

    [Fact]
    public async Task EliminarPasskeyAsync_CuandoCredencialPerteneceAlUsuario_DeberiaEliminar()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        var credencial = CrearPasskey(idUsuario: 10, idCredencial);
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync(credencial);

        // Act
        await _servicio.EliminarPasskeyAsync(idCredencial, idUsuario: 10);

        // Assert
        _repositorioMock.Verify(x => x.EliminarPasskeyAsync(credencial), Times.Once);
    }

    [Fact]
    public async Task EliminarPasskeyAsync_CuandoCredencialNoPerteneceAlUsuario_DeberiaLanzarInvalidOperationException()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        var credencial = CrearPasskey(idUsuario: 10, idCredencial); // Dueño real: usuario 10
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync(credencial);

        // Act
        var accion = () => _servicio.EliminarPasskeyAsync(idCredencial, idUsuario: 999);

        // Assert
        await accion.Should().ThrowAsync<InvalidOperationException>();
        _repositorioMock.Verify(x => x.EliminarPasskeyAsync(It.IsAny<Passkey>()), Times.Never);
    }

    [Fact]
    public async Task EliminarPasskeyAsync_CuandoCredencialNoExiste_DeberiaLanzarArgumentException()
    {
        // Arrange
        var idCredencial = new byte[] { 1, 2, 3, 4 };
        _repositorioMock.Setup(x => x.ObtenerPasskeyPorIdCredencial(idCredencial)).ReturnsAsync((Passkey?)null);

        // Act
        var accion = () => _servicio.EliminarPasskeyAsync(idCredencial, idUsuario: 10);

        // Assert
        await accion.Should().ThrowAsync<ArgumentException>();
        _repositorioMock.Verify(x => x.EliminarPasskeyAsync(It.IsAny<Passkey>()), Times.Never);
    }
}
