using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class TelefonoClienteDTO
    {
        public int IdCliente { get; set; }

        [Required(ErrorMessage = "El campo Teléfono es obligatorio")]
        [StringLength(15, ErrorMessage = "El número de teléfono es inválido")]
        public string Telefono { get; set; } = "";

        [StringLength(50)]
        public string Descripcion { get; set; } = "";
    }
}
