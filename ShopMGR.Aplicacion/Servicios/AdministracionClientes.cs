using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionClientes : IAdministrarClientes
    {
        private readonly ClienteRepositorio _clienteRepositorio;
        private readonly DireccionRepositorio _direccionRepositorio;
        private readonly TelefonoClienteRepositorio _telefonoClienteRepositorio;

        public AdministracionClientes(ClienteRepositorio clienteRepositorio, DireccionRepositorio direccionRepositorio, TelefonoClienteRepositorio telefonoRepositorio)
        {
            _clienteRepositorio = clienteRepositorio;
            _direccionRepositorio = direccionRepositorio;
            _telefonoClienteRepositorio = telefonoRepositorio;
        }

        public async Task CrearAsync(ClienteDTO nuevoCliente)
        {
            var cliente = new Cliente
            {
                NombreCompleto = nuevoCliente.NombreCompleto,
                Cuit = nuevoCliente.Cuit,
                Balance = nuevoCliente.Balance,
            };

            var clienteBD = await _clienteRepositorio.CrearAsync(cliente);

            if (nuevoCliente.Direccion != null)
            {
                foreach (var direccion in nuevoCliente.Direccion)
                {
                    var dirTmp = new Direccion
                    {
                        IdCliente = clienteBD.Id,
                        Calle = direccion.Calle,
                        Altura = direccion.Altura,
                        Piso = direccion.Piso,
                        Departamento = direccion.Departamento,
                        CodigoPostal = direccion.CodigoPostal
                    };

                    await _direccionRepositorio.CrearAsync(dirTmp);
                }
            }

            if (cliente.Telefono != null)
            {
                foreach (var telefono in nuevoCliente.Telefono!)
                {
                    var telefonoTmp = new TelefonoCliente
                    {
                        IdCliente = clienteBD.Id,
                        Telefono = telefono.Telefono,
                        Descripcion = telefono.Descripcion
                    };

                    await _telefonoClienteRepositorio.CrearAsync(telefonoTmp);
                }
            }
        }
        public async Task<Cliente> ObtenerPorIdAsync(int idCliente)
        {
            var cliente = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);
            cliente.Direccion = await _direccionRepositorio.ObtenerPorIdCliente(idCliente);
            cliente.Telefono = await _telefonoClienteRepositorio.ObtenerPorIdCliente(idCliente);

            return cliente;
        }
        public async Task<Cliente> ObtenerClientePorNombre(string nombre)
        {
            var cliente = await _clienteRepositorio.ObtenerPorNombreAsync(nombre);
            return cliente;
        }
        public async Task<List<Cliente>> ListarTodosAsync()
        {
            var clientes = await _clienteRepositorio.ListarTodosAsync();
            return clientes;
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
            var cliente = await _clienteRepositorio.ObtenerPorIdAsync(idCliente)
                ?? throw new KeyNotFoundException("No existe un cliente con ese Id");

            await _clienteRepositorio.EliminarAsync(cliente);
        }
    }
}
