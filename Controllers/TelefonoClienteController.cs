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
        [HttpPost]
        [Route("CrearTelefonoCliente")]
        public async Task<IActionResult> CrearTelefonoClienteAsync(TelefonoClienteDTO nuevoTelefono)
        {
            if (nuevoTelefono == null)
            {
                return BadRequest("Los datos del teléfono no pueden estar vacíos.");
            }

            await administracionTelefono.CrearAsync(nuevoTelefono);
            return Ok(nuevoTelefono);
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idTelefono)
        {
            var telefono = await administracionTelefono.ObtenerDetallePorIdAsync(idTelefono);
            return Ok(telefono);
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<IActionResult> ObtenerTelefonosClienteAsync(int idCliente)
        {
            var telefonos = await administracionTelefono.ObtenerTelefonosCliente(idCliente);
            if (!telefonos.Any())
            {
                return NotFound($"No se encontraron teléfonos para el cliente con ID {idCliente}.");
            }

            return Ok(telefonos);
        }

        [HttpPatch]
        [Route("ModificarTelefonoCliente")]
        public async Task<IActionResult> ModificarTelefonoClienteAsync(int idTelefono,
            ModificarTelefono telefonoModificado)
        {
            if (telefonoModificado == null)
            {
                return BadRequest("Los datos del teléfono no pueden estar vacíos.");
            }

            await administracionTelefono.ActualizarAsync(idTelefono, telefonoModificado);
            return Ok("Teléfono modificado con éxito.");
        }

        [HttpDelete]
        [Route("EliminarTelefonoCliente")]
        public async Task<IActionResult> EliminarTelefonoClienteAsync(int idTelefono)
        {
            await administracionTelefono.EliminarAsync(idTelefono);
            return Ok("Teléfono eliminado con éxito.");
        }
    }
}