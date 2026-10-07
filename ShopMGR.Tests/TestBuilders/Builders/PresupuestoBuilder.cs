using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class PresupuestoBuilder
{
    private string _titulo = "Presupuesto Test";
    private string? _descripcion = "Descripción del presupuesto";
    private double _horasEstimadas = 10.0;
    private int _idCliente = 1;
    private List<Material>? _materiales;
    private EstadoPresupuesto _estado = EstadoPresupuesto.Pendiente;

    public PresupuestoBuilder WithTitulo(string titulo)
    {
        _titulo = titulo;
        return this;
    }

    public PresupuestoBuilder WithDescripcion(string? descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public PresupuestoBuilder WithHorasEstimadas(double horasEstimadas)
    {
        _horasEstimadas = horasEstimadas;
        return this;
    }

    public PresupuestoBuilder WithIdCliente(int idCliente)
    {
        _idCliente = idCliente;
        return this;
    }

    public PresupuestoBuilder WithMateriales(List<Material> materiales)
    {
        _materiales = materiales;
        return this;
    }

    public PresupuestoBuilder WithEstado(EstadoPresupuesto estado)
    {
        _estado = estado;
        return this;
    }

    public Presupuesto CreateValid()
    {
        var presupuesto = new Presupuesto(
            _titulo,
            _descripcion,
            _materiales ?? [],
            _horasEstimadas,
            _idCliente
        );

        if (_estado == EstadoPresupuesto.Aceptado)
            presupuesto.AceptarPresupuesto();
        else if (_estado == EstadoPresupuesto.Rechazado)
            presupuesto.RechazarPresupuesto();

        return presupuesto;
    }

    public Presupuesto CreateWithEmptyTitle()
    {
        return WithTitulo("").CreateValid();
    }

    public Presupuesto CreateWithMaxLength()
    {
        return WithTitulo(new string('P', 500)).CreateValid();
    }

    public Presupuesto CreateWithSpecialCharacters()
    {
        return WithTitulo("Presupuesto @#$%^&*()_+").CreateValid();
    }

    public Presupuesto CreateWithNullValues()
    {
        return new Presupuesto(
            null!,
            null,
            null!,
            _horasEstimadas,
            _idCliente
        );
    }

    public Presupuesto CreateWithNegativeHours()
    {
        return WithHorasEstimadas(-5.0).CreateValid();
    }

    public Presupuesto CreateWithZeroHours()
    {
        return WithHorasEstimadas(0).CreateValid();
    }

    public Presupuesto CreateWithMaterials()
    {
        var materiales = new List<Material>
        {
            new MaterialBuilder().CreateValid(),
            new MaterialBuilder().WithDescripcion("Material 2").WithPrecio(200m).CreateValid()
        };
        return WithMateriales(materiales).CreateValid();
    }
}
