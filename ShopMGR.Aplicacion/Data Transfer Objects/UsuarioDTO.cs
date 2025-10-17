namespace ShopMGR.Aplicacion.Data_Transfer_Objects;

public class UsuarioDTO
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}