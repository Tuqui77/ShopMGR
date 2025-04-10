using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrabajosController(IAdministrarTrabajos administrarTrabajos) : ControllerBase
    {
        IAdministrarTrabajos _administrarTrabajos = administrarTrabajos;


        [HttpPost]
        [Route("CrearTrabajo")]
        public async Task<IActionResult> CrearTrabajo([FromBody] TrabajoDTO trabajo)
        {
            if (trabajo == null)
            {
                return BadRequest("Los datos del trabajo no pueden estar vacíos.");
            }

            await _administrarTrabajos.CrearAsync(trabajo);
            return Ok(trabajo);
        }

        [HttpPost]
        [Route("AgregarFotosTrabajo")]
        public async Task<IActionResult> AgregarFotosTrabajo(int idTrabajo, [FromBody] List<FotoDTO> fotos)
        {
            if (fotos == null || fotos.Count == 0)
            {
                return BadRequest("La lista de fotos no puede estar vacía.");
            }

            await _administrarTrabajos.AgregarFotosAsync(idTrabajo, fotos);
            return Ok($"Fotos agregadas al trabajo con ID {idTrabajo} correctamente.");
        }

        [HttpGet]
        [Route("ObtenerTrabajoPorId")]
        public async Task<IActionResult> ObtenerTrabajoPorId(int idTrabajo)
        {
            var trabajo = await _administrarTrabajos.ObtenerPorIdAsync(idTrabajo);
            if (trabajo == null)
            {
                return NotFound($"No se encontró un trabajo con el ID {idTrabajo}.");
            }

            return Ok(trabajo);
        }

        [HttpGet]
        [Route("ObtenerTrabajosPorCliente")]
        public async Task<ActionResult<List<Trabajo>>> ObtenerTrabajosPorCliente(int idCliente)
        {
            var trabajos = await _administrarTrabajos.ObtenerPorClienteAsync(idCliente);

            if (trabajos == null || trabajos.Count == 0)
            {
                return NotFound($"No se encontraron trabajos para el cliente con ID {idCliente}.");
            }

            return Ok(trabajos);
        }

        [HttpGet]
        [Route("ObtenerTrabajosPorEstado")]
        public async Task<ActionResult<List<Trabajo>>> ObtenerTrabajosPorEstado(EstadoTrabajo estado)
        {
            var trabajos = await _administrarTrabajos.ObtenerPorEstadoAsync(estado);

            if (trabajos == null || trabajos.Count == 0)
            {
                return NotFound($"No se encontraron trabajos con el estado {estado}.");
            }

            return Ok(trabajos);
        }

        [HttpPatch]
        [Route("ModificarTrabajo")]
        public async Task<IActionResult> ModificarTrabajo(int idTrabajo, [FromBody] ModificarTrabajo trabajoModificado)
        {
            if (trabajoModificado == null)
            {
                return BadRequest("Los datos del trabajo no pueden estar vacíos.");
            }

            await _administrarTrabajos.ActualizarAsync(idTrabajo, trabajoModificado);
            return Ok($"Trabajo con ID {idTrabajo} actualizado correctamente.");
        }


        [HttpDelete]
        [Route("EliminarTrabajo")]
        public async Task<IActionResult> EliminarTrabajo(int idTrabajo)
        {
            var trabajo = await _administrarTrabajos.ObtenerPorIdAsync(idTrabajo);
            if (trabajo == null)
            {
                return NotFound($"No se encontró un trabajo con el ID {idTrabajo}.");
            }

            await _administrarTrabajos.EliminarAsync(idTrabajo);
            return Ok($"Trabajo con ID {idTrabajo} eliminado correctamente.");
        }
    }
}
