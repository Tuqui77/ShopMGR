namespace ShopMGR.Dominio.Modelo;

public class Usuario
{
    private readonly List<RefreshToken> _refreshTokens = [];

    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens;

    public RefreshToken CrearRefreshToken(TimeSpan duracion)
    {
        var token = new RefreshToken(Id, duracion);
        _refreshTokens.Add(token);

        return token;
    }
    
    public void RevocarRefreshToken(Guid token)
    {
        var refreshToken = _refreshTokens.FirstOrDefault(rt => rt.Token == token)
            ?? throw new KeyNotFoundException();

        refreshToken.Revocar();
    }
}
