using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class TelefonoClienteBuilder
{
    private string _telefono = "1234567890";
    private string _descripcion = "Teléfono Principal";
    private int _idCliente = 1;

    public TelefonoClienteBuilder WithTelefono(string telefono)
    {
        _telefono = telefono;
        return this;
    }

    public TelefonoClienteBuilder WithDescripcion(string descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public TelefonoClienteBuilder WithIdCliente(int idCliente)
    {
        _idCliente = idCliente;
        return this;
    }

    public TelefonoCliente CreateValid()
    {
        return new TelefonoCliente
        {
            Telefono = _telefono,
            Descripcion = _descripcion,
            IdCliente = _idCliente
        };
    }

    public TelefonoCliente CreateWithEmptyPhone()
    {
        return WithTelefono("").CreateValid();
    }

    public TelefonoCliente CreateWithMaxLength()
    {
        return WithTelefono(new string('9', 50)).CreateValid();
    }

    public TelefonoCliente CreateWithSpecialCharacters()
    {
        return WithTelefono("+54-11-1234-5678").CreateValid();
    }

    public TelefonoCliente CreateWithNullValues()
    {
        return new TelefonoCliente
        {
            Telefono = null!,
            Descripcion = null!,
            IdCliente = _idCliente
        };
    }
}
