using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

public class AdministrarAuth(ShopMGRDbContexto contexto, IConfiguration configuracion)
    : IAdministrarAuth
{
    private readonly ShopMGRDbContexto _contexto = contexto;
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

    public async Task<string?> IniciarSesion(UsuarioDTO request)
    {
        var usuarioDb = await _contexto.Usuarios.FirstOrDefaultAsync(u =>
            u.UserName == request.UserName
        );

        if (
            usuarioDb == null
            || new PasswordHasher<Usuario>().VerifyHashedPassword(
                usuarioDb,
                usuarioDb.PasswordHash,
                request.Password
            ) == PasswordVerificationResult.Failed
        )
            return null;

        var token = CrearToken(usuarioDb);

        return token;
    }

    private string CrearToken(Usuario usuario)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, usuario.UserName),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuracion.GetSection("Jwt:Token").Value!)
        );
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
}
