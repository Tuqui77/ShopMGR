using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios;

public class AdministrarAuth(
    ShopMGRDbContexto contexto,
    IConfiguration configuracion,
    IPasswordHasher<Usuario> passwordHasher
) : IAdministrarAuth
{
    private readonly ShopMGRDbContexto _contexto = contexto; // TODO(#100): Implementar un repositorio para no acceder a datos directamente, SRP!
    private readonly IConfiguration _configuracion = configuracion;
    private readonly IPasswordHasher<Usuario> _passwordHasher = passwordHasher;

    public async Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request)
    {
        if (await _contexto.Usuarios.AnyAsync(u => u.UserName == request.UserName))
            return null;

        var usuario = new Usuario() { UserName = request.UserName };
        var hashedPassword = _passwordHasher.HashPassword(usuario, request.Password);
        usuario.PasswordHash = hashedPassword;
        usuario.CambiarRol(RolUsuario.Empleado);

        await _contexto.Usuarios.AddAsync(usuario);
        await _contexto.SaveChangesAsync();

        return usuario;
    }

    public async Task<RespuestaLogin?> IniciarSesion(UsuarioDTO request)
    {
        var usuarioDb = await _contexto
            .Usuarios.Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (usuarioDb == null)
            return null;

        var esCodigoUsoUnico = usuarioDb.CodigoUsoUnico != null && usuarioDb.CodigoUsoUnico == request.Password;

        var esContraseñaValida =
            _passwordHasher.VerifyHashedPassword(usuarioDb, usuarioDb.PasswordHash, request.Password)
            == PasswordVerificationResult.Success;

        if (!esCodigoUsoUnico && !esContraseñaValida)
            return null;

        var accessToken = CrearToken(usuarioDb);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuarioDb.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuarioDb.EliminarRefreshTokensExpirados();
        await _contexto.SaveChangesAsync();

        return new RespuestaLogin(accessToken, refreshToken, esCodigoUsoUnico);
    }

    public async Task<RespuestaLogin> FinalizarAuthPasskey(Usuario usuario)
    {
        var accessToken = CrearToken(usuario);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuario.EliminarRefreshTokensExpirados();
        await _contexto.SaveChangesAsync();

        return new RespuestaLogin(accessToken, refreshToken, false);
    }

    public async Task<RespuestaLogin?> Refrescar(string refreshTokenRequest)
    {
        var hashRequest = CalcularHash(refreshTokenRequest);
        var token = await _contexto.RefreshTokens.FirstOrDefaultAsync(rt => rt.Hash == hashRequest);

        var esValido = token != null && !token.EstaExpirado && !token.EstaRevocado;

        if (esValido)
        {
            var usuario =
                await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == token!.IdUsuario)
                ?? throw new KeyNotFoundException();
            var nuevoAccessToken = CrearToken(usuario);
            var nuevoRefreshToken = GenerarRefreshToken();
            var hash = CalcularHash(nuevoRefreshToken);
            usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
            token!.Revocar();
            await _contexto.SaveChangesAsync();

            return new RespuestaLogin(nuevoAccessToken, nuevoRefreshToken, false);
        }

        return null;
    }

    public async Task CerrarSesion(string refreshTokenRequest)
    {
        var hash = CalcularHash(refreshTokenRequest);
        var token =
            await _contexto.RefreshTokens.FirstOrDefaultAsync(rt => rt.Hash == hash)
            ?? throw new KeyNotFoundException();

        token.Revocar();
        await _contexto.SaveChangesAsync();
    }

    public async Task<Usuario?> ObtenerUsuarioPorIdAsync(int idUsuario)
    {
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == idUsuario);

        return usuario;
    }

    public async Task<List<ResumenUsuarios>> ListarUsuariosAsync()
    {
        var usuarios = await _contexto
            .Usuarios.Select(u => new ResumenUsuarios
            {
                Id = u.Id,
                UserName = u.UserName,
                Rol = u.Rol,
            })
            .ToListAsync();

        return usuarios;
    }

    public async Task CambiarContrasena(int idUsuario, string? contraseñaActual, string contraseñaNueva)
    {
        var usuario =
            await _contexto.Usuarios.Where(u => u.Id == idUsuario).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        if (
            usuario.CodigoUsoUnico == null
            && _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, contraseñaActual)
                == PasswordVerificationResult.Failed
        )
            throw new ArgumentException("La contraseña actual es incorrecta");

        var hashContraseñaNueva = _passwordHasher.HashPassword(usuario, contraseñaNueva);
        usuario.CambiarContrasena(hashContraseñaNueva);

        await _contexto.SaveChangesAsync();
    }

    public async Task CambiarContrasena(int idUsuario, string contraseñaNueva)
    {
        var usuario =
            await _contexto.Usuarios.Where(u => u.Id == idUsuario).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        var hashContraseñaNueva = _passwordHasher.HashPassword(usuario, contraseñaNueva);
        usuario.CambiarContrasena(hashContraseñaNueva);

        await _contexto.SaveChangesAsync();
    }

    public async Task<string> RestaurarContraseña(int idUsuario)
    {
        var usuario =
            await _contexto.Usuarios.Where(u => u.Id == idUsuario).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        usuario.GenerarCodigoUsoUnico();
        await _contexto.SaveChangesAsync();

        return usuario.CodigoUsoUnico!;
    }

    public async Task CambiarRolUsuario(int idUsuario, RolUsuario rol)
    {
        var usuario =
            await _contexto.Usuarios.Where(u => u.Id == idUsuario).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        usuario.CambiarRol(rol);
        await _contexto.SaveChangesAsync();
    }

    private string CrearToken(Usuario usuario)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, usuario.UserName),
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Role, usuario.Rol.ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuracion.GetSection("Jwt:Token").Value!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: _configuracion.GetSection("Jwt:Issuer").Value,
            audience: _configuracion.GetSection("Jwt:Audience").Value,
            claims: claims,
            expires: DateTime.Now.AddMinutes(
                int.Parse(_configuracion.GetSection("Jwt:ExpirationMinutes").Value ?? "60")
            ),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    private string GenerarRefreshToken()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(64);
        var refreshToken = Convert.ToBase64String(bytes);

        return refreshToken;
    }

    private string CalcularHash(string refreshToken)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            var bytes = Encoding.UTF8.GetBytes(refreshToken);
            var hashBytes = sha256.ComputeHash(bytes);

            return BitConverter.ToString(hashBytes).Replace("-", "");
        }
    }
}
