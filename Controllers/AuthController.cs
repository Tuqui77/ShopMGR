using System.Security.Claims;
using Fido2NetLib;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers;

// TODO(#99): Necesito agregar una forma de recuperar la contraseña de una cuenta. En pos de evitar el tener que confirmar la
//identidad por correo electrónico la manera más razonable parece dejar un endpoint donde un administrador pueda
//restablecer la contraseña de otra cuenta, asignándole un token de un solo uso y pidiendo ingresar una nueva
//contraseña. Para esto va a hacer falta agregar roles a los usuarios para designar un administrador.
[Route("api/[controller]")]
[ApiController]
public class AuthController(
    IAdministrarAuth administrarAuth,
    IAdministracionPasskeys administracionPasskeys,
    IFido2 fido2
) : ControllerBase
{
    private readonly IAdministrarAuth _administrarAuth = administrarAuth;
    private readonly IAdministracionPasskeys _administracionPasskeys = administracionPasskeys;
    private readonly IFido2 _fido2 = fido2;

    [HttpPost]
    [Route("RegistrarUsuario")]
    public async Task<IActionResult> RegistrarUsuario(UsuarioDTO request)
    {
        var usuario = await _administrarAuth.RegistrarUsuarioAsync(request);

        if (usuario == null)
            return BadRequest("El nombre de usuario ya esta en uso");

        return Ok("Usuario creado con exito");
    }

    [EnableRateLimiting("login")]
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
        var respuestaLogin = await _administrarAuth.Refrescar(refreshTokenRequest);

        if (respuestaLogin == null)
            return BadRequest("Refresh Token inválido");

        return Ok(respuestaLogin);
    }

    [HttpPost]
    [Route("CerrarSesion")]
    public async Task<IActionResult> CerrarSesion(int idUsuario, string refreshTokenRequest)
    {
        await _administrarAuth.CerrarSesion(refreshTokenRequest);

        return Ok("Sesión cerrada correctamente");
    }

    [Authorize]
    [HttpPost]
    [Route("passkeys/registrar/opciones")]
    public async Task<IActionResult> ObtenerOpcionesRegistro()
    {
        var idUsuario = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _administrarAuth.ObtenerUsuarioPorIdAsync(idUsuario);

        if (usuario == null)
            return Unauthorized();

        var opciones = await _administracionPasskeys.ObtenerOpcionesRegistroAsync(usuario);

        return Ok(opciones);
    }

    [Authorize]
    [HttpPost]
    [Route("passkeys/registrar")]
    public async Task<IActionResult> RegistrarPasskey(RegistrarPasskeyRequest request)
    {
        var idUsuario = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _administrarAuth.ObtenerUsuarioPorIdAsync(idUsuario);

        if (usuario == null)
            return Unauthorized();

        var attestationResponse = new AuthenticatorAttestationRawResponse
        {
            Id = request.Id,
            RawId = DecodificarBase64Url(request.RawId),
            Response = new AuthenticatorAttestationRawResponse.AttestationResponse
            {
                AttestationObject = request.RespuestaAttestation.Attestation,
                ClientDataJson = request.RespuestaAttestation.DatosClienteJson,
            },
        };

        try
        {
            var passkey = await _administracionPasskeys.CompletarRegistroAsync(
                usuario,
                attestationResponse,
                request.NombreDispositivo
            );
            return Ok("Passkey registrada exitosamente");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Fido2VerificationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    [Route("passkeys/auth/opciones")]
    public async Task<IActionResult> ObtenerOpcionesAuth()
    {
        var opciones = await _administracionPasskeys.ObtenerOpcionesAuthAsync();
        return Ok(opciones);
    }

    [EnableRateLimiting("login")]
    [HttpPost]
    [Route("passkeys/auth")]
    public async Task<IActionResult> IniciarSesionConPasskey(IniciarSesionPasskeyRequest request)
    {
        var respuestaAssertion = new AuthenticatorAssertionRawResponse
        {
            Id = request.Id,
            RawId = DecodificarBase64Url(request.RawId),
            Response = new AuthenticatorAssertionRawResponse.AssertionResponse
            {
                AuthenticatorData = request.RespuestaAssertion.DatosAutenticador,
                Signature = request.RespuestaAssertion.Firma,
                ClientDataJson = request.RespuestaAssertion.DatosClienteJson,
                UserHandle = request.RespuestaAssertion.UserHandle,
            },
        };

        try
        {
            var usuario = await _administracionPasskeys.CompletarAuthAsync(respuestaAssertion);
            if (usuario == null)
                return BadRequest("Error al autenticar con passkey");

            //Generar datos de inicio de sesión normal:
            var respuestaLogin = await _administrarAuth.FinalizarAuthPasskey(usuario);

            return Ok(respuestaLogin);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Fido2VerificationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpGet]
    [Route("passkeys/listar")]
    public async Task<IActionResult> ListarPasskeysPorIdUsuario()
    {
        var idUsuario = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var credencialesUsuario = await _administracionPasskeys.ListarPasskeysPorIdUsuario(idUsuario);

        return Ok(credencialesUsuario);
    }

    [Authorize]
    [HttpPatch]
    [Route("passkeys/editar")]
    public async Task<IActionResult> EditarNombrePasskey([FromQuery] byte[] idCredencial, string nombreNuevo)
    {
        await _administracionPasskeys.EditarNombrePasskey(idCredencial, nombreNuevo);

        return Ok("Nombre de la passkey modificado");
    }

    [Authorize]
    [HttpDelete]
    [Route("passkeys/eliminar")]
    public async Task<IActionResult> EliminarPasskey([FromQuery] byte[] idCredencial)
    {
        await _administracionPasskeys.EliminarPasskeyAsync(idCredencial);

        return Ok("Passkey eliminada correctamente");
    }

    private byte[] DecodificarBase64Url(string rawIdRequest)
    {
        var rawIdB64 = rawIdRequest.Replace("-", "+").Replace("_", "/");

        switch (rawIdB64.Length % 4)
        {
            case 2:
                rawIdB64 += "==";
                break;
            case 3:
                rawIdB64 += "=";
                break;
        }

        return Convert.FromBase64String(rawIdB64);
    }

    [Authorize]
    [HttpGet]
    public IActionResult AuthorizedOnly()
    {
        return Ok("Autenticado");
    }
}
