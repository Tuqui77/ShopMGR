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

            return Ok(ingresosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerHoras")]
        public async Task<IActionResult> ObtenerHorasAsync(DateOnly fecha)
        {
            var horasTrabajadasMes = await administracionMetricas.ObtenerHorasAsync(fecha);

            return Ok(horasTrabajadasMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerTrabajosTerminados")]
        public async Task<IActionResult> ObtenerTrabajosTerminadosAsync(DateOnly fecha)
        {
            var trabajosTerminadosMes = await administracionMetricas.ObtenerTrabajosTerminadosAsync(fecha);

            return Ok(trabajosTerminadosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosEntregados")]
        public async Task<IActionResult> ObtenerPresupuestosCreadosAsync(DateOnly fecha)
        {
            var presupuestosCreadosMes = await administracionMetricas.ObtenerPresupuestosCreadosAsync(fecha);

            return Ok(presupuestosCreadosMes);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosAceptados")]
        public async Task<IActionResult> ObtenerPresupuestosAceptadosAsync(DateOnly fecha)
        {
            var presupuestosAceptadosMes = await administracionMetricas.ObtenerPresupuestosAceptadosAsync(fecha);

            return Ok(presupuestosAceptadosMes);
        }
    }
}
