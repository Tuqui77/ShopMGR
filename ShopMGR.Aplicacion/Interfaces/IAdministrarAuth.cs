using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces;

public interface IAdministrarAuth
{
    public Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request);
    public Task<RespuestaLogin?> IniciarSesion(UsuarioDTO request);
    public Task<RespuestaLogin> FinalizarAuthPasskey(Usuario usuario);
    public Task<RespuestaLogin?> Refrescar(string refreshToken);
    public Task CerrarSesion(string refreshTokenRequest);
    public Task CambiarContrasena(int idUsuario, string contraseñaActual, string contraseñaNueva);
    public Task CambiarRolUsuario(int idUsuario, RolUsuario rol);
    public Task<Usuario?> ObtenerUsuarioPorIdAsync(int idUsuario);
}