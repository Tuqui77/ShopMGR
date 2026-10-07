using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Dominio.Enums;
using FluentAssertions;
using ShopMGR.Tests.TestBuilders;
using Xunit;

namespace ShopMGR.Tests;

public class PresupuestoRepositorioTests
{
    private ShopMGRDbContexto CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ShopMGRDbContexto>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ShopMGRDbContexto(options);
    }

    #region CrearAsync

    [Fact]
    public async Task CrearAsync_DeberiaCrearPresupuesto()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act
        var resultado = await repositorio.CrearAsync(presupuesto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Titulo.Should().Be("Reparación");
        resultado.Id.Should().BeGreaterThan(0);

        var presupuestoEnDb = await contexto.Presupuestos.FirstOrDefaultAsync(p => p.Titulo == "Reparación");
        presupuestoEnDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CrearAsync_DeberiaCrearPresupuestoConMateriales()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var materiales = TestDataFactory.CreateMateriales(2);
        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .WithMateriales(materiales)
            .CreateValid();

        // Act
        var resultado = await repositorio.CrearAsync(presupuesto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Materiales.Should().HaveCount(2);

        var materialesEnDb = await contexto.Materiales.Where(m => m.IdPresupuesto == resultado.Id).ToListAsync();
        materialesEnDb.Should().HaveCount(2);
    }

    #endregion

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarPresupuestoCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Presupuestos.AddAsync(presupuesto);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorIdAsync(presupuesto.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Titulo.Should().Be("Reparación");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.ObtenerPorIdAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarPresupuestoConRelaciones()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var materiales = new List<Material> { TestDataFactory.Material.CreateValid() };
        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .WithMateriales(materiales)
            .CreateValid();
        await contexto.Presupuestos.AddAsync(presupuesto);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerDetallePorIdAsync(presupuesto.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Cliente.Should().NotBeNull();
        resultado.Cliente.NombreCompleto.Should().Be("Juan Perez");
    }

    #endregion

    #region ObtenerPorClienteAsync

    [Fact]
    public async Task ObtenerPorClienteAsync_DeberiaRetornarPresupuestosDelCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente1 = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        var cliente2 = TestDataFactory.Cliente.WithNombre("Maria Lopez").CreateValid();
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        var presupuestos = new List<Presupuesto>
        {
            TestDataFactory.Presupuesto.WithTitulo("Presupuesto 1").WithIdCliente(cliente1.Id).CreateValid(),
            TestDataFactory.Presupuesto.WithTitulo("Presupuesto 2").WithIdCliente(cliente1.Id).CreateValid(),
            TestDataFactory.Presupuesto.WithTitulo("Presupuesto 3").WithIdCliente(cliente2.Id).CreateValid()
        };
        await contexto.Presupuestos.AddRangeAsync(presupuestos);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorClienteAsync(cliente1.Id);

        // Assert
        resultado.Should().HaveCount(2);
    }

    #endregion

    #region ObtenerPorEstadoAsync

    [Fact]
    public async Task ObtenerPorEstadoAsync_DeberiaRetornarPresupuestosFiltrados()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var pendiente = TestDataFactory.Presupuesto
            .WithTitulo("Presupuesto 1")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        var aceptado1 = TestDataFactory.Presupuesto
            .WithTitulo("Presupuesto 2")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        aceptado1.AceptarPresupuesto();

        var aceptado2 = TestDataFactory.Presupuesto
            .WithTitulo("Presupuesto 3")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        aceptado2.AceptarPresupuesto();

        await contexto.Presupuestos.AddRangeAsync(pendiente, aceptado1, aceptado2);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorEstadoAsync(EstadoPresupuesto.Aceptado);

        // Assert
        resultado.Should().HaveCount(2);
        resultado.Should().AllSatisfy(p => p.Estado.Should().Be(EstadoPresupuesto.Aceptado));
    }

    #endregion

    #region ListarPresupuestos

    [Fact]
    public async Task ListarPresupuestos_DeberiaRetornarTodosLosPresupuestos()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var p1 = TestDataFactory.Presupuesto
            .WithTitulo("Presupuesto 1")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        var p2 = TestDataFactory.Presupuesto
            .WithTitulo("Presupuesto 2")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        p2.AceptarPresupuesto();

        await contexto.Presupuestos.AddRangeAsync(p1, p2);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ListarPresupuestos();

        // Assert
        resultado.Should().HaveCount(2);
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarPresupuesto()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Presupuestos.AddAsync(presupuesto);
        await contexto.SaveChangesAsync();

        presupuesto.Editar(cliente.Id, "Título Actualizado", "", 0, [], 0);
        presupuesto.AceptarPresupuesto();

        // Act
        await repositorio.ActualizarAsync(presupuesto);

        // Assert
        var presupuestoEnDb = await contexto.Presupuestos.FindAsync(presupuesto.Id);
        presupuestoEnDb.Should().NotBeNull();
        presupuestoEnDb.Titulo.Should().Be("Título Actualizado");
        presupuestoEnDb.Estado.Should().Be(EstadoPresupuesto.Aceptado);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarPresupuesto()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var presupuesto = TestDataFactory.Presupuesto
            .WithTitulo("Para Eliminar")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Presupuestos.AddAsync(presupuesto);
        await contexto.SaveChangesAsync();

        // Act
        await repositorio.EliminarAsync(presupuesto.Id);

        // Assert
        var presupuestoEnDb = await contexto.Presupuestos.FindAsync(presupuesto.Id);
        presupuestoEnDb.Should().BeNull();
    }

    [Fact]
    public async Task EliminarAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.EliminarAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ActualizarCostoHoraDeTrabajo

    [Fact]
    public async Task ActualizarCostoHoraDeTrabajo_DeberiaActualizarConfiguracionExistente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var configuracion = new ConfiguracionGlobal
        {
            Clave = "ValorHoraDeTrabajo",
            Valor = 100m
        };
        await contexto.Configuraciones.AddAsync(configuracion);
        await contexto.SaveChangesAsync();

        // Act
        await repositorio.ActualizarCostoHoraDeTrabajo(150m);

        // Assert
        var configEnDb = await contexto.Configuraciones.FirstOrDefaultAsync(c => c.Clave == "ValorHoraDeTrabajo");
        configEnDb.Should().NotBeNull();
        configEnDb.Valor.Should().Be(150m);
    }

    [Fact]
    public async Task ActualizarCostoHoraDeTrabajo_DeberiaCrearConfiguracionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        // Act
        await repositorio.ActualizarCostoHoraDeTrabajo(200m);

        // Assert
        var configEnDb = await contexto.Configuraciones.FirstOrDefaultAsync(c => c.Clave == "ValorHoraDeTrabajo");
        configEnDb.Should().NotBeNull();
        configEnDb.Valor.Should().Be(200m);
    }

    #endregion

    #region ObtenerCostoHoraDeTrabajo

    [Fact]
    public async Task ObtenerCostoHoraDeTrabajo_DeberiaRetornarElCosto()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        var configuracion = new ConfiguracionGlobal
        {
            Clave = "ValorHoraDeTrabajo",
            Valor = 250m
        };
        await contexto.Configuraciones.AddAsync(configuracion);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerCostoHoraDeTrabajo();

        // Assert
        resultado.Should().Be(250m);
    }

    [Fact]
    public async Task ObtenerCostoHoraDeTrabajo_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new PresupuestoRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.ObtenerCostoHoraDeTrabajo())
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion
}
