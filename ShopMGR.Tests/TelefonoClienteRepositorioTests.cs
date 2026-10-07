using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using FluentAssertions;
using ShopMGR.Tests.TestBuilders;
using Xunit;

namespace ShopMGR.Tests;

public class TelefonoClienteRepositorioTests
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
    public async Task CrearAsync_DeberiaCrearTelefono()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act
        var resultado = await repositorio.CrearAsync(telefono);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Telefono.Should().Be("1234567890");
        resultado.Id.Should().BeGreaterThan(0);

        var telefonoEnDb = await contexto.TelefonoCliente.FirstOrDefaultAsync(t => t.Telefono == "1234567890");
        telefonoEnDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoClienteNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(999)
            .CreateValid();

        // Act & Assert
        await repositorio.Invoking(r => r.CrearAsync(telefono))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoTelefonoYaExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono1 = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono1);
        await contexto.SaveChangesAsync();

        var telefono2 = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Otro")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act & Assert
        await repositorio.Invoking(r => r.CrearAsync(telefono2))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task CrearAsync_DeberiaLanzarExcepcionCuandoTelefonoNoTiene10Digitos()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("12345")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act & Assert
        await repositorio.Invoking(r => r.CrearAsync(telefono))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion

    #region ObtenerPorIdAsync

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaRetornarTelefonoCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorIdAsync(telefono.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Telefono.Should().Be("1234567890");
    }

    [Fact]
    public async Task ObtenerPorIdAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.ObtenerPorIdAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region ObtenerDetallePorIdAsync

    [Fact]
    public async Task ObtenerDetallePorIdAsync_DeberiaRetornarTelefonoConCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerDetallePorIdAsync(telefono.Id);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Cliente.Should().NotBeNull();
        resultado.Cliente.NombreCompleto.Should().Be("Juan Perez");
    }

    #endregion

    #region ObtenerPorIdCliente

    [Fact]
    public async Task ObtenerPorIdCliente_DeberiaRetornarTelefonosDelCliente()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente1 = TestDataFactory.Cliente.WithNombre("Juan Perez").CreateValid();
        var cliente2 = TestDataFactory.Cliente.WithNombre("Maria Lopez").CreateValid();
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        var telefonos = new List<TelefonoCliente>
        {
            TestDataFactory.Telefono.WithTelefono("1111111111").WithDescripcion("Celular").WithIdCliente(cliente1.Id).CreateValid(),
            TestDataFactory.Telefono.WithTelefono("2222222222").WithDescripcion("Fijo").WithIdCliente(cliente1.Id).CreateValid(),
            TestDataFactory.Telefono.WithTelefono("3333333333").WithDescripcion("Celular").WithIdCliente(cliente2.Id).CreateValid()
        };
        await contexto.TelefonoCliente.AddRangeAsync(telefonos);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorIdCliente(cliente1.Id);

        // Assert
        resultado.Should().HaveCount(2);
    }

    #endregion

    #region ObtenerPorNumeroAsync

    [Fact]
    public async Task ObtenerPorNumeroAsync_DeberiaRetornarTelefonoCuandoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono);
        await contexto.SaveChangesAsync();

        // Act
        var resultado = await repositorio.ObtenerPorNumeroAsync("1234567890");

        // Assert
        resultado.Should().NotBeNull();
        resultado!.Telefono.Should().Be("1234567890");
    }

    [Fact]
    public async Task ObtenerPorNumeroAsync_DeberiaRetornarNullCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        // Act
        var resultado = await repositorio.ObtenerPorNumeroAsync("9999999999");

        // Assert
        resultado.Should().BeNull();
    }

    #endregion

    #region ActualizarAsync

    [Fact]
    public async Task ActualizarAsync_DeberiaActualizarTelefono()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono);
        await contexto.SaveChangesAsync();

        telefono.Descripcion = "WhatsApp";

        // Act
        await repositorio.ActualizarAsync(telefono);

        // Assert
        var telefonoEnDb = await contexto.TelefonoCliente.FindAsync(telefono.Id);
        telefonoEnDb.Should().NotBeNull();
        telefonoEnDb.Descripcion.Should().Be("WhatsApp");
    }

    #endregion

    #region EliminarAsync

    [Fact]
    public async Task EliminarAsync_DeberiaEliminarTelefono()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono);
        await contexto.SaveChangesAsync();

        // Act
        await repositorio.EliminarAsync(telefono.Id);

        // Assert
        var telefonoEnDb = await contexto.TelefonoCliente.FindAsync(telefono.Id);
        telefonoEnDb.Should().BeNull();
    }

    [Fact]
    public async Task EliminarAsync_DeberiaLanzarExcepcionCuandoNoExiste()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        // Act & Assert
        await repositorio.Invoking(r => r.EliminarAsync(999))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    #endregion

    #region Validar

    [Fact]
    public async Task Validar_DeberiaLanzarExcepcionCuandoTelefonoNoTiene10Digitos()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var telefono = TestDataFactory.Telefono
            .WithTelefono("12345")
            .WithDescripcion("Celular")
            .WithIdCliente(1)
            .CreateValid();

        // Act & Assert
        await repositorio.Invoking(r => r.Validar(telefono))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Validar_DeberiaLanzarExcepcionCuandoTelefonoDuplicado()
    {
        // Arrange
        using var contexto = CreateDbContext();
        var repositorio = new TelefonoClienteRepositorio(contexto);

        var cliente = TestDataFactory.Cliente.CreateValid();
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono1 = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Celular")
            .WithIdCliente(cliente.Id)
            .CreateValid();
        await contexto.TelefonoCliente.AddAsync(telefono1);
        await contexto.SaveChangesAsync();

        var telefono2 = TestDataFactory.Telefono
            .WithTelefono("1234567890")
            .WithDescripcion("Otro")
            .WithIdCliente(cliente.Id)
            .CreateValid();

        // Act & Assert
        await repositorio.Invoking(r => r.Validar(telefono2))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion
}
