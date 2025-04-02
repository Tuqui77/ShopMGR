using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresupuestosController(AdministracionPresupuestos administracionPresupuestos) : ControllerBase
    {
        private readonly IAdministrarPresupuestos _administracionPresupuestos = administracionPresupuestos;

        [HttpPost]
        [Route("CrearPresupuesto")]
        public async Task<IActionResult> CrearPresupuesto(PresupuestoDTO nuevoPresupuesto)
        {
            if (nuevoPresupuesto == null)
            {
                return BadRequest("Los datos del presupuesto no pueden estar vacíos.");
            }
            var presupuesto = await _administracionPresupuestos.CrearAsync(nuevoPresupuesto);

            return Ok(presupuesto);
        }

        [HttpGet]
        [Route("ObtenerPresupuestoPorId")]
        public async Task<Presupuesto> ObtenerPorId(int idPresupuesto)
        {
            var presupuesto = await _administracionPresupuestos.ObtenerPorIdAsync(idPresupuesto);
            return presupuesto;
        }

        [HttpPatch]
        [Route("ActualizarPresupuesto")]
        public async Task<IActionResult> ActualizarPresupuesto(int idPresupuesto, ModificarPresupuesto presupuestoModificado)
        {
            await _administracionPresupuestos.ActualizarAsync(idPresupuesto, presupuestoModificado);
            return Ok(presupuestoModificado);
        }

        [HttpDelete]
        [Route("EliminarPresupuesto")]
        public async Task<IActionResult> EliminarPresupuesto(int idPresupuesto)
        {
            await _administracionPresupuestos.EliminarAsync(idPresupuesto);
            return Ok(idPresupuesto);
        }
    }
}
