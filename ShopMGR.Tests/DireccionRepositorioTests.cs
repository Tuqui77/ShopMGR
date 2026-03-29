using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using FluentAssertions;
using Xunit;

namespace ShopMGR.Tests;

public class DireccionRepositorioTests
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
    public async Task CrearAsync_DeberiaCrearDireccion()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = cliente.Id
        };

        // Act
        var resultado = await repositorio.CrearAsync(direccion);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Calle.Should().Be("Av. Principal");
        resultado.Id.Should().BeGreaterThan(0);

        var direccionEnDb = await contexto.Direccion.FirstOrDefaultAsync(d => d.Calle == "Av. Principal");
        direccionEnDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoClienteNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var direccion = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = 999
        };

        // Act & Assert
        await repositorio.Invoking(r => r.CrearAsync(direccion))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarDireccionCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorIdAsync(direccion.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Calle.Should().Be("Av. Principal");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.ObtenerPorIdAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarDireccionConCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerDetallePorIdAsync(direccion.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Cliente.Should().NotBeNull();
        resultado.Cliente.NombreCompleto.Should().Be("Juan Perez");
    }

    #endregion

    #region ObtenerPorIdCliente

    [Fact]
    public async Task ObtenerPorIdCliente_DeberiaRetornarDireccionesDelCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente1 = new Cliente { NombreCompleto = "Juan Perez" };
        var cliente2 = new Cliente { NombreCompleto = "Maria Lopez" };
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        await contexto.Direccion.AddRangeAsync(
            new Direccion { Calle = "Calle 1", Altura = "10", IdCliente = cliente1.Id },
            new Direccion { Calle = "Calle 2", Altura = "20", IdCliente = cliente1.Id },
            new Direccion { Calle = "Calle 3", Altura = "30", IdCliente = cliente2.Id }
        );
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorIdCliente(cliente1.Id);

        // Assert
        resultado.Should().HaveCount(2);
    }

    #endregion

    #region ObtenerPorCalleYAlturaAsync

    [Fact]
    public async Task ObtenerPorCalleYAlturaAsync_DeberiaRetornarDireccion()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorCalleYAlturaAsync("Av. Principal", "123");

        // Assert
        resultado.Should().NotBeNull();
        resultado.Calle.Should().Be("Av. Principal");
    }

    [Fact]
    public async Task ObtenerPorCalleYAlturaAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.ObtenerPorCalleYAlturaAsync("Calle Falsa", "999"))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarDireccion()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Calle Original",
            Altura = "100",
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion);
        await contexto.SaveChangesAsync();

        direccion.Calle = "Calle Actualizada";
        direccion.Piso = "A";

        // Act
        await repositorio.ActualizarAsync(direccion);

        // Assert
        var direccionEnDb = await contexto.Direccion.FindAsync(direccion.Id);
        direccionEnDb.Should().NotBeNull();
        direccionEnDb.Calle.Should().Be("Calle Actualizada");
        direccionEnDb.Piso.Should().Be("A");
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarDireccion()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion = new Direccion
        {
            Calle = "Para Eliminar",
            Altura = "999",
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion);
        await contexto.SaveChangesAsync();

        // Act
        await repositorio.EliminarAsync(direccion.Id);

        // Assert
        var direccionEnDb = await contexto.Direccion.FindAsync(direccion.Id);
        direccionEnDb.Should().BeNull();
    }

    [Fact]
    public async Task EliminarAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.EliminarAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region Validar

    [Fact]
    public async Task Validar_DeberiaLanzarExcepcionCuandoDireccionDuplicadaSinPiso()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion1 = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            Piso = null,
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion1);
        await contexto.SaveChangesAsync();

        var direccion2 = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            Piso = null,
            IdCliente = cliente.Id
        };

        // Act & Assert
        await repositorio.Invoking(r => r.Validar(direccion2))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Validar_NoDeberiaLanzarExcepcionCuandoDireccionTienePiso()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new DireccionRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var direccion1 = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            Piso = null,
            IdCliente = cliente.Id
        };
        await contexto.Direccion.AddAsync(direccion1);
        await contexto.SaveChangesAsync();

        var direccion2 = new Direccion
        {
            Calle = "Av. Principal",
            Altura = "123",
            Piso = "A",
            IdCliente = cliente.Id
        };

        // Act & Assert
        await repositorio.Invoking(r => r.Validar(direccion2))
            .Should().NotThrowAsync<InvalidOperationException>();
    }

    #endregion
}
