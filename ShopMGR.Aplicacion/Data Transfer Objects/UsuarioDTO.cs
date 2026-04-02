using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects;

public class UsuarioDTO
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    [DefaultValue("")]
    public string UserName { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es requerida")]
    [DefaultValue("")]
    public string Password { get; set; } = string.Empty;
}
