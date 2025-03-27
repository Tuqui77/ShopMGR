using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using System.Threading.Tasks;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DireccionController : ControllerBase
    {
        private readonly AdministracionDireccion _administracionDirecciones;
        private readonly ShopMGRDbContexto _contexto;

        public DireccionController(AdministracionDireccion administracionDirecciones, ShopMGRDbContexto contexto)
        {
            _administracionDirecciones = administracionDirecciones;
            _contexto = contexto;
        }

        [HttpPost]
        [Route("CrearDireccion")]
        public async Task<IActionResult> CrearDireccion(DireccionDTO direccion)
        {
            await _administracionDirecciones.CrearDireccionAsync(direccion);

            return Ok(direccion);
        }
    }
}
