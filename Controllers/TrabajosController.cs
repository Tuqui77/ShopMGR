using Google.Apis.Drive.v3;
using Google.Apis.Services;
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
    public class TrabajosController(IAdministrarTrabajos administrarTrabajos, IGoogleDriveServicio servicio) : ControllerBase
    {
        private readonly IAdministrarTrabajos _administrarTrabajos = administrarTrabajos;
        private readonly IGoogleDriveServicio _servicioDrive = servicio;

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
        public async Task<IActionResult> AgregarFotosTrabajo(int idTrabajo, [FromForm] IFormFileCollection fotos)
        {
            if (fotos == null || fotos.Count == 0)
            {
                return BadRequest("No se seleccionó ningún archivo.");
            }
            await _servicioDrive.ConectarConGoogleDrive();

            var DTOs = new List<FotoDTO>();

            foreach (var foto in fotos)
            {
                var enlace = await _servicioDrive.SubirArchivoAsync(foto);
                
                var fotoDTO = new FotoDTO
                {
                    IdTrabajo = idTrabajo,
                    Enlace = enlace
                };

                DTOs.Add(fotoDTO);
            }

            await _administrarTrabajos.AgregarFotosAsync(DTOs);

            return Ok($"Fotos agregadas al trabajo con ID {idTrabajo} correctamente.");
        }

        [HttpPost]
        [Route("AgregarHorasDeTrabajo")]
        public async Task<IActionResult> AgregarHorasDeTrabajo([FromBody] HorasYDescripcionDTO horas)
        {
            if (horas == null)
            {
                return BadRequest("La petición no puede estar vacía.");
            }

            horas.Fecha = horas.Fecha == default ? DateTime.Now : horas.Fecha;
            await _administrarTrabajos.AgregarHorasAsync(horas);
            return Ok($"{horas.Horas} horas de trabajo agregadas al trabajo con ID {horas.IdTrabajo} correctamente.");
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
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorId(int idTrabajo)
        {
            var trabajo = await _administrarTrabajos.ObtenerDetallePorIdAsync(idTrabajo);

            return Ok(trabajo);
        }

        [HttpGet]
        [Route("ObtenerTrabajosPorCliente")]
        public async Task<IActionResult> ObtenerTrabajosPorCliente(int idCliente)
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
        public async Task<IActionResult> ObtenerTrabajosPorEstado(EstadoTrabajo estado)
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
            return Ok("Trabajo actualizado correctamente.");
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
            return Ok("Trabajo eliminado correctamente.");
        }
    }
}
