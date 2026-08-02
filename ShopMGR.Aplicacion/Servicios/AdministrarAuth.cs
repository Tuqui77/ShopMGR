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
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios;

public class AdministrarAuth(ShopMGRDbContexto contexto, IConfiguration configuracion) : IAdministrarAuth
{
    private readonly ShopMGRDbContexto _contexto = contexto; // TODO(#100): Implementar un repositorio para no acceder a datos directamente, SRP!
    private readonly IConfiguration _configuracion = configuracion;

    public async Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request)
    {
        if (await _contexto.Usuarios.AnyAsync(u => u.UserName == request.UserName))
            return null;

        var usuario = new Usuario() { UserName = request.UserName };
        var hashedPassword = new PasswordHasher<Usuario>().HashPassword(usuario, request.Password);
        usuario.PasswordHash = hashedPassword;

        await _contexto.Usuarios.AddAsync(usuario);
        await _contexto.SaveChangesAsync();

        return usuario;
    }

    public async Task<RespuestaLogin?> IniciarSesion(UsuarioDTO request)
    {
        var usuarioDb = await _contexto
            .Usuarios.Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName);

        if (
            usuarioDb == null
            || new PasswordHasher<Usuario>().VerifyHashedPassword(usuarioDb, usuarioDb.PasswordHash, request.Password)
                == PasswordVerificationResult.Failed
        )
            return null;

        var accessToken = CrearToken(usuarioDb);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuarioDb.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuarioDb.EliminarRefreshTokensExpirados();
        await _contexto.SaveChangesAsync();

        return new RespuestaLogin(accessToken, refreshToken);
    }

    public async Task<RespuestaLogin> FinalizarAuthPasskey(Usuario usuario)
    {
        var accessToken = CrearToken(usuario);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuario.EliminarRefreshTokensExpirados();
        await _contexto.SaveChangesAsync();

        return new RespuestaLogin(accessToken, refreshToken);
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
            usuario.RevocarRefreshToken(token!.Hash);
            await _contexto.SaveChangesAsync();

            return new RespuestaLogin(nuevoAccessToken, nuevoRefreshToken);
        }

        return null;
    }

    public async Task CerrarSesion(string refreshTokenRequest)
    {
        var hash = CalcularHash(refreshTokenRequest);
        var token =
            await _contexto.RefreshTokens.FirstOrDefaultAsync(rt => rt.Hash == hash)
            ?? throw new KeyNotFoundException();
        var usuario =
            await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == token.IdUsuario)
            ?? throw new KeyNotFoundException();

        usuario.RevocarRefreshToken(token.Hash);
        await _contexto.SaveChangesAsync();
    }

    // Métodos que se van a mover a un repositorio

    public async Task<Usuario?> ObtenerUsuarioPorIdAsync(int idUsuario)
    {
        var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == idUsuario);

        return usuario;
    }

    private string CrearToken(Usuario usuario)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, usuario.UserName),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
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
