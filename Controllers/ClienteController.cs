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

            try
            {
                await _administracionClientes.CrearAsync(cliente);
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }

            return Ok(cliente);
        }

        [HttpGet]
        [Route("ObtenerListaClientes")]
        public async Task<IActionResult> ObtenerClientesAsync()
        {
            var clientes = await _administracionClientes.ListarTodosAsync();

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
            try
            {
                var cliente = await _administracionClientes.ObtenerPorIdAsync(idCliente);
                return Ok(cliente);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet]
        [Route("ObtenerDetallePorId")]
        public async Task<IActionResult> ObtenerDetallePorIdAsync(int idCliente)
        {
            try
            {
                var cliente = await _administracionClientes.ObtenerDetallePorIdAsync(idCliente);
                return Ok(cliente);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpGet]
        [Route("ObtenerClientePorNombre")]
        public async Task<IActionResult> ObtenerClientePorNombreAsync(string nombre)
        {
            if (string.IsNullOrEmpty(nombre))
            {
                return BadRequest("Complete el nombre del cliente.");
            }

            try
            {
                var cliente = await _administracionClientes.ObtenerClientePorNombreAsync(nombre);
                return Ok(cliente);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }

        [HttpPatch]
        [Route("ModificarCliente")] //Acá
        public async Task<IActionResult> ActualizarCliente(int idCliente, [FromBody] ModificarCliente clienteActualizado)
        {
            if (clienteActualizado == null)
            {
                return BadRequest("No se ingresó ningún dato a actualizar.");
            }

            try
            {
                await _administracionClientes.ActualizarAsync(idCliente, clienteActualizado);
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }

            return Ok($"Cliente actualizado correctamente.");
        }

        [HttpDelete]
        [Route("EliminarCliente")]
        public async Task<IActionResult> EliminarCliente(int idCliente)
        {
            try
            {
                await _administracionClientes.EliminarAsync(idCliente);
                return Ok("Cliente eliminado correctamente.");
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
        }
    }
}
