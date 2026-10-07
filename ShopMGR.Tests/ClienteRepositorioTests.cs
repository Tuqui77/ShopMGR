using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using ShopMGR.Tests.TestBuilders;
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

        var nuevoCliente = TestDataFactory.Cliente.CreateValid();

        // Act
        var resultado = await repositorio.CrearAsync(nuevoCliente);

        // Assert
        resultado.Should().NotBeNull();
        resultado.NombreCompleto.Should().Be("Cliente Test");
        resultado.Id.Should().BeGreaterThan(0);

        var clienteEnDb = await contexto.Clientes.FirstOrDefaultAsync(c =>
            c.NombreCompleto == "Cliente Test"
        );
        clienteEnDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoClienteYaExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var clienteExistente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        await contexto.Clientes.AddAsync(clienteExistente);
        await contexto.SaveChangesAsync();

        var nuevoCliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();

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

        var clientes = TestDataFactory.CreateClientes(3);
        await contexto.Clientes.AddRangeAsync(clientes);
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

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
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

        var cliente = TestDataFactory.Cliente
            .WithNombre("Juan Perez")
            .WithTelefonos(new List<TelefonoCliente>
            {
                TestDataFactory.CreateTelefono("1234567890")
            })
            .WithDirecciones(new List<Direccion>
            {
                TestDataFactory.CreateDireccion("Calle Falsa")
            })
            .CreateValid();
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

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
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

        var clientes = new List<Cliente>
        {
            TestDataFactory.Cliente.WithNombre("Cliente Positivo").CreateValid(),
            TestDataFactory.Cliente.WithNombre("Cliente Negativo").CreateValid(),
            TestDataFactory.Cliente.WithNombre("Cliente Cero").CreateValid(),
            TestDataFactory.Cliente.WithNombre("Cliente Muy Negativo").CreateValid()
        };
        await contexto.Clientes.AddRangeAsync(clientes);
        await contexto.SaveChangesAsync();

        // Agregar movimientos para que el balance se calcule correctamente
        var clientesEnDb = await contexto.Clientes.ToListAsync();
        foreach (var c in clientesEnDb)
        {
            var (tipo, monto) = c.NombreCompleto switch
            {
                string n when n.Contains("Positivo") => (TipoMovimiento.Pago, 100m),
                string n when n.Contains("Negativo") => (TipoMovimiento.Cargo, 50m),
                string n when n.Contains("Muy Negativo") => (TipoMovimiento.Cargo, 200m),
                _ => (TipoMovimiento.Pago, 0m),
            };

            var movimiento = TestDataFactory.CreateMovimiento(tipo, monto, c.Id);
            await contexto.MovimientoBalance.AddAsync(movimiento);
        }
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.BuscarSaldosNegativosAsync();

        // Assert
        resultado.Should().NotBeNull();
        resultado.Should().HaveCount(2);
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        cliente.NombreCompleto = "Juan Perez Actualizado";

        // Act
        await repositorio.ActualizarAsync(cliente);

        // Assert
        var clienteActualizado = await contexto.Clientes.FindAsync(cliente.Id);
        clienteActualizado!.NombreCompleto.Should().Be("Juan Perez Actualizado");
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new ClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
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
