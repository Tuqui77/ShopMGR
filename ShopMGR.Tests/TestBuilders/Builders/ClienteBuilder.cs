using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class ClienteBuilder
{
    private string _nombreCompleto = "Cliente Test";
    private string? _cuit = "20-12345678-9";
    private List<TelefonoCliente>? _telefonos;
    private List<Direccion>? _direcciones;

    public ClienteBuilder WithNombre(string nombre)
    {
        _nombreCompleto = nombre;
        return this;
    }

    public ClienteBuilder WithCuit(string? cuit)
    {
        _cuit = cuit;
        return this;
    }

    public ClienteBuilder WithTelefonos(List<TelefonoCliente> telefonos)
    {
        _telefonos = telefonos;
        return this;
    }

    public ClienteBuilder WithDirecciones(List<Direccion> direcciones)
    {
        _direcciones = direcciones;
        return this;
    }

    public Cliente CreateValid()
    {
        return new Cliente
        {
            NombreCompleto = _nombreCompleto,
            Cuit = _cuit,
            Telefono = _telefonos ?? [],
            Direccion = _direcciones ?? [],
            MovimientosBalance = [],
            Trabajos = [],
            Presupuestos = []
        };
    }

    public Cliente CreateWithEmptyName()
    {
        return WithNombre("").CreateValid();
    }

    public Cliente CreateWithMaxLength()
    {
        return WithNombre(new string('A', 500)).CreateValid();
    }

    public Cliente CreateWithSpecialCharacters()
    {
        return WithNombre("Cliente @#$%^&*()_+").CreateValid();
    }

    public Cliente CreateWithNullCuit()
    {
        return WithCuit(null).CreateValid();
    }

    public Cliente CreateWithNullValues()
    {
        return new Cliente
        {
            NombreCompleto = null!,
            Cuit = null
        };
    }
}
