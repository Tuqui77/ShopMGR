using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using Xunit;

namespace ShopMGR.Tests;

public class ClienteRepositorioTests
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
    public async Task CrearAsync_DeberiaCrearClienteCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var nuevoCliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 0 };

        // Act
        var resultado = await repositorio.CrearAsync(nuevoCliente);

        // Assert
        resultado.Should().NotBeNull();
        resultado.NombreCompleto.Should().Be("Juan Perez");
        resultado.Id.Should().BeGreaterThan(0);

        var clienteEnDb = await contexto.Clientes.FirstOrDefaultAsync(c =>
            c.NombreCompleto == "Juan Perez"
        );
        clienteEnDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoClienteYaExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var clienteExistente = new Cliente { NombreCompleto = "Juan Perez", Balance = 0 };
        await contexto.Clientes.AddAsync(clienteExistente);
        await contexto.SaveChangesAsync();

        var nuevoCliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 100 };

        // Act & Assert
        var accion = () => repositorio.CrearAsync(nuevoCliente);
        await accion
            .Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*Ya existe un cliente*");
    }

    #endregion

    #region ListarTodosAsync

    [Fact]
    public async Task ListarTodosAsync_DeberiaRetornarTodosLosClientes()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        await contexto.Clientes.AddRangeAsync(
            new Cliente { NombreCompleto = "Cliente 1", Balance = 100 },
            new Cliente { NombreCompleto = "Cliente 2", Balance = 200 },
            new Cliente { NombreCompleto = "Cliente 3", Balance = 300 }
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
    public async Task ObtenerPorIdAsync_DeberiaRetornarClienteCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 100 };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();
        var id = cliente.Id;

        // Act
        var resultado = await repositorio.ObtenerPorIdAsync(id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.NombreCompleto.Should().Be("Juan Perez");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        // Act & Assert
        var accion = () => repositorio.ObtenerPorIdAsync(999);
        await accion
            .Should()
            .ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No se encontró un cliente con el ID 999*");
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarClienteConRelaciones()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = new Cliente
        {
            NombreCompleto = "Juan Perez",
            Balance = 100,
            Telefono = new List<TelefonoCliente>
            {
                new TelefonoCliente { Telefono = "1234567890" },
            },
            Direccion = new List<Direccion>
            {
                new Direccion { Calle = "Calle Falsa", Altura = "123" },
            },
        };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();
        var id = cliente.Id;

        // Act
        var resultado = await repositorio.ObtenerDetallePorIdAsync(id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Telefono.Should().NotBeEmpty();
        resultado.Direccion.Should().NotBeEmpty();
    }

    #endregion

    #region ObtenerPorNombreAsync

    [Fact]
    public async Task ObtenerPorNombreAsync_DeberiaRetornarClienteCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 100 };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorNombreAsync("Juan Perez");

        // Assert
        resultado.Should().NotBeNull();
        resultado.NombreCompleto.Should().Be("Juan Perez");
    }

    [Fact]
    public async Task ObtenerPorNombreAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        // Act & Assert
        var accion = () => repositorio.ObtenerPorNombreAsync("NoExiste");
        await accion
            .Should()
            .ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No existe un cliente con ese nombre*");
    }

    #endregion

    #region BuscarSaldosNegativosAsync

    [Fact]
    public async Task BuscarSaldosNegativosAsync_DeberiaRetornarSoloClientesConBalanceNegativo()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        await contexto.Clientes.AddRangeAsync(
            new Cliente { NombreCompleto = "Cliente Positivo", Balance = 100 },
            new Cliente { NombreCompleto = "Cliente Negativo", Balance = -50 },
            new Cliente { NombreCompleto = "Cliente Cero", Balance = 0 },
            new Cliente { NombreCompleto = "Cliente Muy Negativo", Balance = -200 }
        );
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.BuscarSaldosNegativosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
        resultado.All(c => c.Balance < 0).Should().BeTrue();
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 100 };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        cliente.NombreCompleto = "Juan Perez Actualizado";
        cliente.Balance = 200;

        // Act
        await repositorio.ActualizarAsync(cliente);

        // Assert
        var clienteActualizado = await contexto.Clientes.FindAsync(cliente.Id);
        clienteActualizado!.NombreCompleto.Should().Be("Juan Perez Actualizado");
        clienteActualizado.Balance.Should().Be(200);
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = new Cliente { NombreCompleto = "Juan Perez", Balance = 100 };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();
        var id = cliente.Id;

        // Act
        await repositorio.EliminarAsync(id);

        // Assert
        var clienteEliminado = await contexto.Clientes.FindAsync(id);
        clienteEliminado.Should().BeNull();
    }

    [Fact]
    public async Task EliminarAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        // Act & Assert
        var accion = () => repositorio.EliminarAsync(999);
        await accion
            .Should()
            .ThrowAsync<KeyNotFoundException>()
            .WithMessage("*No se encontró un cliente con el ID 999*");
    }

    #endregion
}
