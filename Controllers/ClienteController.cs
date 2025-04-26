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
        [HttpPost]
        [Route("CrearCliente")]
        public async Task<IActionResult> CrearCliente(ClienteDTO cliente)
        {
            if (cliente == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }

            await administracionClientes.CrearAsync(cliente);
            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerListaClientes")]
        public async Task<IActionResult> ObtenerClientesAsync()
        {
            var clientes = await administracionClientes.ListarTodosAsync();

            if (!clientes.Any())
            {
                return NotFound("No se encontraron clientes.");
            }

            return Ok(clientes);
        }

        [HttpGet]
        [Route("ObtenerClientePorId")]
        public async Task<IActionResult> ObtenerClientePorIdAsync(int idCliente)
        {
            var cliente = await administracionClientes.ObtenerPorIdAsync(idCliente);
            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idCliente)
        {
            var cliente = await administracionClientes.ObtenerDetallePorIdAsync(idCliente);
            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerClientePorNombre")]
        public async Task<IActionResult> ObtenerClientePorNombreAsync(string nombre)
        {
            if (string.IsNullOrEmpty(nombre))
            {
                return BadRequest("Complete el nombre del cliente.");
            }

            var cliente = await administracionClientes.ObtenerClientePorNombreAsync(nombre);
            return Ok(cliente);
        }

        [HttpPatch]
        [Route("ModificarCliente")] //Acá
        public async Task<IActionResult> ActualizarCliente(int idCliente,
            [FromBody] ModificarCliente clienteActualizado)
        {
            if (clienteActualizado == null)
            {
                return BadRequest("No se ingresó ningún dato a actualizar.");
            }

            await administracionClientes.ActualizarAsync(idCliente, clienteActualizado);
            return Ok($"Cliente actualizado correctamente.");
        }

        [HttpDelete]
        [Route("EliminarCliente")]
        public async Task<IActionResult> EliminarCliente(int idCliente)
        {
            await administracionClientes.EliminarAsync(idCliente);
            return Ok("Cliente eliminado correctamente.");
        }
    }
}