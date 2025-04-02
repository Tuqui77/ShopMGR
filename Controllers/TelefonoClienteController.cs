using ShopMGR.Aplicacion.Servicios;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;

namespace ShopMGR.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TelefonoClienteController : ControllerBase
    {
        private readonly IAdministrarTelefonoCliente _administracionTelefonoCliente;
        private readonly ShopMGRDbContexto _contexto;

        public TelefonoClienteController(AdministracionTelefonoCliente administracionTelefonoCliente, ShopMGRDbContexto contexto)
        {
            _administracionTelefonoCliente = administracionTelefonoCliente;
            _contexto = contexto;
        }

        [HttpPost]
        [Route("CrearTelefonoCliente")]
        public async Task<IActionResult> CrearTelefonoClienteAsync(TelefonoClienteDTO nuevoTelefono)
        {
            await _administracionTelefonoCliente.CrearAsync(nuevoTelefono);
            return Ok(nuevoTelefono);
        }

        [HttpGet]
        [Route("ObtenerTelefonosCliente")]
        public async Task<List<TelefonoCliente>> ObtenerTelefonosClienteAsync(int idCliente)
        {
            return await _administracionTelefonoCliente.ObtenerTelefonosCliente(idCliente);
        }

        [HttpPatch]
        [Route("ModificarTelefonoCliente")]
        public async Task<IActionResult> ModificarTelefonoClienteAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            if (telefonoModificado == null)
            {
                return BadRequest("Los datos del teléfono no pueden estar vacíos.");
            }

            await _administracionTelefonoCliente.ActualizarAsync(idTelefono, telefonoModificado);
            return Ok(telefonoModificado);
        }

        [HttpDelete]
        [Route("EliminarTelefonoCliente")]
        public async Task<IActionResult> EliminarTelefonoClienteAsync(int idTelefono)
        {
            await _administracionTelefonoCliente.EliminarAsync(idTelefono);
            return Ok();
        }
    }
}
