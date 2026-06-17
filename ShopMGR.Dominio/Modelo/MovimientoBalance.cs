using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class MovimientoBalance
{
    private decimal monto;
    private bool esDebito => Tipo is TipoMovimiento.Cargo or TipoMovimiento.Compra;
    private bool esCredito => Tipo is TipoMovimiento.Pago or TipoMovimiento.Anticipo;

    public int Id { get; private set; }
    public decimal Monto
    {
        get => monto;
        private set => monto = (esDebito && value > 0 || esCredito && value < 0) ? value * -1 : value;
    }
    public string Descripcion { get; private set; } = null!;
    public DateOnly Fecha { get; private set; }
    public TipoMovimiento Tipo { get; private set; }

    //Relaciones
    public Cliente Cliente { get; private set; } = null!;
    public int IdCliente { get; private set; }
    public Trabajo? Trabajo { get; private set; }
    public int? IdTrabajo { get; private set; }

    public MovimientoBalance() { } //constructor para EF

    public MovimientoBalance(TipoMovimiento tipo, decimal monto, string descripcion, DateOnly? fecha = null)
    {
        Tipo = tipo;
        Monto = monto;
        Descripcion = descripcion;
        Fecha = fecha ?? DateOnly.FromDateTime(DateTime.Now);
    }

    public void Editar(
        TipoMovimiento tipo,
        decimal monto,
        string descripcion,
        DateOnly fecha,
        int idCliente,
        int? idTrabajo
    )
    {
        Tipo = tipo;
        Monto = monto;
        Descripcion = descripcion;
        Fecha = fecha;
        IdCliente = idCliente;
        IdTrabajo = idTrabajo;
    }
}
