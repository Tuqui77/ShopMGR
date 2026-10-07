using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class DireccionBuilder
{
    private string _calle = "Calle Falsa";
    private string _altura = "123";
    private string? _piso = null;
    private string? _departamento = null;
    private string? _descripcion = null;
    private string _ciudad = "Buenos Aires";
    private string? _codigoPostal = "1000";
    private string? _mapsId = null;
    private int _idCliente = 1;

    public DireccionBuilder WithCalle(string calle)
    {
        _calle = calle;
        return this;
    }

    public DireccionBuilder WithAltura(string altura)
    {
        _altura = altura;
        return this;
    }

    public DireccionBuilder WithPiso(string? piso)
    {
        _piso = piso;
        return this;
    }

    public DireccionBuilder WithDepartamento(string? departamento)
    {
        _departamento = departamento;
        return this;
    }

    public DireccionBuilder WithDescripcion(string? descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public DireccionBuilder WithCiudad(string ciudad)
    {
        _ciudad = ciudad;
        return this;
    }

    public DireccionBuilder WithCodigoPostal(string? codigoPostal)
    {
        _codigoPostal = codigoPostal;
        return this;
    }

    public DireccionBuilder WithMapsId(string? mapsId)
    {
        _mapsId = mapsId;
        return this;
    }

    public DireccionBuilder WithIdCliente(int idCliente)
    {
        _idCliente = idCliente;
        return this;
    }

    public Direccion CreateValid()
    {
        return new Direccion
        {
            Calle = _calle,
            Altura = _altura,
            Piso = _piso,
            Departamento = _departamento,
            Descripcion = _descripcion,
            Ciudad = _ciudad,
            CodigoPostal = _codigoPostal,
            MapsID = _mapsId,
            IdCliente = _idCliente
        };
    }

    public Direccion CreateWithEmptyStreet()
    {
        return WithCalle("").CreateValid();
    }

    public Direccion CreateWithMaxLength()
    {
        return WithCalle(new string('C', 500)).CreateValid();
    }

    public Direccion CreateWithSpecialCharacters()
    {
        return WithCalle("Calle @#$%^&*()_+").CreateValid();
    }

    public Direccion CreateWithNullValues()
    {
        return new Direccion
        {
            Calle = null!,
            Altura = null!,
            Ciudad = null!,
            IdCliente = _idCliente
        };
    }
}
