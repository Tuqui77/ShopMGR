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
            var cliente = await _administracionClientes.ObtenerClientePorId(idCliente);
            return cliente;
        }

        [HttpGet]
        [Route("ObtenerClientePorNombre")]
        public async Task<Cliente> ObtenerClientePorNombreAsync(string nombre)
        {
            var cliente = await _administracionClientes.ObtenerClientePorNombre(nombre);
            return cliente;
        }

        [HttpPost]
        [Route("CrearCliente")]
        public async Task<IActionResult> CrearCliente(ClienteDTO cliente)
        {
            await _administracionClientes.CrearClienteAsync(cliente);

            return Ok(cliente);
        }

        [HttpPost]
        [Route("CrearClienteConDatos")]
        public async Task<IActionResult> CrearClienteConDatos(ClienteDTO cliente)
        {
            if (cliente == null)
            {
                return BadRequest("Los datos del cliente no pueden estar vacíos.");
            }
            await _administracionClientes.CrearClienteAsync(cliente);
            return Ok(cliente);
        }
    }
}
