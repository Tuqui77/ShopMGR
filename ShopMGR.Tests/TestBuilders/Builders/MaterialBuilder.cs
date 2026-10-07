using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class MaterialBuilder
{
    private string _descripcion = "Material Test";
    private decimal _precio = 100m;
    private double _cantidad = 1.0;
    private int _idPresupuesto = 1;

    public MaterialBuilder WithDescripcion(string descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public MaterialBuilder WithPrecio(decimal precio)
    {
        _precio = precio;
        return this;
    }

    public MaterialBuilder WithCantidad(double cantidad)
    {
        _cantidad = cantidad;
        return this;
    }

    public MaterialBuilder WithIdPresupuesto(int idPresupuesto)
    {
        _idPresupuesto = idPresupuesto;
        return this;
    }

    public Material CreateValid()
    {
        return new Material
        {
            Descripcion = _descripcion,
            Precio = _precio,
            Cantidad = _cantidad,
            IdPresupuesto = _idPresupuesto
        };
    }

    public Material CreateWithEmptyDescription()
    {
        return WithDescripcion("").CreateValid();
    }

    public Material CreateWithMaxLength()
    {
        return WithDescripcion(new string('M', 500)).CreateValid();
    }

    public Material CreateWithSpecialCharacters()
    {
        return WithDescripcion("Material @#$%^&*()_+").CreateValid();
    }

    public Material CreateWithNullValues()
    {
        return new Material
        {
            Descripcion = null!,
            Precio = _precio,
            Cantidad = _cantidad,
            IdPresupuesto = _idPresupuesto
        };
    }

    public Material CreateWithNegativePrice()
    {
        return WithPrecio(-100m).CreateValid();
    }

    public Material CreateWithZeroPrice()
    {
        return WithPrecio(0m).CreateValid();
    }

    public Material CreateWithNegativeQuantity()
    {
        return WithCantidad(-5.0).CreateValid();
    }

    public Material CreateWithZeroQuantity()
    {
        return WithCantidad(0).CreateValid();
    }
}
