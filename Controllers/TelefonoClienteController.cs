using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TelefonoClienteController(AdministracionTelefonoCliente administracionTelefono) : ControllerBase
    {
        private readonly IAdministrarTelefonoCliente _administracionTelefonoCliente = administracionTelefono;

        [HttpPost]
        [Route("CrearTelefonoCliente")]
        public async Task<IActionResult> CrearTelefonoClienteAsync(TelefonoClienteDTO nuevoTelefono)
        {
            await _administracionTelefonoCliente.CrearAsync(nuevoTelefono);
            return Ok(nuevoTelefono);
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<List<TelefonoCliente>> ObtenerTelefonosClienteAsync(int idCliente)
        {
            return await _administracionTelefonoCliente.ObtenerTelefonosCliente(idCliente);
        }

        [HttpPatch]
        [Route("ModificarTelefonoCliente")]
        public async Task<IActionResult> ModificarTelefonoClienteAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            if (telefonoModificado == null)
            {
                return BadRequest("Los datos del teléfono no pueden estar vacíos.");
            }

            await _administracionTelefonoCliente.ActualizarAsync(idTelefono, telefonoModificado);
            return Ok(telefonoModificado);
        }

        [HttpDelete]
        [Route("EliminarTelefonoCliente")]
        public async Task<IActionResult> EliminarTelefonoClienteAsync(int idTelefono)
        {
            await _administracionTelefonoCliente.EliminarAsync(idTelefono);
            return Ok();
        }
    }
}
