using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class ModificarMovimientoBalance
{
    public int Id { get; set; }
    public decimal Monto { get; set; }
    public string Descripcion { get; set; }
    public DateOnly Fecha { get; set; }
    public TipoMovimiento Tipo { get; set; }

    //Relaciones
    public int IdCliente { get; set; }
    public int? IdTrabajo { get; set; }
}
