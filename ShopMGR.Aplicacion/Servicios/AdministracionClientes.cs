using AutoMapper;
using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionClientes(
        IRepositorioCliente<Cliente> clienteRepositorio,
        IRepositorioConCliente<Direccion> direccionRepositorio,
        IRepositorioConCliente<TelefonoCliente> telefonoRepositorio,
        IMapper mapper) : IAdministrarClientes

    {
        private readonly IRepositorioCliente<Cliente> _clienteRepositorio = clienteRepositorio;
        private readonly IRepositorioConCliente<Direccion> _direccionRepositorio = direccionRepositorio;
        private readonly IRepositorioConCliente<TelefonoCliente> _telefonoClienteRepositorio = telefonoRepositorio;
        private readonly IMapper _mapper = mapper;

        public async Task<Cliente> CrearAsync(ClienteDTO nuevoCliente)
        {
            var cliente = _mapper.Map<Cliente>(nuevoCliente);

            var clienteBD = await _clienteRepositorio.CrearAsync(cliente);

            if (nuevoCliente.Direccion != null)
            {
                foreach (var direccion in nuevoCliente.Direccion)
                {
                    var dirTmp = _mapper.Map<Direccion>(direccion);
                    dirTmp.IdCliente = clienteBD.Id;

                    await _direccionRepositorio.CrearAsync(dirTmp);
                }
            }

            if (nuevoCliente.Telefono != null)
            {
                foreach (var telefono in nuevoCliente.Telefono)
                {
                    var telefonoTmp = _mapper.Map<TelefonoCliente>(telefono);
                    telefonoTmp.IdCliente = clienteBD.Id;

                    await _telefonoClienteRepositorio.CrearAsync(telefonoTmp);
                }
            }

            return clienteBD;
        }

        public async Task<List<Cliente>> ListarTodosAsync()
        {
            return await _clienteRepositorio.ListarTodosAsync();
        }

        public async Task<Cliente> ObtenerPorIdAsync(int idCliente)
        {
            return await _clienteRepositorio.ObtenerPorIdAsync(idCliente);
        }

        public async Task<Cliente> ObtenerDetallePorIdAsync(int idCliente)
        {
            return await _clienteRepositorio.ObtenerDetallePorIdAsync(idCliente);
        }

        public async Task<Cliente> ObtenerClientePorNombreAsync(string nombre)
        {
            return await _clienteRepositorio.ObtenerPorNombreAsync(nombre);
        }
        public async Task ActualizarAsync(int idCliente, ModificarCliente clienteActualizado)
        {
            var clienteDB = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);

            clienteDB.NombreCompleto = clienteActualizado.NombreCompleto ?? clienteDB.NombreCompleto;
            clienteDB.Cuit = clienteActualizado.Cuit ?? clienteDB.Cuit;

            await _clienteRepositorio.ActualizarAsync(clienteDB);
        }
        public async Task EliminarAsync(int idCliente)
        {
            await _clienteRepositorio.EliminarAsync(idCliente);
        }
    }
}
