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
            return BadRequest("El nombre de usuiario ya esta en uso");

        return Ok("Usuario creado con exito");
    }

    [HttpPost]
    [Route("IniciarSesion")]
    public async Task<IActionResult> IniciarSesion(UsuarioDTO request)
    {
        var token = await _administrarAuth.IniciarSesion(request);

        if (token == null)
        {
            return BadRequest("Nombre de usuario o contraseña incorrectos");
        }

        return Ok(token);
    }

    [Authorize]
    [HttpGet]
    public IActionResult AuthorizedOnly()
    {
        return Ok("Autenticado");
    }
}
