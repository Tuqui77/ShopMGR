using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class PresupuestoDTOcreacion
    {
        [Required(ErrorMessage = "El campo Título es obligatorio")]
        public string Titulo { get; set; } = "";

        [StringLength(500, ErrorMessage = "Descripcion demasiado larga")]
        public string? Descripcion { get; set; }

        public List<MaterialDTO>? Materiales { get; set; }

        [Range(1, int.MaxValue)]
        public double HorasEstimadas { get; set; }

        //Relaciones
        public int IdCliente { get; set; }
    }
}
