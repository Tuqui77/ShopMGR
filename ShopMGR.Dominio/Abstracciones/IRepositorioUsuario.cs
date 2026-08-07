using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioUsuario
    {
        public Task<Usuario?> CrearAsync(Usuario usuario);
        public Task<Usuario?> ObtenerUsuarioPorNombre(string userName);
        public Task<Usuario> ObtenerUsuarioPorId(int idUsuario);
        public Task<Usuario?> ObtenerUsuarioPorRefreshTokenHash(string refreshToken);
        public Task<List<Usuario>> ListarUsuariosAsync();
        public Task ActualizarUsuarioAsync(Usuario usuario);
    }
}
