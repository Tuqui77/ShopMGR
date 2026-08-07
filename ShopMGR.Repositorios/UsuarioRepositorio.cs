using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class UsuarioRepositorio(ShopMGRDbContexto contexto) : IRepositorioUsuario
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<Usuario?> CrearAsync(Usuario usuario)
        {
            if (await _contexto.Usuarios.AnyAsync(u => u.UserName == usuario.UserName))
                return null;

            await _contexto.Usuarios.AddAsync(usuario);
            await _contexto.SaveChangesAsync();

            return usuario;
        }

        public async Task<Usuario?> ObtenerUsuarioPorNombre(string userName)
        {
            var usuarioDb =
                await _contexto.Usuarios.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.UserName == userName);

            return usuarioDb;
        }

        public async Task<Usuario> ObtenerUsuarioPorId(int idUsuario)
        {
            var usuarioDb =
                await _contexto.Usuarios.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == idUsuario)
                ?? throw new KeyNotFoundException($"No se encuentra un usuario con el id {idUsuario}");

            return usuarioDb;
        }

        public async Task<Usuario?> ObtenerUsuarioPorRefreshTokenHash(string refreshToken)
        {
            var usuario = await _contexto
                .Usuarios.Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.RefreshTokens.Any(rt => rt.Hash == refreshToken));

            return usuario;
        }

        public async Task<List<Usuario>> ListarUsuariosAsync()
        {
            var usuarios = await _contexto.Usuarios.ToListAsync();

            return usuarios;
        }

        public async Task ActualizarUsuarioAsync(Usuario usuario)
        {
            _contexto.Usuarios.Update(usuario);
            await _contexto.SaveChangesAsync();
        }
    }
}
