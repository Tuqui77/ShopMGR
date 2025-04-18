using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClienteController(IAdministrarClientes administracionClientes) : ControllerBase
    {
        private readonly IAdministrarClientes _administracionClientes = administracionClientes;

        [HttpPost]
        [Route("CrearCliente")]
        public async Task<IActionResult> CrearCliente(ClienteDTO cliente)
        {
            if (cliente == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }

            await _administracionClientes.CrearAsync(cliente);
            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerClientes")]
        public async Task<IActionResult> ObtenerClientesAsync()
        {
            var clientes = await _administracionClientes.ListarTodosAsync();
            return Ok(clientes);
        }

        [HttpGet]
        [Route("ObtenerClientePorId")]
        public async Task<IActionResult> ObtenerClientePorIdAsync(int idCliente)
        {
            var cliente = await _administracionClientes.ObtenerPorIdAsync(idCliente);
            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idCliente)
        {
            var cliente = await _administracionClientes.ObtenerDetallePorIdAsync(idCliente);

            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerClientePorNombre")]
        public async Task<IActionResult> ObtenerClientePorNombreAsync(string nombre)
        {
            var cliente = await _administracionClientes.ObtenerClientePorNombre(nombre);
            return Ok(cliente);
        }

        [HttpPatch]
        [Route("ModificarCliente")]
        public async Task<IActionResult> ActualizarCliente(int idCliente, [FromBody] ModificarCliente clienteActualizado)
        {
            if (clienteActualizado == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }

            await _administracionClientes.ActualizarAsync(idCliente, clienteActualizado);
            return Ok($"Cliente actualizado correctamente.");
        }

        [HttpDelete]
        [Route("EliminarCliente")]
        public async Task<IActionResult> EliminarCliente(int idCliente)
        {
            await _administracionClientes.EliminarAsync(idCliente);
            return Ok("Cliente eliminado correctamente.");
        }

    }
}
