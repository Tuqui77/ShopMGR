using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using System.Threading.Tasks;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DireccionController(AdministracionDireccion administracionDirecciones) : ControllerBase
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
        [Route("ObtenerDireccionesCliente")]
        public async Task<List<Direccion>> ObtenerDireccionesCliente(int idCliente)
        {
            return await _administracionDirecciones.ObtenerPorIdCliente(idCliente);
        }

        [HttpPatch]
        [Route("ActualizarDireccion")]
        public async Task<IActionResult> ActualizarDireccion(int idDireccion, ModificarDireccion direccion)
        {
            await _administracionDirecciones.ActualizarAsync(idDireccion, direccion);
            return Ok(direccion);
        }

        [HttpDelete]
        [Route("EliminarDireccion")]
        public async Task<IActionResult> EliminarDireccion(int idDireccion)
        {
            await _administracionDirecciones.EliminarAsync(idDireccion);
            return Ok();
        }
    }
}
