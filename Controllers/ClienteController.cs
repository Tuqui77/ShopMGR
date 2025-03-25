using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Aplicacion.Servicios;
using ShopMGR.Contexto;
using ShopMGR.Dominio;

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
        public async Task<List<Cliente>> ObtenerClientesAsync()
        {
            var clientes = await _administracionClientes.ListarClientes();
            return clientes;
        }

        [HttpPost]
        [Route("CrearCliente")]
        public IActionResult CrearCliente(Cliente cliente)
        {
            _contexto.Clientes.Add(cliente);
            _contexto.SaveChanges();

            return Ok(cliente);
        }

    }
}
