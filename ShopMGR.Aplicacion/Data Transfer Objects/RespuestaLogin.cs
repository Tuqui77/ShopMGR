
using System.Text.Json.Serialization;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects;

public class RespuestaLogin
{
    public string AccessToken { get; set; } = null!;
    [JsonIgnore]
    public string RefreshToken { get; set; } = null!;
    public bool RequiereCambioContraseña { get; set; } = false;

    public RespuestaLogin(string accessToken, string refreshToken, bool requiereCambioContraseña)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
        RequiereCambioContraseña = requiereCambioContraseña;
    }
}
