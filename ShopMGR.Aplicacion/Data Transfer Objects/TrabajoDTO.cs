using System.ComponentModel.DataAnnotations;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class TrabajoDTO
    {
        [Required(ErrorMessage = "El campo título es obligatorio")]
        public string Titulo { get; set; } = "";

        [StringLength(100, ErrorMessage = "Descripcion demasiado larga")]
        public string? Descripcion { get; set; }

        public int IdCliente { get; set; }

        public int? IdPresupuesto { get; set; }

        public EstadoTrabajo? Estado { get; set; }

        [Range(0, 1000)]
        public double? HorasEstimadas { get; set; }

        public decimal? TotalLabor { get; set; }
    }
}
