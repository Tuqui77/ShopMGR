
namespace ShopMGR.Dominio.Modelo;

public class RefreshToken
{
    public int Id { get; private set; }
    public string Hash { get; private set; } = string.Empty;
    public DateTime CreadoEn { get; private set; }
    public DateTime ExpiraEn { get; private set; }
    public DateTime? RevocadoEn { get; private set; }
    public bool EstaRevocado => RevocadoEn != null;
    public bool EstaExpirado => DateTime.Now >= ExpiraEn;

    //Relaciones
    public int IdUsuario { get; private set; }
    public Usuario Usuario { get; private set; } = null!;

    private RefreshToken() { } //Constructor para ef

    public RefreshToken(int idUsuario, string hash, TimeSpan duracion)
    {
        IdUsuario = idUsuario;
        Hash = hash;
        CreadoEn = DateTime.Now;
        ExpiraEn = CreadoEn.Add(duracion);
    }

    public void Revocar()
    {
        if (!EstaRevocado)
            RevocadoEn = DateTime.Now;
    }
}
