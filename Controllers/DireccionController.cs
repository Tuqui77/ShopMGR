using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;

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
        public IActionResult CrearDireccion(Direccion direccion)
        {
            _contexto.Direccion.Add(direccion);
            _contexto.SaveChanges();
            return Ok(direccion);
        }
    }
}
