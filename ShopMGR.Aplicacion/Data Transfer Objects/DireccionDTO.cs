using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class DireccionDTO
    {
        public int IdCliente { get; set; }

        [Required(ErrorMessage = "La calle es obligatoria")]
        [StringLength(40, ErrorMessage = "Nombre de la calle demasiado largo")]
        public string Calle { get; set; } = "";

        [Required(ErrorMessage = "La altura es obligatoria")]
        [StringLength(10, ErrorMessage = "Altura demasiado larga")]
        public string Altura { get; set; } = "";

        [StringLength(2, ErrorMessage = "Piso demasiado largo")]
        public string? Piso { get; set; }

        [StringLength(5, ErrorMessage = "Departamento demasiado largo")]
        public string? Departamento { get; set; }

        [StringLength(100, ErrorMessage = "Descripcion demasiado larga")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "La ciudad es obligatoria")]
        [StringLength(50, ErrorMessage = "Nombre de la ciudad demasiado largo")]
        public string Ciudad { get; set; } = "";

        [StringLength(10, ErrorMessage = "Código postal demasiado largo")]
        public string? CodigoPostal { get; set; }

        [StringLength(100, ErrorMessage = "MapsID demasiado largo")]
        public string? MapsID { get; set; }
    }
}
