using System.ComponentModel.DataAnnotations;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class MovimientoBalanceDTO
    {
        [Required(ErrorMessage = "El monto del movimiento es obligatorio")]
        public decimal Monto { get; set; }

        [Required(ErrorMessage = "La descripción del movimiento es obligatoria")]
        public string Descripcion { get; set; } = "";

        [Required(ErrorMessage = "La fecha es obligatoria")]
        public DateOnly? Fecha { get; set; }

        [Required(ErrorMessage = "El tipo de movimiento es obligatorio")]
        public TipoMovimiento Tipo { get; set; }

        //Relaciones
        public int IdCliente { get; set; }
        public int? IdTrabajo { get; set; }
    }
}
