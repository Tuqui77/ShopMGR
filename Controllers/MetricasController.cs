using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Interfaces;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MetricasController(IAdministracionMetricas administracionMetricas) : ControllerBase
    {
        [Authorize]
        [HttpGet]
        [Route("ObtenerIngresos")]
        public async Task<IActionResult> ObtenerIngresosAsync(DateOnly fecha)
        {
            var ingresosMes = await administracionMetricas.ObtenerIngresosAsync(fecha);

            return new JsonResult(ingresosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerHoras")]
        public async Task<IActionResult> ObtenerHorasAsync(DateOnly fecha)
        {
            var horasTrabajadasMes = await administracionMetricas.ObtenerHorasAsync(fecha);

            return new JsonResult(horasTrabajadasMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerTrabajosTerminados")]
        public async Task<IActionResult> ObtenerTrabajosTerminadosAsync(DateOnly fecha)
        {
            var trabajosTerminadosMes = await administracionMetricas.ObtenerTrabajosTerminadosAsync(fecha);

            return new JsonResult(trabajosTerminadosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosEntregados")]
        public async Task<IActionResult> ObtenerPresupuestosCreadosAsync(DateOnly fecha)
        {
            var presupuestosCreadosMes = await administracionMetricas.ObtenerPresupuestosCreadosAsync(fecha);

            return new JsonResult(presupuestosCreadosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosAceptados")]
        public async Task<IActionResult> ObtenerPresupuestosAceptadosAsync(DateOnly fecha)
        {
            var presupuestosAceptadosMes = await administracionMetricas.ObtenerPresupuestosAceptadosAsync(fecha);

            return new JsonResult(presupuestosAceptadosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerMesesConDatos")]
        public async Task<IActionResult> ObtenerMesesConDatos()
        {
            var mesesConDatos = await administracionMetricas.ObtenerMesesConDatos();

            return Ok(mesesConDatos);
        }
    }
}
