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
    public class TrabajosController(IAdministrarTrabajos administrarTrabajos, IGoogleDriveServicio servicio)
        : ControllerBase
    {
        [HttpPost]
        [Route("CrearTrabajo")]
        public async Task<IActionResult> CrearTrabajo([FromBody] TrabajoDTO trabajo)
        {
            if (trabajo == null)
            {
                return BadRequest("Los datos del trabajo no pueden estar vacíos.");
            }

            await administrarTrabajos.CrearAsync(trabajo);
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

            await servicio.ConectarConGoogleDrive();

            var DTOs = new List<FotoDTO>();

            foreach (var foto in fotos)
            {
                var enlace = await servicio.SubirArchivoAsync(foto);

                var fotoDTO = new FotoDTO
                {
                    IdTrabajo = idTrabajo,
                    Enlace = enlace
                };

                DTOs.Add(fotoDTO);
            }

            await administrarTrabajos.AgregarFotosAsync(DTOs);

            return Ok($"Fotos agregadas al trabajo con ID {idTrabajo} correctamente.");
        }

        [HttpPost]
        [Route("AgregarHorasDeTrabajo")]
        public async Task<IActionResult> AgregarHorasDeTrabajo(HorasYDescripcionDTO horas)
        {
            if (horas == null)
            {
                return BadRequest("La petición no puede estar vacía.");
            }

            horas.Fecha = horas.Fecha == default ? DateTime.Now : horas.Fecha;
            await administrarTrabajos.AgregarHorasAsync(horas);
            return Ok(
                $"{horas.Horas} horas de trabajo agregadas al trabajo con ID {horas.IdTrabajo} correctamente.");
        }

        [HttpGet]
        [Route("ObtenerTrabajoPorId")]
        public async Task<IActionResult> ObtenerTrabajoPorId(int idTrabajo)
        {
            var trabajo = await administrarTrabajos.ObtenerPorIdAsync(idTrabajo);
            return Ok(trabajo);
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorId(int idTrabajo)
        {
            var trabajo = await administrarTrabajos.ObtenerDetallePorIdAsync(idTrabajo);
            return Ok(trabajo);
        }

        [HttpGet]
        [Route("ObtenerTrabajosPorCliente")]
        public async Task<IActionResult> ObtenerTrabajosPorCliente(int idCliente)
        {
            var trabajos = await administrarTrabajos.ObtenerPorClienteAsync(idCliente);

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
            var trabajos = await administrarTrabajos.ObtenerPorEstadoAsync(estado);

            if (trabajos == null || trabajos.Count == 0)
            {
                return NotFound($"No se encontro ningun trabajo {estado}.");
            }

            return Ok(trabajos);
        }

        [HttpPatch]
        [Route("ModificarTrabajo")] //Acá
        public async Task<IActionResult> ModificarTrabajo(int idTrabajo, [FromBody] ModificarTrabajo trabajoModificado)
        {
            if (trabajoModificado == null)
            {
                return BadRequest("Los datos del trabajo no pueden estar vacíos.");
            }

            await administrarTrabajos.ActualizarAsync(idTrabajo, trabajoModificado);
            return Ok("Trabajo actualizado correctamente.");
        }


        [HttpDelete]
        [Route("EliminarTrabajo")]
        public async Task<IActionResult> EliminarTrabajo(int idTrabajo)
        {
            await administrarTrabajos.EliminarAsync(idTrabajo);
            return Ok("Trabajo eliminado correctamente.");
        }
    }
}