using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Tests.TestBuilders.Builders;

public class MovimientoBalanceBuilder
{
    private TipoMovimiento _tipo = TipoMovimiento.Pago;
    private decimal _monto = 1000m;
    private string _descripcion = "Movimiento Test";
    private DateOnly? _fecha = DateOnly.FromDateTime(DateTime.Now);
    private int? _idCliente = 1;
    private int? _idTrabajo = null;

    public MovimientoBalanceBuilder WithTipo(TipoMovimiento tipo)
    {
        _tipo = tipo;
        return this;
    }

    public MovimientoBalanceBuilder WithMonto(decimal monto)
    {
        _monto = monto;
        return this;
    }

    public MovimientoBalanceBuilder WithDescripcion(string descripcion)
    {
        _descripcion = descripcion;
        return this;
    }

    public MovimientoBalanceBuilder WithFecha(DateOnly? fecha)
    {
        _fecha = fecha;
        return this;
    }

    public MovimientoBalanceBuilder WithIdCliente(int? idCliente)
    {
        _idCliente = idCliente;
        return this;
    }

    public MovimientoBalanceBuilder WithIdTrabajo(int? idTrabajo)
    {
        _idTrabajo = idTrabajo;
        return this;
    }

    public MovimientoBalance CreateValid()
    {
        return new MovimientoBalance(
            _tipo,
            _monto,
            _descripcion,
            _fecha,
            _idCliente,
            _idTrabajo
        );
    }

    public MovimientoBalance CreateWithEmptyDescription()
    {
        return WithDescripcion("").CreateValid();
    }

    public MovimientoBalance CreateWithMaxLength()
    {
        return WithDescripcion(new string('D', 500)).CreateValid();
    }

    public MovimientoBalance CreateWithSpecialCharacters()
    {
        return WithDescripcion("Movimiento @#$%^&*()_+").CreateValid();
    }

    public MovimientoBalance CreateWithNullValues()
    {
        return new MovimientoBalance(
            _tipo,
            _monto,
            null!,
            _fecha,
            _idCliente,
            _idTrabajo
        );
    }

    public MovimientoBalance CreateWithNegativeAmount()
    {
        return WithTipo(TipoMovimiento.Cargo).WithMonto(500m).CreateValid();
    }

    public MovimientoBalance CreateWithZeroAmount()
    {
        return WithMonto(0m).CreateValid();
    }

    public MovimientoBalance CreatePago()
    {
        return WithTipo(TipoMovimiento.Pago).CreateValid();
    }

    public MovimientoBalance CreateCargo()
    {
        return WithTipo(TipoMovimiento.Cargo).CreateValid();
    }

    public MovimientoBalance CreateAnticipo()
    {
        return WithTipo(TipoMovimiento.Anticipo).CreateValid();
    }

    public MovimientoBalance CreateCompra()
    {
        return WithTipo(TipoMovimiento.Compra).CreateValid();
    }

    public MovimientoBalance CreateAjuste()
    {
        return WithTipo(TipoMovimiento.Ajuste).CreateValid();
    }
}
