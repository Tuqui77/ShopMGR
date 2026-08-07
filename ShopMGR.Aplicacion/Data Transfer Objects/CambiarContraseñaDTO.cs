using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class CambiarContrasenaDTO
    {
        public string? ContrasenaActual { get; set; } = "";

        [Required]
        public string ContrasenaNueva { get; set; } = "";
    }

    public class CambiarContrasenaAdminDTO
    {
        [Required]
        public int IdUsuario { get; set; }

        [Required]
        public string ContrasenaNueva { get; set; } = "";
    }
}
