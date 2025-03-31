using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Modelo;
using ShopMGR.Repositorios;
using System.Net.Http.Headers;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionClientes
    {
        #region viejo

        //public static Cliente CrearCliente(string nombreCompleto, string telefono, string descripcion, Direccion direccion)
        //{
        //    Cliente cliente = new Cliente();
        //    cliente.NombreCompleto = nombreCompleto;
        //    cliente.Direccion = direccion;
        //    ValidarYAgregarTelefono(cliente, telefono, descripcion);

        //    return cliente;
        //}

        //private static void ValidarYAgregarTelefono(Cliente cliente, string telefono, string descripcion)
        //{
        //    if (telefono.Length == 10)
        //    {
        //        cliente.Telefono.Add(telefono, descripcion);
        //    }
        //    else
        //    {
        //        throw new ArgumentException("El telefono tiene que tener 10 caracteres");
        //    }
        //}
        //public void ModificarNombre(Cliente cliente, string nuevoNombre)
        //{
        //    cliente.NombreCompleto = nuevoNombre;
        //}
        //public void AgregarTelefono(Cliente cliente, string nuevoTelefono, string descripcion)
        //{
        //    ValidarYAgregarTelefono(cliente, nuevoTelefono, descripcion);
        //}
        //private void ModificarTelefono(Cliente cliente, string telefono, string nuevoTelefono)
        //{
        //    string descripcionOriginal = cliente.Telefono[telefono];
        //    cliente.Telefono.Remove(telefono);
        //    ValidarYAgregarTelefono(cliente, nuevoTelefono, descripcionOriginal);
        //}
        //public void ModificarDirección(Cliente cliente, Direccion nuevaDireccion)
        //{
        //    cliente.Direccion = nuevaDireccion;
        //}

        ////Métodos para el manejo de dinero
        //public decimal ReciboDeDinero(Cliente cliente, decimal cantidad)
        //{
        //    cliente.Balance += cantidad;
        //    return cliente.Balance;
        //}
        //public decimal GastoDeDinero(Cliente cliente, decimal cantidad, string descripcion)
        //{
        //    cliente.Balance -= cantidad;
        //    cliente.gastos.Add(descripcion);
        //    return cliente.Balance;
        //}
        #endregion
        // --------------------------------------------------------------------------------------------------------------------------------------------------------------
        private readonly ClienteRepositorio _clienteRepositorio;
        private readonly DireccionRepositorio _direccionRepositorio;
        private readonly TelefonoClienteRepositorio _telefonoClienteRepositorio;

        public AdministracionClientes(ClienteRepositorio clienteRepositorio, DireccionRepositorio direccionRepositorio, TelefonoClienteRepositorio telefonoRepositorio)
        {
            _clienteRepositorio = clienteRepositorio;
            _direccionRepositorio = direccionRepositorio;
            _telefonoClienteRepositorio = telefonoRepositorio;
        }

        public async Task CrearClienteAsync(ClienteDTO nuevoCliente)
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
                List<Direccion> listaDirecciones = [];

                foreach (var direccion in nuevoCliente.Direccion) //Hacer todo esto en un solo loop y eliminar la lista temporal
                {
                    listaDirecciones.Add(new Direccion
                    {
                        IdCliente = clienteBD.Id,
                        Calle = direccion.Calle,
                        Altura = direccion.Altura,
                        Piso = direccion.Piso,
                        Departamento = direccion.Departamento,
                        CodigoPostal = direccion.CodigoPostal
                    });
                }

                foreach (var direccion in listaDirecciones)
                {
                    direccion.IdCliente = clienteBD.Id;
                    await _direccionRepositorio.CrearDireccionAsync(direccion);
                }
            }

            if (cliente.Telefono != null)
            {
                List<TelefonoCliente> listaTelefonos = [];

                foreach (var telefono in nuevoCliente.Telefono!)
                {
                    listaTelefonos.Add(new TelefonoCliente
                    {
                        IdCliente = clienteBD.Id,
                        Telefono = telefono.Telefono,
                        Descripcion = telefono.Descripcion
                    });
                }

                foreach (var telefono in listaTelefonos)
                {
                    telefono.IdCliente = clienteBD.Id;
                    await _telefonoClienteRepositorio.CrearTelefonoAsync(telefono);
                }
            }
        }


        public async Task EliminarClienteAsync(Cliente cliente)
        {
            await _clienteRepositorio.EliminarAsync(cliente);
        }

        public async Task<Cliente> ObtenerClientePorIdAsync(int idCliente)
        {
            var cliente = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);
            return cliente;
        }

        public async Task<Cliente> ObtenerClientePorNombre(string nombre)
        {
            var cliente = await _clienteRepositorio.ObtenerPorNombreAsync(nombre);
            return cliente;
        }

        public async Task<List<Cliente>> ListarClientes()
        {
            var clientes = await _clienteRepositorio.ListarTodosAsync();
            return clientes;
        }

        public async Task ActualizarClienteAsync(int idCliente, ModificarCliente clienteActualizado)
        {
            var clienteDB = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);
            if (clienteDB == null)
            {
                throw new ArgumentException("No existe un cliente con ese Id");
            }

            clienteDB.NombreCompleto = clienteActualizado.NombreCompleto ?? clienteDB.NombreCompleto;
            clienteDB.Cuit = clienteActualizado.Cuit ?? clienteDB.Cuit;
            
            await _clienteRepositorio.ActualizarAsync(clienteDB);
        }
    }
}
