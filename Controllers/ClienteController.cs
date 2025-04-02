using Azure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
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
        private readonly IAdministrarClientes _administracionClientes;
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
            var clientes = await _administracionClientes.ListarTodosAsync();
            return clientes;
        }

        [HttpGet]
        [Route("ObtenerClientePorId")]
        public async Task<Cliente> ObtenerClientePorIdAsync(int idCliente)
        {
            var cliente = await _administracionClientes.ObtenerPorIdAsync(idCliente);
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

            await _administracionClientes.CrearAsync(cliente);
            return Ok(cliente);
        }
        #endregion

        #region Deletes
        [HttpDelete]
        [Route("EliminarCliente")]
        public async Task<IActionResult> EliminarCliente(int idCliente)//Mover la validación a la capa de aplicación.
        {
            await _administracionClientes.EliminarAsync(idCliente);
            return Ok("Cliente eliminado correctamente.");
        }

        #endregion

        #region Patch 
        [HttpPatch]
        [Route("ModificarCliente")]
        public async Task<IActionResult> ActualizarCliente(int idCliente, [FromBody] ModificarCliente clienteActualizado)
        {
            if (clienteActualizado == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }

            await _administracionClientes.ActualizarAsync(idCliente, clienteActualizado);
            return Ok(clienteActualizado);
        }
        #endregion
    }
}
