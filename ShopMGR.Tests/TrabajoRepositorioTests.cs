using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Dominio.Enums;
using FluentAssertions;
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var nuevoTrabajo = new Trabajo
        {
            Titulo = "Reparación de Motor",
            IdCliente = cliente.Id,
            Estado = EstadoTrabajo.Pendiente
        };

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        await contexto.Trabajos.AddRangeAsync(
            new Trabajo { Titulo = "Trabajo 1", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente },
            new Trabajo { Titulo = "Trabajo 2", IdCliente = cliente.Id, Estado = EstadoTrabajo.Iniciado },
            new Trabajo { Titulo = "Trabajo 3", IdCliente = cliente.Id, Estado = EstadoTrabajo.Terminado }
        );
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo { Titulo = "Reparación", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente };
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
        var accion = () => repositorio.ObtenerPorIdAsync(999);
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo
        {
            Titulo = "Reparación Completa",
            IdCliente = cliente.Id,
            Estado = EstadoTrabajo.Pendiente,
            Fotos = new List<Foto> { new Foto { Enlace = "foto1.jpg" } }
        };
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

        var cliente1 = new Cliente { NombreCompleto = "Cliente 1" };
        var cliente2 = new Cliente { NombreCompleto = "Cliente 2" };
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        await contexto.Trabajos.AddRangeAsync(
            new Trabajo { Titulo = "Trabajo Cliente 1 - 1", IdCliente = cliente1.Id, Estado = EstadoTrabajo.Pendiente },
            new Trabajo { Titulo = "Trabajo Cliente 1 - 2", IdCliente = cliente1.Id, Estado = EstadoTrabajo.Terminado },
            new Trabajo { Titulo = "Trabajo Cliente 2", IdCliente = cliente2.Id, Estado = EstadoTrabajo.Pendiente }
        );
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        await contexto.Trabajos.AddRangeAsync(
            new Trabajo { Titulo = "Trabajo Pendiente", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente },
            new Trabajo { Titulo = "Otro Pendiente", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente },
            new Trabajo { Titulo = "Trabajo Terminado", IdCliente = cliente.Id, Estado = EstadoTrabajo.Terminado }
        );
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo { Titulo = "Reparación", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente };
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();

        var fotos = new List<Foto>
        {
            new Foto { Enlace = "foto1.jpg", IdTrabajo = trabajo.Id },
            new Foto { Enlace = "foto2.jpg", IdTrabajo = trabajo.Id }
        };

        // Act
        await repositorio.AgregarFotosAsync(fotos);

        // Assert
        var trabajoConFotos = await contexto.Trabajos
            .Include(t => t.Fotos)
            .FirstOrDefaultAsync(t => t.Id == trabajo.Id);
        trabajoConFotos!.Fotos.Should().HaveCount(2);
    }

    [Fact]
    public async Task AgregarFotosAsync_DeberiaLanzarExcepcionCuandoTrabajoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var fotos = new List<Foto>
        {
            new Foto { Enlace = "foto1.jpg", IdTrabajo = 999 }
        };

        // Act & Assert
        var accion = () => repositorio.AgregarFotosAsync(fotos);
        await accion.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No existe un trabajo con el Id 999*");
    }

    #endregion

    #region AgregarHorasAsync

    [Fact]
    public async Task AgregarHorasAsync_DeberiaAgregarHorasAlTrabajo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TrabajoRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo { Titulo = "Reparación", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente };
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo { Titulo = "Título Original", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente };
        await contexto.Trabajos.AddAsync(trabajo);
        await contexto.SaveChangesAsync();

        trabajo.Titulo = "Título Modificado";
        trabajo.Estado = EstadoTrabajo.Terminado;

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var trabajo = new Trabajo { Titulo = "Trabajo", IdCliente = cliente.Id, Estado = EstadoTrabajo.Pendiente };
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
        var accion = () => repositorio.EliminarAsync(999);
        await accion.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No existe un trabajo con el Id 999*");
    }

    #endregion
}
