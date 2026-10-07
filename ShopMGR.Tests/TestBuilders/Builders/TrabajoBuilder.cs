using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class TrabajoBuilder
{
    private string _titulo = "Trabajo Test";
    private string? _descripcion = "Descripción del trabajo";
    private int _idCliente = 1;
    private EstadoTrabajo? _estado = EstadoTrabajo.Pendiente;
    private int? _idPresupuesto = null;
    private double? _horasEstimadas = 10.0;
    private decimal? _totalLabor = 5000m;

    public TrabajoBuilder WithTitulo(string titulo)
    {
        _titulo = titulo;
        return this;
    }

    public TrabajoBuilder WithDescripcion(string? descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public TrabajoBuilder WithIdCliente(int idCliente)
    {
        _idCliente = idCliente;
        return this;
    }

    public TrabajoBuilder WithEstado(EstadoTrabajo? estado)
    {
        _estado = estado;
        return this;
    }

    public TrabajoBuilder WithIdPresupuesto(int? idPresupuesto)
    {
        _idPresupuesto = idPresupuesto;
        return this;
    }

    public TrabajoBuilder WithHorasEstimadas(double? horasEstimadas)
    {
        _horasEstimadas = horasEstimadas;
        return this;
    }

    public TrabajoBuilder WithTotalLabor(decimal? totalLabor)
    {
        _totalLabor = totalLabor;
        return this;
    }

    public Trabajo CreateValid()
    {
        return new Trabajo(
            _titulo,
            _descripcion,
            _idCliente,
            _estado,
            _idPresupuesto,
            _horasEstimadas,
            _totalLabor
        );
    }

    public Trabajo CreateWithEmptyTitle()
    {
        return WithTitulo("").CreateValid();
    }

    public Trabajo CreateWithMaxLength()
    {
        return WithTitulo(new string('T', 500)).CreateValid();
    }

    public Trabajo CreateWithSpecialCharacters()
    {
        return WithTitulo("Trabajo @#$%^&*()_+").CreateValid();
    }

    public Trabajo CreateWithNullValues()
    {
        return new Trabajo(
            null!,
            null,
            _idCliente,
            null,
            null,
            null,
            null
        );
    }

    public Trabajo CreateWithNegativeHours()
    {
        return WithHorasEstimadas(-5.0).CreateValid();
    }

    public Trabajo CreateWithZeroHours()
    {
        return WithHorasEstimadas(0).CreateValid();
    }
}
