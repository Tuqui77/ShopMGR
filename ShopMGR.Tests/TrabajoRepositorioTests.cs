using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Dominio.Enums;
using FluentAssertions;
using ShopMGR.Tests.TestBuilders;
using Xunit;

namespace ShopMGR.Tests;

public class TrabajoRepositorioTests
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
    public async Task CrearAsync_DeberiaCrearTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var nuevoTrabajo = TestDataFactory.Trabajo
            .WithTitulo("Reparación de Motor")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act
        var resultado = await repositorio.CrearAsync(nuevoTrabajo);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Titulo.Should().Be("Reparación de Motor");
        resultado.Id.Should().BeGreaterThan(0);
    }

    #endregion

    #region ListarTodosAsync

    [Fact]
    public async Task ListarTodosAsync_DeberiaRetornarTodosLosTrabajos()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajos = new List<Trabajo>
        {
            TestDataFactory.Trabajo.WithTitulo("Trabajo 1").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Pendiente).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Trabajo 2").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Iniciado).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Trabajo 3").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Terminado).CreateValid()
        };
        await contexto.Trabajos.AddRangeAsync(trabajos);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ListarTodosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(3);
    }

    #endregion

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarTrabajoCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();
        var id = trabajo.Id;

        // Act
        var resultado = await repositorio.ObtenerPorIdAsync(id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Titulo.Should().Be("Reparación");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        // Act & Assert
        Func<Task> accion = () => repositorio.ObtenerPorIdAsync(999);
        await accion.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No existe un trabajo con el Id 999*");
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarTrabajoConRelaciones()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Reparación Completa")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        trabajo.AgregarFotos(new List<Foto> { new Foto(1, "/fotos/foto1.jpg") });
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();
        var id = trabajo.Id;

        // Act
        var resultado = await repositorio.ObtenerDetallePorIdAsync(id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Cliente.Should().NotBeNull();
        resultado.Fotos.Should().NotBeEmpty();
    }

    #endregion

    #region ObtenerPorClienteAsync

    [Fact]
    public async Task ObtenerPorClienteAsync_DeberiaRetornarTrabajosDelCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente1 = TestDataFactory.Cliente.WithNombre("Cliente 1").CreateValid();
        var cliente2 = TestDataFactory.Cliente.WithNombre("Cliente 2").CreateValid();
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        var trabajos = new List<Trabajo>
        {
            TestDataFactory.Trabajo.WithTitulo("Trabajo Cliente 1 - 1").WithIdCliente(cliente1.Id).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Trabajo Cliente 1 - 2").WithIdCliente(cliente1.Id).WithEstado(EstadoTrabajo.Terminado).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Trabajo Cliente 2").WithIdCliente(cliente2.Id).CreateValid()
        };
        await contexto.Trabajos.AddRangeAsync(trabajos);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorClienteAsync(cliente1.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(t => t.IdCliente == cliente1.Id).Should().BeTrue();
    }

    #endregion

    #region ObtenerPorEstadoAsync

    [Fact]
    public async Task ObtenerPorEstadoAsync_DeberiaRetornarTrabajosFiltradosPorEstado()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajos = new List<Trabajo>
        {
            TestDataFactory.Trabajo.WithTitulo("Trabajo Pendiente").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Pendiente).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Otro Pendiente").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Pendiente).CreateValid(),
            TestDataFactory.Trabajo.WithTitulo("Trabajo Terminado").WithIdCliente(cliente.Id).WithEstado(EstadoTrabajo.Terminado).CreateValid()
        };
        await contexto.Trabajos.AddRangeAsync(trabajos);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorEstadoAsync(EstadoTrabajo.Pendiente);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(t => t.Estado == EstadoTrabajo.Pendiente).Should().BeTrue();
    }

    #endregion

    #region AgregarFotosAsync

    [Fact]
    public async Task AgregarFotosAsync_DeberiaAgregarFotosAlTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();

        var fotos = new List<Foto>
        {
            new Foto(trabajo.Id, "/fotos/foto1.jpg"),
            new Foto(trabajo.Id, "/fotos/foto2.jpg")
        };

        // Act
        trabajo.AgregarFotos(fotos);
        await repositorio.ActualizarAsync(trabajo);

        // Assert
        var trabajoConFotos = await contexto.Trabajos
            .Include(t => t.Fotos)
            .FirstOrDefaultAsync(t => t.Id == trabajo.Id);
        trabajoConFotos!.Fotos.Should().HaveCount(2);
    }

    #endregion

    #region AgregarHorasAsync

    [Fact]
    public async Task AgregarHorasAsync_DeberiaAgregarHorasAlTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Reparación")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();

        var horas = new HorasYDescripcion
        {
            IdTrabajo = trabajo.Id,
            Horas = 5.5f,
            Descripcion = "Trabajo realizado"
        };

        // Act
        await repositorio.AgregarHorasAsync(horas);

        // Assert
        var horasEnDb = await contexto.HorasYDescripcion.FirstOrDefaultAsync(h => h.IdTrabajo == trabajo.Id);
        horasEnDb.Should().NotBeNull();
        horasEnDb!.Horas.Should().Be(5.5f);
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Título Original")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();

        trabajo.Editar("Título Modificado", null, trabajo.IdCliente);
        trabajo.TerminarTrabajo();

        // Act
        await repositorio.ActualizarAsync(trabajo);

        // Assert
        var trabajoActualizado = await contexto.Trabajos.FindAsync(trabajo.Id);
        trabajoActualizado!.Titulo.Should().Be("Título Modificado");
        trabajoActualizado.Estado.Should().Be(EstadoTrabajo.Terminado);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = TestDataFactory.Trabajo
            .WithTitulo("Trabajo")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();
        var id = trabajo.Id;

        // Act
        await repositorio.EliminarAsync(id);

        // Assert
        var trabajoEliminado = await contexto.Trabajos.FindAsync(id);
        trabajoEliminado.Should().BeNull();
    }

    [Fact]
    public async Task EliminarAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        // Act & Assert
        Func<Task> accion = () => repositorio.EliminarAsync(999);
        await accion.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No existe un trabajo con el Id 999*");
    }

    #endregion
}
