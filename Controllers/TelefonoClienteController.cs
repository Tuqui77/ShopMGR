using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Newtonsoft.Json.Linq;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TelefonoClienteController(IAdministrarTelefonoCliente administracionTelefono) : ControllerBase
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
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idTelefono)
        {
            var telefono = await _administracionTelefonoCliente.ObtenerDetallePorIdAsync(idTelefono);

            return Ok(telefono);
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<IActionResult> ObtenerTelefonosClienteAsync(int idCliente)
        {
            var telefonos = await _administracionTelefonoCliente.ObtenerTelefonosCliente(idCliente);
            return Ok(telefonos);
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
            return Ok("Teléfono modificado con éxito.");
        }

        [HttpDelete]
        [Route("EliminarTelefonoCliente")]
        public async Task<IActionResult> EliminarTelefonoClienteAsync(int idTelefono)
        {
            await _administracionTelefonoCliente.EliminarAsync(idTelefono);
            return Ok("Teléfono eliminado con éxito.");
        }
    }
}
