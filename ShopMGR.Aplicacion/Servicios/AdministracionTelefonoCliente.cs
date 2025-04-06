using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionTelefonoCliente(IRepositorioConCliente<TelefonoCliente> telefonoClienteRepositorio, IMapper mapper) : IAdministrarTelefonoCliente
    {
        private readonly IRepositorioConCliente<TelefonoCliente> _telefonoClienteRepositorio = telefonoClienteRepositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<TelefonoCliente> CrearAsync(TelefonoClienteDTO nuevoTelefono)
        {
            var telefono = _mapper.Map<TelefonoCliente>(nuevoTelefono);

            await _telefonoClienteRepositorio.CrearAsync(telefono);
            return telefono;
        }

        public async Task<TelefonoCliente> ObtenerPorIdAsync(int idTelefono)
        {
            var telefono = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono)
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");
            return telefono;
        }

        public async Task<List<TelefonoCliente>> ObtenerTelefonosCliente(int idCliente)
        {
            return await _telefonoClienteRepositorio.ObtenerPorIdCliente(idCliente);
        }
        public async Task ActualizarAsync(int idTelefono, ModificarTelefono telefonoModificado)
        {
            var telefonoDB = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono)
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");

            telefonoDB.IdCliente = telefonoModificado.IdCliente ?? telefonoDB.IdCliente;
            telefonoDB.Telefono = telefonoModificado.Telefono ?? telefonoDB.Telefono;
            telefonoDB.Descripcion = telefonoModificado.Descripcion ?? telefonoDB.Descripcion;

            await _telefonoClienteRepositorio.ActualizarAsync(telefonoDB);
        }
        public async Task EliminarAsync(int idTelefono)
        {
            var telefono = await _telefonoClienteRepositorio.ObtenerPorIdAsync(idTelefono)
                ?? throw new KeyNotFoundException("No existe un teléfono con ese Id");

            await _telefonoClienteRepositorio.EliminarAsync(telefono);
        }
    }
}
