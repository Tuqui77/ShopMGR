using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ClienteDTO
    {
        [Required(ErrorMessage = "El nombre del cliente es obligatorio")]
        [StringLength(100, ErrorMessage = "Nombre demasiado largo")]
        public string NombreCompleto { get; set; } = "";

        [StringLength(20, ErrorMessage = "Cuit demasiado largo")]
        public string? Cuit { get; set; }

        public decimal? Balance { get; set; }

        public List<DireccionDTO>? Direccion { get; set; } = [];
        public List<TelefonoClienteDTO>? Telefono { get; set; } = [];
    }
}