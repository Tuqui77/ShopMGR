using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;
using FluentAssertions;
using Moq;
using Xunit;

namespace ShopMGR.Tests;

public class AdministracionTelefonoClienteTests
{
    private readonly Mock<IRepositorioConCliente<TelefonoCliente>> _telefonoRepositorioMock;
    private readonly AdministracionTelefonoCliente _servicio;

    public AdministracionTelefonoClienteTests()
    {
        _telefonoRepositorioMock = new Mock<IRepositorioConCliente<TelefonoCliente>>();
        
        // MapperRegistry no puede ser mockeado - pasamos null!
        // Los métodos testados no usan el mapper
        _servicio = new AdministracionTelefonoCliente(
            _telefonoRepositorioMock.Object,
            null!
        );
    }

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarTelefonoCuandoExiste()
    {
        // Arrange
        var telefonoEsperado = new TelefonoCliente
        {
            Id = 1,
            Telefono = "1234567890",
            IdCliente = 5,
            Descripcion = "Celular"
        };

        _telefonoRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(telefonoEsperado);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.Telefono.Should().Be("1234567890");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarNullCuandoNoExiste()
    {
        // Arrange
        _telefonoRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(999))
            .ReturnsAsync((TelefonoCliente?)null);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(999);

        // Assert
        resultado.Should().BeNull();
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarTelefonoCompleto()
    {
        // Arrange
        var telefonoDetalle = new TelefonoCliente
        {
            Id = 1,
            Telefono = "9876543210",
            IdCliente = 5,
            Cliente = new Cliente { Id = 5, NombreCompleto = "Cliente Test" }
        };

        _telefonoRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(telefonoDetalle);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Cliente.Should().NotBeNull();
        resultado.Cliente!.NombreCompleto.Should().Be("Cliente Test");
    }

    #endregion

    #region ObtenerTelefonosCliente

    [Fact]
    public async Task ObtenerTelefonosCliente_DeberiaRetornarTelefonosDelCliente()
    {
        // Arrange
        var telefonosCliente = new List<TelefonoCliente>
        {
            new() { Id = 1, IdCliente = 5, Telefono = "1111111111" },
            new() { Id = 2, IdCliente = 5, Telefono = "2222222222" }
        };

        _telefonoRepositorioMock
            .Setup(x => x.ObtenerPorIdCliente(5))
            .ReturnsAsync(telefonosCliente);

        // Act
        var resultado = await _servicio.ObtenerTelefonosCliente(5);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(t => t.IdCliente == 5).Should().BeTrue();
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarTelefono()
    {
        // Arrange
        var telefonoExistente = new TelefonoCliente
        {
            Id = 1,
            Telefono = "0000000000",
            IdCliente = 5,
            Descripcion = "Descripción Original"
        };

        var telefonoModificado = new ShopMGR.Aplicacion.Data_Transfer_Objects.ModificarTelefono
        {
            Telefono = "9999999999",
            Descripcion = "Nueva Descripción"
        };

        _telefonoRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(telefonoExistente);

        _telefonoRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<TelefonoCliente>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, telefonoModificado);

        // Assert
        _telefonoRepositorioMock.Verify(x => x.ObtenerPorIdAsync(1), Times.Once);
        _telefonoRepositorioMock.Verify(x => x.ActualizarAsync(It.Is<TelefonoCliente>(t => 
            t.Telefono == "9999999999" && 
            t.Descripcion == "Nueva Descripción")), Times.Once);
    }

    [Fact]
    public async Task ActualizarAsync_DeberiaMantenerValoresExistentesCuandoSeanNull()
    {
        // Arrange
        var telefonoExistente = new TelefonoCliente
        {
            Id = 1,
            Telefono = "1111111111",
            IdCliente = 5,
            Descripcion = "Descripción Original"
        };

        var telefonoModificado = new ShopMGR.Aplicacion.Data_Transfer_Objects.ModificarTelefono
        {
            Telefono = null // No se proporciona, debe mantener el original
        };

        _telefonoRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(telefonoExistente);

        _telefonoRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<TelefonoCliente>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, telefonoModificado);

        // Assert
        _telefonoRepositorioMock.Verify(x => x.ActualizarAsync(It.Is<TelefonoCliente>(t => 
            t.Telefono == "1111111111" && 
            t.Descripcion == "Descripción Original")), Times.Once);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarTelefono()
    {
        // Arrange
        _telefonoRepositorioMock
            .Setup(x => x.EliminarAsync(1))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.EliminarAsync(1);

        // Assert
        _telefonoRepositorioMock.Verify(x => x.EliminarAsync(1), Times.Once);
    }

    #endregion
}
