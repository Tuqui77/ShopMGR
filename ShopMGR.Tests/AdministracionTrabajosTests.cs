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
    private readonly Mock<IGoogleDriveServicio> _driveMock;
    private readonly Mock<IAlmacenamientoServicio> _almacenamientoMock;
    private readonly AdministracionTrabajos _servicio;

    public AdministracionTrabajosTests()
    {
        _repositorioFotoMock = new Mock<IRepositorioConFoto>();
        _repositorioPresupuestoMock = new Mock<IRepositorioConValorHora>();
        _clientesMock = new Mock<IAdministrarClientes>();
        _driveMock = new Mock<IGoogleDriveServicio>();
        _almacenamientoMock = new Mock<IAlmacenamientoServicio>();
        
        // Create MapperRegistry with IServiceProvider
        var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var mapperRegistry = new MapperRegistry(serviceProvider);

        _servicio = new AdministracionTrabajos(
            _repositorioFotoMock.Object,
            _repositorioPresupuestoMock.Object,
            _clientesMock.Object,
            _almacenamientoMock.Object,
            _driveMock.Object,
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
            new()
            {
                Id = 1,
                Titulo = "Trabajo 1",
                Estado = EstadoTrabajo.Pendiente,
            },
            new()
            {
                Id = 2,
                Titulo = "Trabajo 2",
                Estado = EstadoTrabajo.Iniciado,
            },
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
        var trabajoEsperado = new Trabajo
        {
            Id = 1,
            Titulo = "Reparación de motor",
            Estado = EstadoTrabajo.Iniciado,
        };

        _repositorioFotoMock.Setup(x => x.ObtenerPorIdAsync(1)).ReturnsAsync(trabajoEsperado);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.Titulo.Should().Be("Reparación de motor");
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarTrabajoConRelaciones()
    {
        // Arrange
        var trabajoEsperado = new Trabajo
        {
            Id = 1,
            Titulo = "Reparación de motor",
            Estado = EstadoTrabajo.Iniciado,
            Cliente = new Cliente { Id = 1, NombreCompleto = "Juan Perez" },
            Fotos = new List<Foto>(),
            HorasDeTrabajo = new List<HorasYDescripcion>(),
        };

        _repositorioFotoMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(trabajoEsperado);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.Titulo.Should().Be("Reparación de motor");
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
            new()
            {
                Id = 1,
                Titulo = "Trabajo Pendiente 1",
                Estado = EstadoTrabajo.Pendiente,
            },
            new()
            {
                Id = 2,
                Titulo = "Trabajo Pendiente 2",
                Estado = EstadoTrabajo.Pendiente,
            },
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
            new()
            {
                Id = 1,
                IdCliente = 5,
                Titulo = "Trabajo Cliente 5",
            },
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

        _driveMock
            .Setup(x => x.ConectarConGoogleDrive())
            .ReturnsAsync((Google.Apis.Auth.OAuth2.UserCredential)null!);

        _driveMock
            .Setup(x => x.SubirArchivoAsync(It.IsAny<IFormFile>()))
            .ReturnsAsync("https://drive.google.com/uc?id=test123");

        _almacenamientoMock
            .Setup(x => x.SubirFotoAsync(It.IsAny<int>(), It.IsAny<IFormFile>()))
            .ReturnsAsync("https://drive.google.com/uc?id=test123");

        _repositorioFotoMock
            .Setup(x => x.AgregarFotosAsync(It.IsAny<List<Foto>>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.AgregarFotosAsync(idTrabajo, mockFiles.Object);

        // Assert
        _almacenamientoMock.Verify(x => x.SubirFotoAsync(It.IsAny<int>(), It.IsAny<IFormFile>()), Times.Once);
        _repositorioFotoMock.Verify(
            x =>
                x.AgregarFotosAsync(
                    It.Is<List<Foto>>(fotos =>
                        fotos.Count == 1
                        && fotos[0].IdTrabajo == idTrabajo
                        && fotos[0].RutaRelativa == "https://drive.google.com/uc?id=test123"
                    )
                ),
            Times.Once
        );
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarTrabajoExistente()
    {
        // Arrange
        var trabajoModificado = new ModificarTrabajo
        {
            Titulo = "Título Modificado",
            Estado = EstadoTrabajo.Iniciado,
        };

        var trabajoExistente = new Trabajo
        {
            Id = 1,
            Titulo = "Título Original",
            Estado = EstadoTrabajo.Pendiente,
            IdCliente = 10,
        };

        _repositorioFotoMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(trabajoExistente);

        _repositorioFotoMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, trabajoModificado);

        // Assert
        _repositorioFotoMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
        _repositorioFotoMock.Verify(
            x =>
                x.ActualizarAsync(
                    It.Is<Trabajo>(t =>
                        t.Titulo == "Título Modificado" && t.Estado == EstadoTrabajo.Iniciado
                    )
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task ActualizarAsync_CambioAIniciado_DeberiaSetearFechaInicio()
    {
        // Arrange
        var trabajoModificado = new ModificarTrabajo { Estado = EstadoTrabajo.Iniciado };

        var trabajoExistente = new Trabajo
        {
            Id = 1,
            Titulo = "Trabajo",
            Estado = EstadoTrabajo.Pendiente,
            FechaInicio = null,
        };

        _repositorioFotoMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(trabajoExistente);

        _repositorioFotoMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, trabajoModificado);

        // Assert
        _repositorioFotoMock.Verify(
            x => x.ActualizarAsync(It.Is<Trabajo>(t => t.FechaInicio != null)),
            Times.Once
        );
    }

    #endregion

    #region TerminarTrabajo

    [Fact]
    public async Task TerminarTrabajo_DeberiaTerminarTrabajoYCrearMovimiento()
    {
        // Arrange
        var trabajo = new Trabajo
        {
            Id = 1,
            Titulo = "Trabajo a terminar",
            Estado = EstadoTrabajo.Iniciado,
            // TotalHoras es de solo lectura - se calcula desde HorasDeTrabajo
            HorasDeTrabajo = [new HorasYDescripcion { Horas = 10 }],
            TotalLabor = null, // Se calculará
            IdCliente = 5,
            Cliente = new Cliente { Id = 5, NombreCompleto = "Cliente Test" },
        };

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajo);

        _repositorioPresupuestoMock.Setup(x => x.ObtenerCostoHoraDeTrabajo()).ReturnsAsync(100m); // $100 por hora

        _repositorioFotoMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>()))
            .Returns(Task.CompletedTask);

        _clientesMock
            .Setup(x => x.RegistrarMovimientoAsync(It.IsAny<MovimientoBalanceDTO>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.TerminarTrabajo(1);

        // Assert
        _repositorioFotoMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
        _repositorioPresupuestoMock.Verify(x => x.ObtenerCostoHoraDeTrabajo(), Times.Once);
        _repositorioFotoMock.Verify(
            x =>
                x.ActualizarAsync(
                    It.Is<Trabajo>(t => t.Estado == EstadoTrabajo.Terminado && t.FechaFin != null)
                ),
            Times.Once
        );

        _clientesMock.Verify(
            x =>
                x.RegistrarMovimientoAsync(
                    It.Is<MovimientoBalanceDTO>(m => m.Tipo == TipoMovimiento.Cargo)
                ),
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
        var trabajo = new Trabajo
        {
            Id = 1,
            Titulo = "Trabajo con total",
            Estado = EstadoTrabajo.Iniciado,
            HorasDeTrabajo = [new HorasYDescripcion { Horas = 10 }],
            TotalLabor = 500m, // Ya tiene un total establecido
            IdCliente = 5,
            Cliente = new Cliente { Id = 5, NombreCompleto = "Cliente Test" },
        };

        _repositorioFotoMock.Setup(x => x.ObtenerDetallePorIdAsync(1)).ReturnsAsync(trabajo);

        // No debe llamar a ObtenerCostoHoraDeTrabajo porque ya tiene TotalLabor
        _repositorioPresupuestoMock.Setup(x => x.ObtenerCostoHoraDeTrabajo()).ReturnsAsync(100m);

        _repositorioFotoMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Trabajo>()))
            .Returns(Task.CompletedTask);

        _clientesMock
            .Setup(x => x.RegistrarMovimientoAsync(It.IsAny<MovimientoBalanceDTO>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.TerminarTrabajo(1);

        // Assert - El total debe seguir siendo 500m, no se recalcula
        _repositorioFotoMock.Verify(
            x => x.ActualizarAsync(It.Is<Trabajo>(t => t.TotalLabor == 500m)),
            Times.Once
        );
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
