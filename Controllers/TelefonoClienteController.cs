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
            if (nuevoTelefono == null)
            {
                return BadRequest("Los datos del teléfono no pueden estar vacíos.");
            }

            try
            {
                await _administracionTelefonoCliente.CrearAsync(nuevoTelefono);
                return Ok(nuevoTelefono);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idTelefono)
        {
            try
            {
                var telefono = await _administracionTelefonoCliente.ObtenerDetallePorIdAsync(idTelefono);
                return Ok(telefono);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<IActionResult> ObtenerTelefonosClienteAsync(int idCliente)
        {
            var telefonos = await _administracionTelefonoCliente.ObtenerTelefonosCliente(idCliente);
            if (!telefonos.Any())
            {
                return NotFound($"No se encontraron teléfonos para el cliente con ID {idCliente}.");
            }
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

            try
            {
                await _administracionTelefonoCliente.ActualizarAsync(idTelefono, telefonoModificado);
                return Ok("Teléfono modificado con éxito.");
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpDelete]
        [Route("EliminarTelefonoCliente")]
        public async Task<IActionResult> EliminarTelefonoClienteAsync(int idTelefono)
        {
            try
            {
                await _administracionTelefonoCliente.EliminarAsync(idTelefono);
                return Ok("Teléfono eliminado con éxito.");
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }
    }
}
