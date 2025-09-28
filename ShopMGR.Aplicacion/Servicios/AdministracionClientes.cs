using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Aplicacion.Mappers;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionClientes(
        IRepositorioCliente<Cliente> clienteRepositorio,
        IRepositorioConCliente<Direccion> direccionRepositorio,
        IRepositorioConCliente<TelefonoCliente> telefonoRepositorio,
        MapperRegistry mapper) : IAdministrarClientes

    {
        private readonly IRepositorioCliente<Cliente> _clienteRepositorio = clienteRepositorio;
        private readonly IRepositorioConCliente<Direccion> _direccionRepositorio = direccionRepositorio;
        private readonly IRepositorioConCliente<TelefonoCliente> _telefonoClienteRepositorio = telefonoRepositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Cliente> CrearAsync(ClienteDTO nuevoCliente)
        {
            var cliente = _mapper.Map<ClienteDTO, Cliente>(nuevoCliente);
            
            var clienteBd = await _clienteRepositorio.CrearAsync(cliente);

            if (nuevoCliente.Direccion != null)
            {
                foreach (var direccion in nuevoCliente.Direccion)
                {
                    var dirTmp = _mapper.Map<DireccionDTO, Direccion>(direccion);
                    dirTmp.IdCliente = clienteBd.Id;

                    await _direccionRepositorio.CrearAsync(dirTmp);
                }
            }

            if (nuevoCliente.Telefono != null)
            {
                foreach (var telefono in nuevoCliente.Telefono)
                {
                    var telefonoTmp = _mapper.Map<TelefonoClienteDTO, TelefonoCliente>(telefono);
                    telefonoTmp.IdCliente = clienteBd.Id;

                    await _telefonoClienteRepositorio.CrearAsync(telefonoTmp);
                }
            }

            return clienteBd;
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
            var clienteBd = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);

            clienteBd.NombreCompleto = clienteActualizado.NombreCompleto ?? clienteBd.NombreCompleto;
            clienteBd.Cuit = clienteActualizado.Cuit ?? clienteBd.Cuit;

            await _clienteRepositorio.ActualizarAsync(clienteBd);
        }
        public async Task EliminarAsync(int idCliente)
        {
            await _clienteRepositorio.EliminarAsync(idCliente);
        }
    }
}
