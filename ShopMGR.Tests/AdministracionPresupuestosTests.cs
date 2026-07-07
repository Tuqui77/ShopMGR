using System.Reflection;
using FluentAssertions;
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

/// <summary>
/// Stub mapper para MaterialDTO -> Material usado en los tests
/// </summary>
public class MaterialDTOtoMaterialMapper : IMapper<MaterialDTO, Material>
{
    public Material Map(MaterialDTO origen) => new()
    {
        Descripcion = origen.Descripcion,
        Cantidad = origen.Cantidad,
        Precio = origen.Precio,
    };

    public IEnumerable<Material> Map(IEnumerable<MaterialDTO> origen) =>
        origen.Select(Map);
}

public class AdministracionPresupuestosTests
{
    private readonly Mock<IRepositorioConValorHora> _presupuestoRepositorioMock;
    private readonly Mock<IAdministrarTrabajos> _administrarTrabajosMock;
    private readonly AdministracionPresupuestos _servicio;

    public AdministracionPresupuestosTests()
    {
        _presupuestoRepositorioMock = new Mock<IRepositorioConValorHora>();
        _administrarTrabajosMock = new Mock<IAdministrarTrabajos>();

        // Configurar ServiceProvider con los mappers necesarios
        var services = new ServiceCollection();
        services.AddSingleton<IMapper<MaterialDTO, Material>, MaterialDTOtoMaterialMapper>();
        var serviceProvider = services.BuildServiceProvider();
        var mapperRegistry = new MapperRegistry(serviceProvider);

        _servicio = new AdministracionPresupuestos(_presupuestoRepositorioMock.Object, mapperRegistry, _administrarTrabajosMock.Object);
    }

    /// <summary>
    /// Helper para crear Presupuesto con Id y Cliente (setters privados, necesario para mocks)
    /// </summary>
    private static Presupuesto CrearPresupuestoConId(int id, string titulo, int idCliente = 0, EstadoPresupuesto? estado = null, Cliente? cliente = null, List<Material>? materiales = null)
    {
        var p = new Presupuesto(titulo, null, materiales ?? [], 0, idCliente);
        SetPrivateProperty(p, nameof(Presupuesto.Id), id);

        if (cliente != null)
            SetPrivateProperty(p, nameof(Presupuesto.Cliente), cliente);

        if (estado == EstadoPresupuesto.Aceptado)
            p.AceptarPresupuesto();
        else if (estado == EstadoPresupuesto.Rechazado)
            p.RechazarPresupuesto();

        return p;
    }

    private static void SetPrivateProperty<T, TValue>(T obj, string propertyName, TValue value)
    {
        typeof(T).GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance)!
            .SetValue(obj, value);
    }

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarPresupuestoCuandoExiste()
    {
        // Arrange
        var presupuestoEsperado = CrearPresupuestoConId(1, "Presupuesto de reparación");

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
        var presupuestoDetalle = CrearPresupuestoConId(
            1, "Presupuesto detallado", idCliente: 5,
            cliente: new Cliente { Id = 5, NombreCompleto = "Cliente X" },
            materiales: [new Material { Descripcion = "Aceite", Cantidad = 2, Precio = 50 }]
        );

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
            CrearPresupuestoConId(1, "Presupuesto 1 Cliente 5", idCliente: 5),
            CrearPresupuestoConId(2, "Presupuesto 2 Cliente 5", idCliente: 5),
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
            CrearPresupuestoConId(1, "Presupuesto Aprobado 1", estado: EstadoPresupuesto.Aceptado),
            CrearPresupuestoConId(2, "Presupuesto Aprobado 2", estado: EstadoPresupuesto.Aceptado),
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
            CrearPresupuestoConId(1, "Presupuesto 1", cliente: new Cliente { Id = 1, NombreCompleto = "Cliente 1" }),
            CrearPresupuestoConId(2, "Presupuesto 2", cliente: new Cliente { Id = 2, NombreCompleto = "Cliente 2" }),
            CrearPresupuestoConId(3, "Presupuesto 3", cliente: new Cliente { Id = 3, NombreCompleto = "Cliente 3" }),
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
        var presupuestoModificado = new ModificarPresupuesto
        {
            IdCliente = 5,
            Titulo = "Título Modificado",
            Descripcion = "",
            HorasEstimadas = 15,
            Materiales = [],
        };

        var presupuestoExistente = CrearPresupuestoConId(1, "Título Original", idCliente: 5);

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerDetallePorIdAsync(1))
            .ReturnsAsync(presupuestoExistente);

        _presupuestoRepositorioMock
            .Setup(x => x.ObtenerCostoHoraDeTrabajo())
            .ReturnsAsync(0m);

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
                        p.Titulo == "Título Modificado"
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
