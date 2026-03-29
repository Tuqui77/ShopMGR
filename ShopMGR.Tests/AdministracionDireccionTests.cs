using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;
using FluentAssertions;
using Moq;
using Xunit;

namespace ShopMGR.Tests;

public class AdministracionDireccionTests
{
    private readonly Mock<IRepositorioConCliente<Direccion>> _direccionRepositorioMock;
    private readonly AdministracionDireccion _servicio;

    public AdministracionDireccionTests()
    {
        _direccionRepositorioMock = new Mock<IRepositorioConCliente<Direccion>>();
        
        // MapperRegistry no puede ser mockeado - pasamos null!
        // Los métodos testados no usan el mapper
        _servicio = new AdministracionDireccion(
            _direccionRepositorioMock.Object,
            null!
        );
    }

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarDireccionCuandoExiste()
    {
        // Arrange
        var direccionEsperada = new Direccion
        {
            Id = 1,
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = 5
        };

        _direccionRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(direccionEsperada);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.Calle.Should().Be("Av. Principal");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarNullCuandoNoExiste()
    {
        // Arrange
        _direccionRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(999))
            .ReturnsAsync((Direccion?)null);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(999);

        // Assert
        resultado.Should().BeNull();
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarDireccionCompleta()
    {
        // Arrange
        var direccionDetalle = new Direccion
        {
            Id = 1,
            Calle = "Calle Falsa",
            Altura = "456",
            IdCliente = 5,
            Cliente = new Cliente { Id = 5, NombreCompleto = "Cliente Test" }
        };

        _direccionRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(direccionDetalle);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Cliente.Should().NotBeNull();
        resultado.Cliente!.NombreCompleto.Should().Be("Cliente Test");
    }

    #endregion

    #region ObtenerPorIdCliente

    [Fact]
    public async Task ObtenerPorIdCliente_DeberiaRetornarDireccionesDelCliente()
    {
        // Arrange
        var direccionesCliente = new List<Direccion>
        {
            new() { Id = 1, IdCliente = 5, Calle = "Direccion 1" },
            new() { Id = 2, IdCliente = 5, Calle = "Direccion 2" }
        };

        _direccionRepositorioMock
            .Setup(x => x.ObtenerPorIdCliente(5))
            .ReturnsAsync(direccionesCliente);

        // Act
        var resultado = await _servicio.ObtenerPorIdCliente(5);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(d => d.IdCliente == 5).Should().BeTrue();
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarDireccion()
    {
        // Arrange
        var direccionExistente = new Direccion
        {
            Id = 1,
            Calle = "Calle Original",
            Altura = "100",
            IdCliente = 5
        };

        var direccionModificada = new ShopMGR.Aplicacion.Data_Transfer_Objects.ModificarDireccion
        {
            Calle = "Calle Modificada",
            Altura = "200"
        };

        _direccionRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(direccionExistente);

        _direccionRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Direccion>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, direccionModificada);

        // Assert
        _direccionRepositorioMock.Verify(x => x.ObtenerPorIdAsync(1), Times.Once);
        _direccionRepositorioMock.Verify(x => x.ActualizarAsync(It.Is<Direccion>(d => 
            d.Calle == "Calle Modificada" && 
            d.Altura == "200")), Times.Once);
    }

    [Fact]
    public async Task ActualizarAsync_DeberiaMantenerValoresExistentesCuandoSeanNull()
    {
        // Arrange
        var direccionExistente = new Direccion
        {
            Id = 1,
            Calle = "Calle Original",
            Altura = "100",
            CodigoPostal = "1234",
            IdCliente = 5
        };

        var direccionModificada = new ShopMGR.Aplicacion.Data_Transfer_Objects.ModificarDireccion
        {
            Calle = null // No se proporciona, debe mantener el original
        };

        _direccionRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(direccionExistente);

        _direccionRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Direccion>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, direccionModificada);

        // Assert
        _direccionRepositorioMock.Verify(x => x.ActualizarAsync(It.Is<Direccion>(d => 
            d.Calle == "Calle Original" && 
            d.CodigoPostal == "1234")), Times.Once);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarDireccion()
    {
        // Arrange
        _direccionRepositorioMock
            .Setup(x => x.EliminarAsync(1))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.EliminarAsync(1);

        // Assert
        _direccionRepositorioMock.Verify(x => x.EliminarAsync(1), Times.Once);
    }

    #endregion
}
