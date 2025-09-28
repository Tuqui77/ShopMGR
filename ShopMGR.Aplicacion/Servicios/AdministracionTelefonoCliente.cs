using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionTelefonoCliente(
        IRepositorioConCliente<TelefonoCliente> telefonoClienteRepositorio, 
        MapperRegistry mapper) : IAdministrarTelefonoCliente
    {
        private readonly IRepositorioConCliente<TelefonoCliente> _telefonoClienteRepositorio = telefonoClienteRepositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<TelefonoCliente> CrearAsync(TelefonoClienteDTO nuevoTelefono)
        {
            var telefono = _mapper.Map<TelefonoClienteDTO, TelefonoCliente>(nuevoTelefono);

            await _telefonoClienteRepositorio.CrearAsync(telefono);
            return telefono;
        }

        public async Task<TelefonoCliente> ObtenerPorIdAsync(int idTelefono)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono);
        }

        public async Task<TelefonoCliente> ObtenerDetallePorIdAsync(int idTelefono)
        {
            return await _telefonoClienteRepositorio.ObtenerDetallePorIdAsync(idTelefono);
        }

        public async Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int idCliente)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdCliente(idCliente);
        }
        public async Task ActualizarAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            var telefonoBd = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono);

            telefonoBd.IdCliente = telefonoModificado.IdCliente ?? telefonoBd.IdCliente;
            telefonoBd.Telefono = telefonoModificado.Telefono ?? telefonoBd.Telefono;
            telefonoBd.Descripcion = telefonoModificado.Descripcion ?? telefonoBd.Descripcion;

            await _telefonoClienteRepositorio.ActualizarAsync(telefonoBd);
        }
        public async Task EliminarAsync(int idTelefono)
        {
            await _telefonoClienteRepositorio.EliminarAsync(idTelefono);
        }
    }
}
