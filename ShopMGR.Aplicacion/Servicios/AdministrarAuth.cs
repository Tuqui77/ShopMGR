using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios;

public class AdministrarAuth(
    IRepositorioUsuario repositorio,
    IConfiguration configuracion,
    IPasswordHasher<Usuario> passwordHasher
) : IAdministrarAuth
{
    private readonly IRepositorioUsuario _repositorio = repositorio;
    private readonly IConfiguration _configuracion = configuracion;
    private readonly IPasswordHasher<Usuario> _passwordHasher = passwordHasher;

    public async Task<Usuario?> RegistrarUsuarioAsync(UsuarioDTO request)
    {
        var usuario = new Usuario() { UserName = request.UserName };
        var hashedPassword = _passwordHasher.HashPassword(usuario, request.Password);
        usuario.PasswordHash = hashedPassword;
        var hayUsuarios = (await _repositorio.ListarUsuariosAsync()).Any();
        if (!hayUsuarios)
        {
            usuario.CambiarRol(RolUsuario.Administrador);
        }
        else
        {
            usuario.CambiarRol(RolUsuario.Empleado);
        }

        var usuarioCreado = await _repositorio.CrearAsync(usuario);
        if (usuarioCreado == null)
            return null;
        return usuarioCreado;
    }

    public async Task<RespuestaLogin?> IniciarSesion(UsuarioDTO request)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorNombre(request.UserName);

        if (usuario == null)
            return null;

        var esCodigoUsoUnico =
            usuario.CodigoUsoUnico != null
            && _passwordHasher.VerifyHashedPassword(usuario, usuario.CodigoUsoUnico, request.Password)
                == PasswordVerificationResult.Success
            && usuario.ExpiracionCodigoUsoUnico > DateTime.Now;

        var esContraseñaValida =
            _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, request.Password)
            == PasswordVerificationResult.Success;

        if (usuario.CodigoUsoUnico != null && usuario.ExpiracionCodigoUsoUnico < DateTime.Now)
        {
            usuario.EliminarCodigoUsoUnico();
            await _repositorio.ActualizarUsuarioAsync(usuario);
        }

        if (!esCodigoUsoUnico && !esContraseñaValida)
            return null;

        var accessToken = CrearToken(usuario);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuario.EliminarRefreshTokensExpirados();
        await _repositorio.ActualizarUsuarioAsync(usuario);

        return new RespuestaLogin(accessToken, refreshToken, esCodigoUsoUnico);
    }

    public async Task<RespuestaLogin> FinalizarAuthPasskey(Usuario usuario)
    {
        var accessToken = CrearToken(usuario);
        var refreshToken = GenerarRefreshToken();
        var hash = CalcularHash(refreshToken);
        usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
        usuario.EliminarRefreshTokensExpirados();
        await _repositorio.ActualizarUsuarioAsync(usuario);

        return new RespuestaLogin(accessToken, refreshToken, false);
    }

    public async Task<RespuestaLogin?> Refrescar(string refreshTokenRequest)
    {
        var hashRequest = CalcularHash(refreshTokenRequest);
        var usuario = await _repositorio.ObtenerUsuarioPorRefreshTokenHash(hashRequest);

        if (usuario == null)
            return null;

        var refreshToken = usuario.RefreshTokens.First(rt => rt.Hash == hashRequest);

        var esValido = refreshToken != null && !refreshToken.EstaExpirado && !refreshToken.EstaRevocado;

        if (esValido)
        {
            var nuevoAccessToken = CrearToken(usuario);
            var nuevoRefreshToken = GenerarRefreshToken();
            var hash = CalcularHash(nuevoRefreshToken);
            usuario.CrearRefreshToken(hash, TimeSpan.FromDays(30));
            refreshToken!.Revocar();
            await _repositorio.ActualizarUsuarioAsync(usuario);

            return new RespuestaLogin(nuevoAccessToken, nuevoRefreshToken, false);
        }

        return null;
    }

    public async Task CerrarSesion(string refreshTokenRequest)
    {
        var hash = CalcularHash(refreshTokenRequest);
        var usuario = await _repositorio.ObtenerUsuarioPorRefreshTokenHash(hash);
        if (usuario == null)
            return;

        var token = usuario.RefreshTokens.FirstOrDefault(rt => rt.Hash == hash);

        token?.Revocar();

        await _repositorio.ActualizarUsuarioAsync(usuario);
    }

    public async Task<Usuario?> ObtenerUsuarioPorIdAsync(int idUsuario)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorId(idUsuario);

        return usuario;
    }

    public async Task<List<ResumenUsuarios>> ListarUsuariosAsync()
    {
        var usuarios = await _repositorio.ListarUsuariosAsync();

        var resumenUsuarios = usuarios
            .Select(u => new ResumenUsuarios
            {
                Id = u.Id,
                UserName = u.UserName,
                Rol = u.Rol,
            })
            .ToList();

        return resumenUsuarios;
    }

    public async Task CambiarContrasena(int idUsuario, string? contraseñaActual, string contraseñaNueva)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorId(idUsuario);

        var tieneCodigoUnUsoValido = usuario.CodigoUsoUnico != null && usuario.ExpiracionCodigoUsoUnico > DateTime.Now;
        var contraseñaActualValida =
            contraseñaActual != null
            && _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, contraseñaActual)
                == PasswordVerificationResult.Success;

        if (!tieneCodigoUnUsoValido && !contraseñaActualValida)
            throw new InvalidOperationException("La contraseña actual es incorrecta");

        var hashContraseñaNueva = _passwordHasher.HashPassword(usuario, contraseñaNueva);
        usuario.CambiarContrasena(hashContraseñaNueva);

        await _repositorio.ActualizarUsuarioAsync(usuario);
    }

    public async Task CambiarContrasena(int idUsuario, string contraseñaNueva)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorId(idUsuario);

        var hashContraseñaNueva = _passwordHasher.HashPassword(usuario, contraseñaNueva);
        usuario.CambiarContrasena(hashContraseñaNueva);

        await _repositorio.ActualizarUsuarioAsync(usuario);
    }

    public async Task<string> RestaurarContraseña(int idUsuario)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorId(idUsuario);

        var codigoUsoUnico = usuario.GenerarCódigo();
        var hashCodigo = _passwordHasher.HashPassword(usuario, codigoUsoUnico);
        usuario.SetearCodigoUsoUnico(hashCodigo);

        await _repositorio.ActualizarUsuarioAsync(usuario);

        return codigoUsoUnico;
    }

    public async Task CambiarRolUsuario(int idUsuario, RolUsuario rol)
    {
        var usuario = await _repositorio.ObtenerUsuarioPorId(idUsuario);

        usuario.CambiarRol(rol);
        await _repositorio.ActualizarUsuarioAsync(usuario);
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
