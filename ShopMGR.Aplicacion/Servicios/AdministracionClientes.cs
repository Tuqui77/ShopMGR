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
        IMovimientoBalanceRepositorio movimientoBalanceRepositorio,
        MapperRegistry mapper
    ) : IAdministrarClientes
    {
        private readonly IRepositorioCliente<Cliente> _clienteRepositorio = clienteRepositorio;
        private readonly IRepositorioConCliente<Direccion> _direccionRepositorio = direccionRepositorio;
        private readonly IRepositorioConCliente<TelefonoCliente> _telefonoClienteRepositorio = telefonoRepositorio;
        private readonly IMovimientoBalanceRepositorio _movimientoBalanceRepositorio = movimientoBalanceRepositorio;
        private readonly MapperRegistry _mapper = mapper;

        public async Task<Cliente> CrearAsync(ClienteDTO nuevoCliente)
        {
            var cliente = _mapper.Map<ClienteDTO, Cliente>(nuevoCliente);

            foreach (var direccion in cliente.Direccion)
            {
                await _direccionRepositorio.Validar(direccion);
            }

            foreach (var telefono in cliente.Telefono)
            {
                await _telefonoClienteRepositorio.Validar(telefono);
            }

            return await _clienteRepositorio.CrearAsync(cliente);
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

        public async Task<List<Cliente>> BuscarSaldosNegativosAsync()
        {
            return await _clienteRepositorio.BuscarSaldosNegativosAsync();
        }

        public async Task ActualizarAsync(int idCliente, ModificarCliente clienteActualizado)
        {
            var clienteBd = await _clienteRepositorio.ObtenerPorIdAsync(idCliente);

            clienteBd.NombreCompleto = clienteActualizado.NombreCompleto ?? clienteBd.NombreCompleto;
            clienteBd.Cuit = clienteActualizado.Cuit ?? clienteBd.Cuit;

            await _clienteRepositorio.ActualizarAsync(clienteBd);
        }

        public async Task RegistrarMovimientoAsync(MovimientoBalanceDTO movimientoDTO)
        {
            var cliente = await _clienteRepositorio.ObtenerPorIdAsync(movimientoDTO.IdCliente);

            var movimiento = new MovimientoBalance
            {
                Monto = movimientoDTO.Monto,
                Descripcion = movimientoDTO.Descripcion,
                Fecha = movimientoDTO.Fecha,
                Tipo = movimientoDTO.Tipo,
            };

            cliente.MovimientosBalance.Add(movimiento);
            await _clienteRepositorio.ActualizarAsync(cliente);
        }

        public async Task<List<MovimientoBalance>> ObtenerMovimientosPorIdAsync(int idCliente)
        {
            var movimientos = await _clienteRepositorio.ObtenerMovimientosPorIdAsync(idCliente);

            return movimientos;
        }

        public async Task ModificarMovimientoAsync(ModificarMovimientoBalance movimientoModificado)
        {
            var cliente = await ObtenerDetallePorIdAsync(movimientoModificado.IdCliente);
            var movimiento = cliente.MovimientosBalance.FirstOrDefault(m => m.Id == movimientoModificado.Id)
                ?? throw new KeyNotFoundException($"No se encontro un movimiento con el ID {movimientoModificado.Id}");

            movimiento.Monto = movimientoModificado.Monto;
            movimiento.Descripcion = movimientoModificado.Descripcion;
            movimiento.Fecha = movimientoModificado.Fecha;
            movimiento.Tipo = movimientoModificado.Tipo;
            movimiento.IdCliente = movimientoModificado.IdCliente;
            movimiento.IdTrabajo = movimientoModificado.IdTrabajo;

            await _clienteRepositorio.ActualizarAsync(cliente);
        }

        public async Task EliminarMovimientoAsync(int idMovimiento, int idCliente)
        {
            var cliente = await ObtenerDetallePorIdAsync(idCliente);
            var movimiento = cliente.MovimientosBalance.Find(m => m.Id == idMovimiento)
                ?? throw new KeyNotFoundException($"No se encontro un movimiento con el ID {idMovimiento}");

            cliente.MovimientosBalance.Remove(movimiento);
            await _clienteRepositorio.ActualizarAsync(cliente);
        }

        public async Task EliminarAsync(int idCliente)
        {
            await _clienteRepositorio.EliminarAsync(idCliente);
        }
    }
}
