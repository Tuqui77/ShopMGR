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

public class AdministracionPresupuestosTests
{
    private readonly Mock<IRepositorioConValorHora> _presupuestoRepositorioMock;
    private readonly AdministracionPresupuestos _servicio;

    public AdministracionPresupuestosTests()
    {
        _presupuestoRepositorioMock = new Mock<IRepositorioConValorHora>();

        // MapperRegistry no puede ser mockeado - pasamos null!
        // Los métodos testados no usan el mapper
        _servicio = new AdministracionPresupuestos(_presupuestoRepositorioMock.Object, null!);
    }

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarPresupuestoCuandoExiste()
    {
        // Arrange
        var presupuestoEsperado = new Presupuesto
        {
            Id = 1,
            Titulo = "Presupuesto de reparación",
            Estado = EstadoPresupuesto.Pendiente,
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerPorIdAsync(1))
            .ReturnsAsync(presupuestoEsperado);

        // Act
        var resultado = await _servicio.ObtenerPorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Id.Should().Be(1);
        resultado.Titulo.Should().Be("Presupuesto de reparación");
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarPresupuestoCompleto()
    {
        // Arrange
        var presupuestoDetalle = new Presupuesto
        {
            Id = 1,
            Titulo = "Presupuesto detallado",
            Cliente = new Cliente { Id = 5, NombreCompleto = "Cliente X" },
            Materiales =
            [
                new Material
                {
                    Descripcion = "Aceite",
                    Cantidad = 2,
                    Precio = 50,
                },
            ],
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(presupuestoDetalle);

        // Act
        var resultado = await _servicio.ObtenerDetallePorIdAsync(1);

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Cliente.Should().NotBeNull();
        resultado.Materiales.Should().NotBeEmpty();
    }

    #endregion

    #region ObtenerPorClienteAsync

    [Fact]
    public async Task ObtenerPorClienteAsync_DeberiaRetornarPresupuestosDelCliente()
    {
        // Arrange
        var presupuestosCliente = new List<Presupuesto>
        {
            new()
            {
                Id = 1,
                IdCliente = 5,
                Titulo = "Presupuesto 1 Cliente 5",
            },
            new()
            {
                Id = 2,
                IdCliente = 5,
                Titulo = "Presupuesto 2 Cliente 5",
            },
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerPorClienteAsync(5))
            .ReturnsAsync(presupuestosCliente);

        // Act
        var resultado = await _servicio.ObtenerPorClienteAsync(5);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(p => p.IdCliente == 5).Should().BeTrue();
    }

    #endregion

    #region ObtenerPorEstadoAsync

    [Fact]
    public async Task ObtenerPorEstadoAsync_DeberiaRetornarPresupuestosFiltrados()
    {
        // Arrange
        var presupuestosAprobados = new List<Presupuesto>
        {
            new()
            {
                Id = 1,
                Titulo = "Presupuesto Aprobado 1",
                Estado = EstadoPresupuesto.Aceptado,
            },
            new()
            {
                Id = 2,
                Titulo = "Presupuesto Aprobado 2",
                Estado = EstadoPresupuesto.Aceptado,
            },
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerPorEstadoAsync(EstadoPresupuesto.Aceptado))
            .ReturnsAsync(presupuestosAprobados);

        // Act
        var resultado = await _servicio.ObtenerPorEstadoAsync(EstadoPresupuesto.Aceptado);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(p => p.Estado == EstadoPresupuesto.Aceptado).Should().BeTrue();
    }

    #endregion

    #region ListarPresupuestos

    [Fact]
    public async Task ListarPresupuestos_DeberiaRetornarTodosLosPresupuestos()
    {
        // Arrange
        var todosPresupuestos = new List<Presupuesto>
        {
            new() { Id = 1, Titulo = "Presupuesto 1" },
            new() { Id = 2, Titulo = "Presupuesto 2" },
            new() { Id = 3, Titulo = "Presupuesto 3" },
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ListarPresupuestos())
            .ReturnsAsync(todosPresupuestos);

        // Act
        var resultado = await _servicio.ListarPresupuestos();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(3);
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarPresupuesto()
    {
        // Arrange
        var presupuestoExistente = new Presupuesto
        {
            Id = 1,
            Titulo = "Título Original",
            Estado = EstadoPresupuesto.Pendiente,
            HorasEstimadas = 10,
            IdCliente = 5,
            Materiales = new List<Material>(),
        };

        var presupuestoModificado = new ModificarPresupuesto
        {
            Titulo = "Título Modificado",
            Estado = EstadoPresupuesto.Aceptado,
            HorasEstimadas = 15,
        };

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(presupuestoExistente);

        _presupuestoRepositorioMock.Setup(x => x.ObtenerCostoHoraDeTrabajo()).ReturnsAsync(100m);

        _presupuestoRepositorioMock
            .Setup(x => x.ActualizarAsync(It.IsAny<Presupuesto>()))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarAsync(1, presupuestoModificado);

        // Assert
        _presupuestoRepositorioMock.Verify(x => x.ObtenerDetallePorIdAsync(1), Times.Once);
        _presupuestoRepositorioMock.Verify(
            x =>
                x.ActualizarAsync(
                    It.Is<Presupuesto>(p =>
                        p.Titulo == "Título Modificado" && p.Estado == EstadoPresupuesto.Aceptado
                    )
                ),
            Times.Once
        );
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarPresupuesto()
    {
        // Arrange
        _presupuestoRepositorioMock.Setup(x => x.EliminarAsync(1)).Returns(Task.CompletedTask);

        // Act
        await _servicio.EliminarAsync(1);

        // Assert
        _presupuestoRepositorioMock.Verify(x => x.EliminarAsync(1), Times.Once);
    }

    #endregion

    #region ActualizarCostoHoraDeTrabajo

    [Fact]
    public async Task ActualizarCostoHoraDeTrabajo_DeberiaActualizarElCosto()
    {
        // Arrange
        _presupuestoRepositorioMock
            .Setup(x => x.ActualizarCostoHoraDeTrabajo(150.50m))
            .Returns(Task.CompletedTask);

        // Act
        await _servicio.ActualizarCostoHoraDeTrabajo(150.50m);

        // Assert
        _presupuestoRepositorioMock.Verify(
            x => x.ActualizarCostoHoraDeTrabajo(150.50m),
            Times.Once
        );
    }

    #endregion

    #region ObtenerCostoHoraDeTrabajo

    [Fact]
    public async Task ObtenerCostoHoraDeTrabajo_DeberiaRetornarElCostoActual()
    {
        // Arrange
        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerCostoHoraDeTrabajo())
            .ReturnsAsync(125.50m);

        // Act
        var resultado = await _servicio.ObtenerCostoHoraDeTrabajo();

        // Assert
        resultado.Should().Be(125.50m);
    }

    #endregion
}
