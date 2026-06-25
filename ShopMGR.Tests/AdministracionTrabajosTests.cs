using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
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

public class AdministracionTrabajosTests
{
    private readonly Mock<IRepositorioConFoto> _repositorioFotoMock;
    private readonly Mock<IRepositorioConValorHora> _repositorioPresupuestoMock;
    private readonly Mock<IAdministrarClientes> _clientesMock;
    private readonly Mock<IAlmacenamientoServicio> _almacenamientoMock;
    private readonly AdministracionTrabajos _servicio;

    // Helper para setear propiedades con private set en tests
    private static void SetProperty<T, TValue>(T obj, string propertyName, TValue value)
    {
        typeof(T).GetProperty(propertyName)?.SetValue(obj, value);
    }

    public AdministracionTrabajosTests()
    {
        _repositorioFotoMock = new Mock<IRepositorioConFoto>();
        _repositorioPresupuestoMock = new Mock<IRepositorioConValorHora>();
        _clientesMock = new Mock<IAdministrarClientes>();
        _almacenamientoMock = new Mock<IAlmacenamientoServicio>();

        // Create MapperRegistry with IServiceProvider
        var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var mapperRegistry = new MapperRegistry(serviceProvider);

        _servicio = new AdministracionTrabajos(
            _repositorioFotoMock.Object,
            _repositorioPresupuestoMock.Object,
            _clientesMock.Object,
            _almacenamientoMock.Object,
            mapperRegistry
        );
    }

    #region ListarTodosAsync

    [Fact]
    public async Task ListarTodosAsync_DeberiaRetornarListaDeTrabajos()
    {
        // Arrange
        var trabajosEsperados = new List<Trabajo>
        {
            new Trabajo("Trabajo 1", null, 0, EstadoTrabajo.Pendiente, null, null, null),
            new Trabajo("Trabajo 2", null, 0, EstadoTrabajo.Iniciado, null, null, null),
        };

        _repositorioFotoMock.Setup(x => x.ListarTodosAsync()).ReturnsAsync(trabajosEsperados);

        // Act
        var resultado = await _servicio.ListarTodosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.First().Titulo.Should().Be("Trabajo 1");
        _repositorioFotoMock.Verify(x => x.ListarTodosAsync(), Times.Once);
    }

    #endregion

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarTrabajoCuandoExiste()
    {
        // Arrange
        var trabajoEsperado = new Trabajo("Reparación de motor", null, 0, EstadoTrabajo.Iniciado, null, null, null);
        SetProperty(trabajoEsperado, "Id", 1);

        _repositorioFotoMock.Setup(x => x.ObtenerPorIdAsync(1)).ReturnsAsync(trabajoEsperado);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Titulo.Should().Be("Reparación de motor");
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarTrabajoConRelaciones()
    {
        // Arrange
        var trabajoEsperado = new Trabajo("Reparación de motor", null, 0, EstadoTrabajo.Iniciado, null, null, null);
        SetProperty(trabajoEsperado, "Id", 1);
        SetProperty(trabajoEsperado, "Cliente", new Cliente { Id = 1, NombreCompleto = "Juan Perez" });

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajoEsperado);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Titulo.Should().Be("Reparación de motor");
        resultado.Cliente.Should().NotBeNull();
        resultado.Cliente.NombreCompleto.Should().Be("Juan Perez");
        _repositorioFotoMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
    }

    #endregion

    #region ObtenerPorEstadoAsync

    [Fact]
    public async Task ObtenerPorEstadoAsync_DeberiaRetornarTrabajosFiltrados()
    {
        // Arrange
        var trabajosPendientes = new List<Trabajo>
        {
            new Trabajo("Trabajo Pendiente 1", null, 0, EstadoTrabajo.Pendiente, null, null, null),
            new Trabajo("Trabajo Pendiente 2", null, 0, EstadoTrabajo.Pendiente, null, null, null),
        };

        _repositorioFotoMock
            .Setup(x => x.ObtenerPorEstadoAsync(EstadoTrabajo.Pendiente))
            .ReturnsAsync(trabajosPendientes);

        // Act
        var resultado = await _servicio.ObtenerPorEstadoAsync(EstadoTrabajo.Pendiente);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(t => t.Estado == EstadoTrabajo.Pendiente).Should().BeTrue();
    }

    #endregion

    #region ObtenerPorClienteAsync

    [Fact]
    public async Task ObtenerPorClienteAsync_DeberiaRetornarTrabajosDelCliente()
    {
        // Arrange
        var trabajosCliente = new List<Trabajo>
        {
            new Trabajo("Trabajo Cliente 5", null, 5, null, null, null, null),
        };

        _repositorioFotoMock.Setup(x => x.ObtenerPorClienteAsync(5)).ReturnsAsync(trabajosCliente);

        // Act
        var resultado = await _servicio.ObtenerPorClienteAsync(5);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(1);
        resultado.First().IdCliente.Should().Be(5);
    }

    #endregion

    #region AgregarFotosAsync

    [Fact]
    public async Task AgregarFotosAsync_DeberiaSubirFotosYGuardarEnRepositorio()
    {
        // Arrange
        int idTrabajo = 1;
        var mockFiles = new Mock<IFormFileCollection>();
        var mockFile = new Mock<IFormFile>();

        mockFile.Setup(f => f.FileName).Returns("test.jpg");
        mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[] { 1, 2, 3 }));

        var fileList = new List<IFormFile> { mockFile.Object };
        mockFiles.Setup(c => c.GetEnumerator()).Returns(fileList.GetEnumerator());
        mockFiles.Setup(c => c.Count).Returns(1);
        mockFiles.Setup(c => c[It.IsAny<int>()]).Returns(mockFile.Object);

        _almacenamientoMock
            .Setup(x => x.SubirFotoAsync(It.IsAny<int>(), It.IsAny<IFormFile>()))
            .ReturnsAsync("https://drive.google.com/uc?id=test123");

        var trabajoExistente = new Trabajo("Test", null, 0, null, null, null, null);
        SetProperty(trabajoExistente, "Id", idTrabajo);
        _repositorioFotoMock.Setup(x => x.ObtenerPorIdAsync(idTrabajo)).ReturnsAsync(trabajoExistente);
        _repositorioFotoMock.Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>())).Returns(Task.CompletedTask);

        // Act
        await _servicio.AgregarFotosAsync(idTrabajo, mockFiles.Object);

        // Assert
        _almacenamientoMock.Verify(x => x.SubirFotoAsync(It.IsAny<int>(), It.IsAny<IFormFile>()), Times.Once);
        _repositorioFotoMock.Verify(x => x.ActualizarAsync(It.IsAny<Trabajo>()), Times.Once);
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarTrabajoExistente()
    {
        // Arrange
        var trabajoModificado = new ModificarTrabajo { Titulo = "Título Modificado", Estado = EstadoTrabajo.Iniciado };

        var trabajoExistente = new Trabajo("Título Original", null, 10, EstadoTrabajo.Pendiente, null, null, null);
        SetProperty(trabajoExistente, "Id", 1);

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajoExistente);

        _repositorioFotoMock.Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>())).Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, trabajoModificado);

        // Assert
        _repositorioFotoMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
        _repositorioFotoMock.Verify(
            x =>
                x.ActualizarAsync(
                    It.Is<Trabajo>(t => t.Titulo == "Título Modificado" && t.Estado == EstadoTrabajo.Iniciado)
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task ActualizarAsync_CambioAIniciado_DeberiaSetearFechaInicio()
    {
        // Arrange
        var trabajoModificado = new ModificarTrabajo { Estado = EstadoTrabajo.Iniciado };

        var trabajoExistente = new Trabajo("Trabajo", null, 0, EstadoTrabajo.Pendiente, null, null, null);
        SetProperty(trabajoExistente, "Id", 1);

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajoExistente);

        _repositorioFotoMock.Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>())).Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, trabajoModificado);

        // Assert
        _repositorioFotoMock.Verify(x => x.ActualizarAsync(It.Is<Trabajo>(t => t.FechaInicio != null)), Times.Once);
    }

    #endregion

    #region TerminarTrabajo

    [Fact]
    public async Task TerminarTrabajo_DeberiaTerminarTrabajoYCrearMovimiento()
    {
        // Arrange
        var trabajo = new Trabajo("Trabajo a terminar", null, 5, EstadoTrabajo.Iniciado, null, null, 1000m);
        SetProperty(trabajo, "Id", 1);
        SetProperty(trabajo, "Cliente", new Cliente { Id = 5, NombreCompleto = "Cliente Test" });

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajo);

        _repositorioFotoMock.Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>())).Returns(Task.CompletedTask);

        _clientesMock
            .Setup(x => x.RegistrarMovimientoAsync(It.IsAny<MovimientoBalanceDTO>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.TerminarTrabajo(1);

        // Assert
        _repositorioFotoMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
        _repositorioFotoMock.Verify(
            x => x.ActualizarAsync(It.Is<Trabajo>(t => t.Estado == EstadoTrabajo.Terminado && t.FechaFin != null)),
            Times.Once
        );

        _clientesMock.Verify(
            x => x.RegistrarMovimientoAsync(It.Is<MovimientoBalanceDTO>(m => m.Tipo == TipoMovimiento.Cargo)),
            Times.Once
        );
    }

    #endregion

    #region ObtenerPorIdAsync - Edge Cases

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarNullCuandoNoExiste()
    {
        // Arrange
        _repositorioFotoMock.Setup(x => x.ObtenerPorIdAsync(999)).ReturnsAsync((Trabajo?)null);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(999);

        // Assert
        resultado.Should().BeNull();
    }

    #endregion

    #region TerminarTrabajo - Edge Cases

    [Fact]
    public async Task TerminarTrabajo_ConTotalLaborExistente_NoDeberiaRecalcular()
    {
        // Arrange
        var trabajo = new Trabajo("Trabajo con total", null, 5, EstadoTrabajo.Iniciado, null, null, 500m);
        SetProperty(trabajo, "Id", 1);
        SetProperty(trabajo, "Cliente", new Cliente { Id = 5, NombreCompleto = "Cliente Test" });

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajo);

        _repositorioFotoMock.Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>())).Returns(Task.CompletedTask);

        _clientesMock
            .Setup(x => x.RegistrarMovimientoAsync(It.IsAny<MovimientoBalanceDTO>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.TerminarTrabajo(1);

        // Assert - El total debe seguir siendo 500m, no se recalcula
        _repositorioFotoMock.Verify(x => x.ActualizarAsync(It.Is<Trabajo>(t => t.TotalLabor == 500m)), Times.Once);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarTrabajo()
    {
        // Arrange
        _repositorioFotoMock.Setup(x => x.EliminarAsync(1)).Returns(Task.CompletedTask);

        // Act
        await _servicio.EliminarAsync(1);

        // Assert
        _repositorioFotoMock.Verify(x => x.EliminarAsync(1), Times.Once);
    }

    #endregion
}
