using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Tests.TestBuilders.Builders;

namespace ShopMGR.Tests.TestBuilders;

public static class TestDataFactory
{
    private static readonly Random _random = new();

    // Builders estáticos para uso rápido
    public static ClienteBuilder Cliente => new();
    public static TrabajoBuilder Trabajo => new();
    public static PresupuestoBuilder Presupuesto => new();
    public static TelefonoClienteBuilder Telefono => new();
    public static DireccionBuilder Direccion => new();
    public static MaterialBuilder Material => new();
    public static MovimientoBalanceBuilder Movimiento => new();

    // Métodos de conveniencia para crear datos rápidamente
    public static Cliente CreateCliente(string? nombre = null)
    {
        return new ClienteBuilder()
            .WithNombre(nombre ?? $"Cliente {Guid.NewGuid().ToString()[..8]}")
            .CreateValid();
    }

    public static Trabajo CreateTrabajo(string? titulo = null, int idCliente = 1)
    {
        return new TrabajoBuilder()
            .WithTitulo(titulo ?? $"Trabajo {Guid.NewGuid().ToString()[..8]}")
            .WithIdCliente(idCliente)
            .CreateValid();
    }

    public static Presupuesto CreatePresupuesto(string? titulo = null, int idCliente = 1)
    {
        return new PresupuestoBuilder()
            .WithTitulo(titulo ?? $"Presupuesto {Guid.NewGuid().ToString()[..8]}")
            .WithIdCliente(idCliente)
            .CreateValid();
    }

    public static TelefonoCliente CreateTelefono(string? telefono = null, int idCliente = 1)
    {
        return new TelefonoClienteBuilder()
            .WithTelefono(telefono ?? $"11{RandomDigits(8)}")
            .WithIdCliente(idCliente)
            .CreateValid();
    }

    public static Direccion CreateDireccion(string? calle = null, int idCliente = 1)
    {
        return new DireccionBuilder()
            .WithCalle(calle ?? $"Calle {Guid.NewGuid().ToString()[..8]}")
            .WithIdCliente(idCliente)
            .CreateValid();
    }

    public static Material CreateMaterial(string? descripcion = null, int idPresupuesto = 1)
    {
        return new MaterialBuilder()
            .WithDescripcion(descripcion ?? $"Material {Guid.NewGuid().ToString()[..8]}")
            .WithPrecio(RandomDecimal(10, 1000))
            .WithCantidad(RandomDouble(1, 10))
            .WithIdPresupuesto(idPresupuesto)
            .CreateValid();
    }

    public static MovimientoBalance CreateMovimiento(TipoMovimiento tipo, decimal monto, int idCliente = 1)
    {
        return new MovimientoBalanceBuilder()
            .WithTipo(tipo)
            .WithMonto(monto)
            .WithIdCliente(idCliente)
            .CreateValid();
    }

    // Métodos para crear múltiples entidades
    public static List<Cliente> CreateClientes(int cantidad)
    {
        return Enumerable.Range(1, cantidad)
            .Select(i => CreateCliente($"Cliente {i}"))
            .ToList();
    }

    public static List<Trabajo> CreateTrabajos(int cantidad, int idCliente = 1)
    {
        return Enumerable.Range(1, cantidad)
            .Select(i => CreateTrabajo($"Trabajo {i}", idCliente))
            .ToList();
    }

    public static List<Material> CreateMateriales(int cantidad, int idPresupuesto = 1)
    {
        return Enumerable.Range(1, cantidad)
            .Select(i => CreateMaterial($"Material {i}", idPresupuesto))
            .ToList();
    }

    // Métodos de utilidad
    private static string RandomDigits(int length)
    {
        return string.Concat(Enumerable.Range(0, length)
            .Select(_ => _random.Next(0, 10).ToString()));
    }

    private static decimal RandomDecimal(decimal min, decimal max)
    {
        return (decimal)_random.NextDouble() * (max - min) + min;
    }

    private static double RandomDouble(double min, double max)
    {
        return _random.NextDouble() * (max - min) + min;
    }
}
