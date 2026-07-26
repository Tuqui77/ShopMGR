using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces;

public interface IAdministrarAuth
{
    public Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request);
    public Task<RespuestaLogin?> IniciarSesion(UsuarioDTO request);
    public Task<RespuestaLogin?> Refrescar(string refreshToken);
    public Task CerrarSesion(string refreshTokenRequest);
}