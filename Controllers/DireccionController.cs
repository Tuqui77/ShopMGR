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
        private readonly IAdministrarDireccion _administracionDirecciones = administracionDirecciones;

        [HttpPost]
        [Route("CrearDireccion")]
        public async Task<IActionResult> CrearDireccion(DireccionDTO direccion)
        {
            await _administracionDirecciones.CrearAsync(direccion);
            return Ok(direccion);
        }

        [HttpGet]
        [Route("Obtener detalle por id")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idDireccion)
        {
            var direccion = await _administracionDirecciones.ObtenerDetallePorIdAsync(idDireccion);
            return Ok(direccion);
        }

        [HttpGet]
        [Route("ObtenerDireccionesCliente")]
        public async Task<IActionResult> ObtenerDireccionesCliente(int idCliente)
        {
            var direcciones = await _administracionDirecciones.ObtenerPorIdCliente(idCliente);
            return Ok(direcciones);
        }

        [HttpPatch]
        [Route("ActualizarDireccion")]
        public async Task<IActionResult> ActualizarDireccion(int idDireccion, ModificarDireccion direccion)
        {
            await _administracionDirecciones.ActualizarAsync(idDireccion, direccion);
            return Ok("Direccion actualizada correctamente.");
        }

        [HttpDelete]
        [Route("EliminarDireccion")]
        public async Task<IActionResult> EliminarDireccion(int idDireccion)
        {
            await _administracionDirecciones.EliminarAsync(idDireccion);
            return Ok("Direccion eliminada correctamente.");
        }
    }
}
