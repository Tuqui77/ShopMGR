using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DireccionController(IAdministrarDireccion administracionDirecciones) : ControllerBase
    {
        [HttpPost]
        [Route("CrearDireccion")]
        public async Task<IActionResult> CrearDireccion(DireccionDTO direccion)
        {
            if (direccion == null)
            {
                return BadRequest("Los datos de la dirección no pueden estar vacíos.");
            }

            await administracionDirecciones.CrearAsync(direccion);
            return Ok(direccion);
        }

        [HttpGet]
        [Route("Obtener detalle por id")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idDireccion)
        {
            var direccion = await administracionDirecciones.ObtenerDetallePorIdAsync(idDireccion);
            return Ok(direccion);
        }

        [HttpGet]
        [Route("ObtenerDireccionesCliente")]
        public async Task<IActionResult> ObtenerDireccionesCliente(int idCliente)
        {
            var direcciones = await administracionDirecciones.ObtenerPorIdCliente(idCliente);

            if (!direcciones.Any())
            {
                return NotFound($"No se encontraron direcciones para el cliente con ID {idCliente}.");
            }

            return Ok(direcciones);
        }

        [HttpPatch]
        [Route("ActualizarDireccion")]
        public async Task<IActionResult> ActualizarDireccion(int idDireccion, ModificarDireccion direccion)
        {
            if (direccion == null)
            {
                return BadRequest("Los datos de la dirección no pueden estar vacíos.");
            }

            await administracionDirecciones.ActualizarAsync(idDireccion, direccion);
            return Ok("Direccion actualizada correctamente.");
        }

        [HttpDelete]
        [Route("EliminarDireccion")] //Aca
        public async Task<IActionResult> EliminarDireccion(int idDireccion)
        {
            await administracionDirecciones.EliminarAsync(idDireccion);
            return Ok("Direccion eliminada correctamente.");
        }
    }
}