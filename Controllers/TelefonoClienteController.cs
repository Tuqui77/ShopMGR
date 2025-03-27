using ShopMGR.Aplicacion.Servicios;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Aplicacion.Data_Transfer_Objects;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TelefonoClienteController : ControllerBase
    {
        private readonly AdministracionTelefonoCliente _administracionTelefonoCliente;
        private readonly ShopMGRDbContexto _contexto;

        public TelefonoClienteController(AdministracionTelefonoCliente administracionTelefonoCliente, ShopMGRDbContexto contexto)
        {
            _administracionTelefonoCliente = administracionTelefonoCliente;
            _contexto = contexto;
        }

        [HttpPost]
        [Route("CrearTelefonoCliente")]
        public async Task CrearTelefonoClienteAsync(TelefonoClienteDTO nuevoTelefono)
        {
            await _administracionTelefonoCliente.CrearTelefonoClienteAsync(nuevoTelefono);
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<List<TelefonoCliente>> ObtenerTelefonosClienteAsync(int idCliente)
        {
            var telefonos = await _administracionTelefonoCliente.ObtenerTelefonosCliente(idCliente);
            return telefonos;
        }
    }
}
