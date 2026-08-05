
using System.Text.Json.Serialization;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects;

public class RespuestaLogin(string accessToken, string refreshToken, bool requiereCambioContraseña)
{
    public string AccessToken { get; set; } = accessToken;
    [JsonIgnore]
    public string RefreshToken { get; set; } = refreshToken;
    public bool RequiereCambioContraseña { get; set; } = requiereCambioContraseña;
}
