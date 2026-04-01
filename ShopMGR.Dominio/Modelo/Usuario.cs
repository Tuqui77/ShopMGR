namespace ShopMGR.Dominio.Modelo;

public class Usuario
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
}
