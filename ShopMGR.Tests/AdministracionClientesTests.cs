using FluentAssertions;
using Moq;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using Xunit;

namespace ShopMGR.Tests;

public class AdministracionClientesTests
{
    private readonly Mock<IRepositorioCliente<Cliente>> _clienteRepositorioMock;
    private readonly Mock<IRepositorioConCliente<Direccion>> _direccionRepositorioMock;
    private readonly Mock<IRepositorioConCliente<TelefonoCliente>> _telefonoRepositorioMock;
    private readonly Mock<IMovimientoBalanceRepositorio> _movimientoBalanceRepositorioMock;
    private readonly AdministracionClientes _servicio;

    public AdministracionClientesTests()
    {
        _clienteRepositorioMock = new Mock<IRepositorioCliente<Cliente>>();
        _direccionRepositorioMock = new Mock<IRepositorioConCliente<Direccion>>();
        _telefonoRepositorioMock = new Mock<IRepositorioConCliente<TelefonoCliente>>();
        _movimientoBalanceRepositorioMock = new Mock<IMovimientoBalanceRepositorio>();

        // MapperRegistry no puede ser mockeado porque requiere IServiceProvider en constructor
        // Los métodos testados no usan el mapper, así que pasamos null!
        _servicio = new AdministracionClientes(
            _clienteRepositorioMock.Object,
            _direccionRepositorioMock.Object,
            _telefonoRepositorioMock.Object,
            _movimientoBalanceRepositorioMock.Object,
            null!
        );
    }

    [Fact]
    public async Task ListarTodosAsync_DeberiaRetornarListaDeClientes()
    {
        // Arrange
        var clientesEsperados = new List<Cliente>
        {
            new() { Id = 1, NombreCompleto = "Cliente 1" },
            new() { Id = 2, NombreCompleto = "Cliente 2" },
        };

        _clienteRepositorioMock.Setup(x => x.ListarTodosAsync()).ReturnsAsync(clientesEsperados);

        // Act
        var resultado = await _servicio.ListarTodosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.First().NombreCompleto.Should().Be("Cliente 1");
        _clienteRepositorioMock.Verify(x => x.ListarTodosAsync(), Times.Once);
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarClienteCuandoExiste()
    {
        // Arrange
        var clienteEsperado = new Cliente
        {
            Id = 1,
            NombreCompleto = "Juan Perez",
            Cuit = "20-12345678-9",
        };

        _clienteRepositorioMock.Setup(x => x.ObtenerPorIdAsync(1)).ReturnsAsync(clienteEsperado);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.NombreCompleto.Should().Be("Juan Perez");
        _clienteRepositorioMock.Verify(x => x.ObtenerPorIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarClienteConRelaciones()
    {
        // Arrange
        var clienteEsperado = new Cliente
        {
            Id = 1,
            NombreCompleto = "Juan Perez",
            Cuit = "20-12345678-9",
            Direccion = new List<Direccion>(),
            Telefono = new List<TelefonoCliente>(),
        };

        _clienteRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(clienteEsperado);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.NombreCompleto.Should().Be("Juan Perez");
        _clienteRepositorioMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task ObtenerClientePorNombreAsync_DeberiaRetornarClienteCuandoExiste()
    {
        // Arrange
        var clienteEsperado = new Cliente { Id = 1, NombreCompleto = "Juan Perez" };

        _clienteRepositorioMock
            .Setup(x => x.ObtenerPorNombreAsync("Juan Perez"))
            .ReturnsAsync(clienteEsperado);

        // Act
        var resultado = await _servicio.ObtenerClientePorNombreAsync("Juan Perez");

        // Assert
        resultado.Should().NotBeNull();
        resultado!.NombreCompleto.Should().Be("Juan Perez");
    }

    [Fact]
    public async Task BuscarSaldosNegativosAsync_DeberiaRetornarClientesConBalanceNegativo()
    {
        // Arrange
        var clientesNegativos = new List<Cliente>
        {
            new()
            {
                Id = 1,
                NombreCompleto = "Cliente Deudor",
            },
        };

        _clienteRepositorioMock
            .Setup(x => x.BuscarSaldosNegativosAsync())
            .ReturnsAsync(clientesNegativos);

        // Act
        var resultado = await _servicio.BuscarSaldosNegativosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(1);
    }

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarClienteCuandoExiste()
    {
        // Arrange
        var clienteActualizado = new ModificarCliente
        {
            NombreCompleto = "Nuevo Nombre",
            Cuit = "20-98765432-1",
        };

        var clienteExistente = new Cliente
        {
            Id = 1,
            NombreCompleto = "Nombre Original",
            Cuit = "20-12345678-9",
        };

        _clienteRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(clienteExistente);

        _clienteRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Cliente>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, clienteActualizado);

        // Assert
        _clienteRepositorioMock.Verify(x => x.ObtenerPorIdAsync(1), Times.Once);
        _clienteRepositorioMock.Verify(
            x =>
                x.ActualizarAsync(
                    It.Is<Cliente>(c =>
                        c.NombreCompleto == "Nuevo Nombre" && c.Cuit == "20-98765432-1"
                    )
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarClienteCuandoExiste()
    {
        // Arrange
        _clienteRepositorioMock.Setup(x => x.EliminarAsync(1)).Returns(Task.CompletedTask);

        // Act
        await _servicio.EliminarAsync(1);

        // Assert
        _clienteRepositorioMock.Verify(x => x.EliminarAsync(1), Times.Once);
    }

    [Fact]
    public async Task RegistrarMovimientoAsync_DeberiaRegistrarMovimientoYActualizarBalance()
    {
        // Arrange
        var clienteExistente = new Cliente
        {
            Id = 1,
            NombreCompleto = "Juan Perez",
            MovimientosBalance = [new MovimientoBalance { Monto = 100m, Tipo = TipoMovimiento.Pago, Descripcion = "Saldo inicial", Fecha = DateOnly.FromDateTime(DateTime.Today) }]
        };

        var movimientoDTO = new MovimientoBalanceDTO
        {
            IdCliente = 1,
            Monto = 50m,
            Descripcion = "Pago recibido",
            Fecha = DateOnly.FromDateTime(DateTime.Today),
            Tipo = TipoMovimiento.Pago
        };

        _clienteRepositorioMock.Setup(x => x.ObtenerPorIdAsync(1)).ReturnsAsync(clienteExistente);

        _clienteRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Cliente>()))
            .Returns(Task.CompletedTask);

        _movimientoBalanceRepositorioMock
            .Setup(x => x.AgregarAsync(It.IsAny<MovimientoBalance>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.RegistrarMovimientoAsync(movimientoDTO);

        // Assert
        _clienteRepositorioMock.Verify(x => x.ObtenerPorIdAsync(1), Times.Once);
        _clienteRepositorioMock.Verify(
            x => x.ActualizarAsync(It.Is<Cliente>(c => c.Balance == 150m)),
            Times.Once
        );
    }
}
