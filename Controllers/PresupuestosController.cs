using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Razor.Internal;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresupuestosController(IAdministrarPresupuestos administracionPresupuestos)
        : ControllerBase
    {
        [Authorize]
        [HttpPost]
        [Route("CrearPresupuesto")]
        public async Task<IActionResult> CrearPresupuesto(PresupuestoDTOcreacion nuevoPresupuesto)
        {
            if (nuevoPresupuesto == null)
            {
                return BadRequest("Los datos del presupuesto no pueden estar vacíos.");
            }

            var presupuesto = await administracionPresupuestos.CrearAsync(nuevoPresupuesto);
            return Ok(presupuesto);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestoPorId")]
        public async Task<IActionResult> ObtenerPorId(int idPresupuesto)
        {
            var presupuesto = await administracionPresupuestos.ObtenerPorIdAsync(idPresupuesto);
            return Ok(presupuesto);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerDetallePresupuesto")]
        public async Task<IActionResult> ObtenerDetallePorId(int idPresupuesto)
        {
            var presupuesto = await administracionPresupuestos.ObtenerDetallePorIdAsync(
                idPresupuesto
            );
            return Ok(presupuesto);
        }

        [Authorize]
        [HttpGet]
        [Route("ListarPresupuestos")]
        public async Task<IActionResult> ListarPresupuestos()
        {
            var presupuestos = await administracionPresupuestos.ListarPresupuestos();

            return Ok(presupuestos);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosPorCliente")]
        public async Task<IActionResult> ObtenerPorCliente(int idCliente)
        {
            var presupuestos = await administracionPresupuestos.ObtenerPorClienteAsync(idCliente);

            if (!presupuestos.Any())
            {
                return NotFound(
                    $"No se encontraron presupuestos para el cliente con ID {idCliente}."
                );
            }

            return Ok(presupuestos);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerPresupuestosEstado")]
        public async Task<IActionResult> ObtenerPorEstado(EstadoPresupuesto estado)
        {
            var presupuestos = await administracionPresupuestos.ObtenerPorEstadoAsync(estado);

            if (!presupuestos.Any())
            {
                return NotFound($"No se encontro ningun presupuesto {estado}.");
            }

            return Ok(presupuestos);
        }

        [Authorize]
        [HttpPatch]
        [Route("ActualizarPresupuesto")]
        public async Task<IActionResult> ActualizarPresupuesto(
            int idPresupuesto,
            ModificarPresupuesto presupuestoModificado
        )
        {
            if (presupuestoModificado == null)
            {
                return BadRequest("Los datos del presupuesto no pueden estar vacíos.");
            }

            await administracionPresupuestos.ActualizarAsync(idPresupuesto, presupuestoModificado);
            return Ok("Presupuesto modificado correctamente");
        }

        [Authorize]
        [HttpPatch]
        [Route("AceptarPresupuesto")]
        public async Task<IActionResult> AceptarPresupuesto(int idPresupuesto)
        {
            await administracionPresupuestos.AceptarPresupuesto(idPresupuesto);

            return Ok();
        }

        [Authorize]
        [HttpPatch]
        [Route("RechazarPresupuesto")]
        public async Task<IActionResult> RechazarPresupuesto(int idPresupuesto)
        {
            await administracionPresupuestos.RechazarPresupuesto(idPresupuesto);

            return Ok();
        }

        [Authorize]
        [HttpDelete]
        [Route("EliminarPresupuesto")]
        public async Task<IActionResult> EliminarPresupuesto(int idPresupuesto)
        {
            await administracionPresupuestos.EliminarAsync(idPresupuesto);
            return Ok("Presupuesto eliminado correctamente.");
        }

        [Authorize]
        [HttpPatch]
        [Route("ActualizarCostoHoraDeTrabajo")]
        public async Task<IActionResult> ActualizarCostoHora(decimal nuevoCosto)
        {
            await administracionPresupuestos.ActualizarCostoHoraDeTrabajo(nuevoCosto);
            return Ok(nuevoCosto);
        }

        [Authorize]
        [HttpGet]
        [Route("ObtenerCostoHoraDeTrabajo")]
        public async Task<IActionResult> ObtenerCostoHora()
        {
            var costoHora = await administracionPresupuestos.ObtenerCostoHoraDeTrabajo();
            return Ok(costoHora);
        }
    }
}
