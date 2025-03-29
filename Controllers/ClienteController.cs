using Microsoft.AspNetCore.Http;
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
    public class ClienteController : ControllerBase
    {
        private readonly AdministracionClientes _administracionClientes;
        private readonly ShopMGRDbContexto _contexto;

        public ClienteController(AdministracionClientes administracionClientes, ShopMGRDbContexto contexto)
        {
            _administracionClientes = administracionClientes;
            _contexto = contexto;
        }

        #region Gets
        [HttpGet]
        [Route("ObtenerClientes")]
        public async Task<List<Cliente>> ObtenerClientesAsync()
        {
            var clientes = await _administracionClientes.ListarClientes();
            return clientes;
        }

        [HttpGet]
        [Route("ObtenerClientePorId")]
        public async Task<Cliente> ObtenerClientePorIdAsync(int idCliente)
        {
            var cliente = await _administracionClientes.ObtenerClientePorIdAsync(idCliente);
            return cliente;
        }

        [HttpGet]
        [Route("ObtenerClientePorNombre")]
        public async Task<Cliente> ObtenerClientePorNombreAsync(string nombre)
        {
            var cliente = await _administracionClientes.ObtenerClientePorNombre(nombre);
            return cliente;
        }

        #endregion

        #region Posts
        [HttpPost]
        [Route("CrearCliente")]
        public async Task<IActionResult> CrearCliente(ClienteDTO cliente)
        {
            if(cliente == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }

            await _administracionClientes.CrearClienteAsync(cliente);
            return Ok(cliente);
        }
        #endregion

        #region Patches
        //[HttpPatch]
        //[Route("ActualizarCliente")]

        #endregion

        #region Deletes
        [HttpDelete]
        [Route("EliminarCliente")]
        public async Task<IActionResult> EliminarCliente(int idCliente)
        {
            var cliente = await _administracionClientes.ObtenerClientePorIdAsync(idCliente);
            if (cliente == null)
            {
                return NotFound("No se encontró ningún cliente con ese Id.");
            }

            await _administracionClientes.EliminarClienteAsync(cliente);
            return Ok("Cliente eliminado correctamente.");
        }

        #endregion
    }
}
