namespace ShopMGR.Dominio.Modelo;

public class Usuario
{
    private readonly List<RefreshToken> _refreshTokens = [];

    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens;

    public RefreshToken CrearRefreshToken(string hash, TimeSpan duracion)
    {
        var token = new RefreshToken(Id, hash, duracion);
        _refreshTokens.Add(token);

        return token;
    }
    
    public void RevocarRefreshToken(string hash)
    {
        var refreshToken = _refreshTokens.FirstOrDefault(rt => rt.Hash == hash)
            ?? throw new KeyNotFoundException();

        refreshToken.Revocar();
    }
}
