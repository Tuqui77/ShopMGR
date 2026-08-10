using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace AdminBootstrap
{
    public class Bootstrap()
    {

        public static async Task InicializarAsync(
            ShopMGRDbContexto contexto,
            IConfiguration configuracion,
            ILogger<Bootstrap> logger,
            IPasswordHasher<Usuario> passwordHasher
        )
        {
            var username = configuracion["ADMIN_USERNAME"];
            var password = configuracion["ADMIN_PASSWORD"];

            logger.LogInformation("=== Inicialización ===");

            if (string.IsNullOrWhiteSpace(username))
                throw new InvalidOperationException("ADMIN_USERNAME no está configurado");

            if (string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("ADMIN_PASSWORD no está configurado");

            var usuario = await contexto.Usuarios.FirstOrDefaultAsync(u => u.UserName == username);
            var existeUsuario = usuario != null;
            var esAdministrador = usuario != null && usuario.Rol == RolUsuario.Administrador;

            logger.LogInformation($"Usuario existe: {existeUsuario}");
            logger.LogInformation($"Usuario es Administrador: {esAdministrador}");

            if (!existeUsuario || !esAdministrador)
            {
                if (usuario == null)
                {
                    usuario = new Usuario() { UserName = username };
                    var passwordHash = passwordHasher.HashPassword(usuario, password);
                    usuario.PasswordHash = passwordHash;
                    usuario.CambiarRol(RolUsuario.Administrador);

                    contexto.Usuarios.Add(usuario);
                    await contexto.SaveChangesAsync();
                    logger.LogInformation("Administrador creado");
                }
                else
                {
                    usuario.CambiarRol(RolUsuario.Administrador);
                    await contexto.SaveChangesAsync();
                    logger.LogInformation("Rol asignado");
                }
            }

            logger.LogInformation("=== Inicialización finalizada ===");
        }
    }
}
