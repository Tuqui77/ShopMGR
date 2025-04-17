using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class ClienteRepositorio(ShopMGRDbContexto contexto) : IRepositorioCliente<Cliente>
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<Cliente> CrearAsync(Cliente cliente)
        {
            if (await _contexto.Clientes.AnyAsync(x => x.NombreCompleto == cliente.NombreCompleto)) throw new InvalidOperationException("Ya existe un cliente con ese nombre");

            _contexto.Clientes.Add(cliente);
            await _contexto.SaveChangesAsync();

            return cliente;
        }
        public async Task<Cliente> ObtenerPorIdAsync(int id)
        {
            var cliente = await _contexto.Clientes.FindAsync(id)
                ?? throw new KeyNotFoundException("No existe un cliente con ese Id");

            return cliente;
        }

        public async Task<Cliente> ObtenerDetallePorIdAsync(int id)
        {
            var cliente = await _contexto.Clientes
                .Include(c => c.Telefono)
                .Include(c => c.Direccion)
                .Include(c => c.Trabajos)
                .Include(c => c.Presupuestos)
                .FirstOrDefaultAsync(x => x.Id == id)
                    ?? throw new KeyNotFoundException("No existe un cliente con ese Id");

            return cliente;
        }

        public async Task<Cliente?> ObtenerPorNombreAsync(string nombre)
        {
            var cliente = await _contexto.Clientes.FirstOrDefaultAsync(x => x.NombreCompleto == nombre)
                ?? throw new KeyNotFoundException("No existe un cliente con ese nombre");

            return cliente;
        }

        public async Task<List<Cliente>> ListarTodosAsync()
        {
            return await _contexto.Clientes.ToListAsync();
        }


        public async Task ActualizarAsync(Cliente cliente)
        {
            _contexto.Clientes.Update(cliente);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(int idCliente)
        {
            var cliente = await ObtenerPorIdAsync(idCliente)
                ?? throw new KeyNotFoundException($"No existe un cliente con el Id {idCliente}");

            _contexto.Clientes.Remove(cliente);
            await _contexto.SaveChangesAsync();
        }

    }
}
