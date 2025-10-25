using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces;

public interface IAdministrarAuth
{
    public Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request);
    public Task<string?> IniciarSesion(UsuarioDTO request);
}