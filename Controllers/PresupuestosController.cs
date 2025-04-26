using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresupuestosController(IAdministrarPresupuestos administracionPresupuestos) : ControllerBase
    {
        [HttpPost]
        [Route("CrearPresupuesto")]
        public async Task<IActionResult> CrearPresupuesto(PresupuestoDTO nuevoPresupuesto)
        {
            if (nuevoPresupuesto == null)
            {
                return BadRequest("Los datos del presupuesto no pueden estar vacíos.");
            }

            var presupuesto = await administracionPresupuestos.CrearAsync(nuevoPresupuesto);
            return Ok(presupuesto);
        }

        [HttpGet]
        [Route("ObtenerPresupuestoPorId")]
        public async Task<IActionResult> ObtenerPorId(int idPresupuesto)
        {
            var presupuesto = await administracionPresupuestos.ObtenerPorIdAsync(idPresupuesto);
            return Ok(presupuesto);
        }

        [HttpGet]
        [Route("ObtenerDetallePresupuesto")]
        public async Task<IActionResult> ObtenerDetallePorId(int idPresupuesto)
        {
            var presupuesto = await administracionPresupuestos.ObtenerDetallePorIdAsync(idPresupuesto);
            return Ok(presupuesto);
        }

        [HttpGet]
        [Route("ObtenerPresupuestosPorCliente")]
        public async Task<IActionResult> ObtenerPorCliente(int idCliente)
        {
            var presupuestos = await administracionPresupuestos.ObtenerPorClienteAsync(idCliente);

            if (!presupuestos.Any())
            {
                return NotFound($"No se encontraron presupuestos para el cliente con ID {idCliente}.");
            }

            return Ok(presupuestos);
        }

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

        [HttpPatch]
        [Route("ActualizarPresupuesto")]
        public async Task<IActionResult> ActualizarPresupuesto(int idPresupuesto,
            ModificarPresupuesto presupuestoModificado)
        {
            if (presupuestoModificado == null)
            {
                return BadRequest("Los datos del presupuesto no pueden estar vacíos.");
            }

            await administracionPresupuestos.ActualizarAsync(idPresupuesto, presupuestoModificado);
            return Ok("Presupuesto modificado correctamente");
        }

        [HttpDelete]
        [Route("EliminarPresupuesto")]
        public async Task<IActionResult> EliminarPresupuesto(int idPresupuesto)
        {
            await administracionPresupuestos.EliminarAsync(idPresupuesto);
            return Ok("Presupuesto eliminado correctamente.");
        }

        [HttpPatch]
        [Route("ActualizarCostoHoraDeTrabajo")]
        public async Task<IActionResult> ActualizarCostoHora(string nuevoCosto)
        {
            await administracionPresupuestos.ActualizarCostoHoraDeTrabajo(nuevoCosto);
            return Ok($"Valor de la hora de trabajo actualizado correctamente, nuevo valor: ${nuevoCosto}");
        }

        [HttpGet]
        [Route("ObtenerCostoHoraDeTrabajo")]
        public async Task<IActionResult> ObtenerCostoHora()
        {
            var costoHora = await administracionPresupuestos.ObtenerCostoHoraDeTrabajo();
            return Ok($"El costo de la hora de trabajo es: ${costoHora}");
        }
    }
}