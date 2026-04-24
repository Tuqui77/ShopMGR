using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class MovimientoBalanceDTO
    {
        public decimal Monto { get; set; }
        public string Descripcion { get; set; }
        public DateOnly Fecha { get; set; }
        public TipoMovimiento Tipo { get; set; }

        //Relaciones
        public int IdCliente { get; set; }
        public int? IdTrabajo { get; set; }
    }
}
