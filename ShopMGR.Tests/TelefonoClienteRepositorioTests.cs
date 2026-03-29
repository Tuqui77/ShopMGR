using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Repositorios;
using ShopMGR.Dominio.Modelo;
using FluentAssertions;
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };

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

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = 999
        };

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono1 = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
        await contexto.TelefonoCliente.AddAsync(telefono1);
        await contexto.SaveChangesAsync();

        var telefono2 = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Otro",
            IdCliente = cliente.Id
        };

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "12345",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
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

        var cliente1 = new Cliente { NombreCompleto = "Juan Perez" };
        var cliente2 = new Cliente { NombreCompleto = "Maria Lopez" };
        await contexto.Clientes.AddRangeAsync(cliente1, cliente2);
        await contexto.SaveChangesAsync();

        await contexto.TelefonoCliente.AddRangeAsync(
            new TelefonoCliente { Telefono = "1111111111", Descripcion = "Celular", IdCliente = cliente1.Id },
            new TelefonoCliente { Telefono = "2222222222", Descripcion = "Fijo", IdCliente = cliente1.Id },
            new TelefonoCliente { Telefono = "3333333333", Descripcion = "Celular", IdCliente = cliente2.Id }
        );
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
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

        var telefono = new TelefonoCliente
        {
            Telefono = "12345",
            Descripcion = "Celular",
            IdCliente = 1
        };

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

        var cliente = new Cliente { NombreCompleto = "Juan Perez" };
        await contexto.Clientes.AddAsync(cliente);
        await contexto.SaveChangesAsync();

        var telefono1 = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Celular",
            IdCliente = cliente.Id
        };
        await contexto.TelefonoCliente.AddAsync(telefono1);
        await contexto.SaveChangesAsync();

        var telefono2 = new TelefonoCliente
        {
            Telefono = "1234567890",
            Descripcion = "Otro",
            IdCliente = cliente.Id
        };

        // Act & Assert
        await repositorio.Invoking(r => r.Validar(telefono2))
            .Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion
}
