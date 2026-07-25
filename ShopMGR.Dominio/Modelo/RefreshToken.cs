
namespace ShopMGR.Dominio.Modelo;

public class RefreshToken
{
    public int Id { get; private set; }
    public Guid Token { get; private set; }
    public int IdUsuario { get; private set; }
    public DateTime CreadoEn { get; private set; }
    public DateTime ExpiraEn { get; private set; }
    public DateTime? RevocadoEn { get; private set; }
    public bool EstaRevocado => RevocadoEn != null;
    public bool EstaExpirado => DateTime.Now >= ExpiraEn;

    private RefreshToken() { } //Constructor para ef

    public RefreshToken(int idUsuario, TimeSpan duracion)
    {
        IdUsuario = idUsuario;
        Token = Guid.NewGuid();
        CreadoEn = DateTime.Now;
        ExpiraEn = CreadoEn.Add(duracion);
    }

    public void Revocar()
    {
        if (!EstaRevocado)
            RevocadoEn = DateTime.Now;
    }
}
