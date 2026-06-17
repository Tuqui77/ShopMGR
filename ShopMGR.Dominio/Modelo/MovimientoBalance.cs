using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class MovimientoBalance
{
    private decimal monto;
    private bool esDebito => Tipo is TipoMovimiento.Cargo or TipoMovimiento.Compra;
    private bool esCredito => Tipo is TipoMovimiento.Pago or TipoMovimiento.Anticipo;

    public int Id { get; set; }
    public decimal Monto
    {
        get => monto;
        set => monto = (esDebito && value > 0 || esCredito && value < 0) ? value * -1 : value;
    }
    public string Descripcion { get; set; }
    public DateOnly Fecha { get; set; }
    public TipoMovimiento Tipo { get; set; }

    //Relaciones
    public Cliente Cliente { get; set; } = null!;
    public int IdCliente { get; set; }
    public Trabajo? Trabajo { get; set; }
    public int? IdTrabajo { get; set; }

    public MovimientoBalance() { } //constructor para EF

    public MovimientoBalance(
        TipoMovimiento tipo,
        decimal monto,
        string descripcion,
        DateOnly? fecha = null
    )
    {
        Tipo = tipo;
        Monto = monto;
        Descripcion = descripcion;
        Fecha = fecha ?? DateOnly.FromDateTime(DateTime.Now);
    }
    //TODO: Mover la lógica de la edición a la entidad para asegurar que el monto se calcula correctamente.
}
