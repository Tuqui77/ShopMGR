using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController(IAdministrarAuth administrarAuth) : ControllerBase
{
    private readonly IAdministrarAuth _administrarAuth = administrarAuth;

    [HttpPost]
    [Route("RegistrarUsuario")]
    public async Task<IActionResult> RegistrarUsuario(UsuarioDTO request)
    {
        var usuario = await _administrarAuth.RegistrarUsuarioAsync(request);

        if (usuario == null)
            return BadRequest("El nombre de usuario ya esta en uso");

        return Ok("Usuario creado con exito");
    }

    [HttpPost]
    [Route("IniciarSesion")]
    public async Task<IActionResult> IniciarSesion(UsuarioDTO request)
    {
        var respuestaLogin = await _administrarAuth.IniciarSesion(request);

        if (respuestaLogin == null)
        {
            return BadRequest("Nombre de usuario o contraseña incorrectos");
        }

        return Ok(respuestaLogin);
    }

    [HttpPost]
    [Route("Refrescar")]
    public async Task<IActionResult> Refrescar(int idUsuario, string refreshTokenRequest)
    {
        var respuestaLogin = await _administrarAuth.Refrescar(idUsuario, refreshTokenRequest);

        if (respuestaLogin == null)
            return BadRequest("Refresh Token inválido");

        return Ok(respuestaLogin);
    }

    [HttpPost]
    [Route("CerrarSesion")]
    public async Task<IActionResult> CerrarSesion(int idUsuario, string refreshTokenRequest)
    {
        await _administrarAuth.CerrarSesion(idUsuario, refreshTokenRequest);

        return Ok("Sesión cerrada correctamente");
    }

    [Authorize]
    [HttpGet]
    public IActionResult AuthorizedOnly()
    {
        return Ok("Autenticado");
    }
}
