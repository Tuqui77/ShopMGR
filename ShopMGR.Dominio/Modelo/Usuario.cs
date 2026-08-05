using System.Security.Cryptography;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo;

public class Usuario
{
    private readonly List<RefreshToken> _refreshTokens = [];
    private readonly List<Passkey> _passKeys = [];

    public int Id { get; set; }
    public RolUsuario Rol { get; private set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? CodigoUsoUnico { get; private set; }
    public DateTime? ExpiracionCodigoUsoUnico { get; private set; }
    public IReadOnlyCollection<RefreshToken> RefreshTokens => _refreshTokens;
    public IReadOnlyCollection<Passkey> PassKeys => _passKeys;

    public RefreshToken CrearRefreshToken(string hash, TimeSpan duracion)
    {
        var token = new RefreshToken(Id, hash, duracion);
        _refreshTokens.Add(token);

        return token;
    }

    public void EliminarRefreshTokensExpirados()
    {
        _refreshTokens.RemoveAll(rt => rt.EstaExpirado);
    }

    public void CambiarContrasena(string passwordHash)
    {
        if (passwordHash != PasswordHash)
            PasswordHash = passwordHash;

        EliminarCodigoUsoUnico();
    }

    public void GenerarCodigoUsoUnico()
    {
        CodigoUsoUnico = GenerarCódigo();
        ExpiracionCodigoUsoUnico = DateTime.Now.AddMinutes(5);
    }

    public void EliminarCodigoUsoUnico()
    {
        CodigoUsoUnico = null;
        ExpiracionCodigoUsoUnico = null;
    }

    public void CambiarRol(RolUsuario rol)
    {
        Rol = rol;
    }

    private string GenerarCódigo()
    {
        const string caracteres = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

        Span<char> resultado = stackalloc char[6];

        for (int i = 0; i < 6; i++)
        {
            resultado[i] = caracteres[RandomNumberGenerator.GetInt32(caracteres.Length)];
        }
        
        return new string(resultado);
    }
}
