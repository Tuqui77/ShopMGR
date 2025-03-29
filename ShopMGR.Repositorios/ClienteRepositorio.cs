using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class ClienteRepositorio
    {
        private readonly ShopMGRDbContexto _contexto;

        public ClienteRepositorio(ShopMGRDbContexto contexto)
        {
            _contexto = contexto;
        }

        public async Task<List<Cliente>> ListarTodosAsync()
        {
            return await _contexto.Clientes.ToListAsync();
        }

        public async Task<Cliente> ObtenerPorIdAsync(int id)
        {
            if (!_contexto.Clientes.Any(x => x.Id == id)) 
                throw new ArgumentException("No hay ningún cliente asociado a ese Id");
                
            
            return await _contexto.Clientes.FindAsync(id);
            
        }
        public async Task<Cliente?> ObtenerPorNombreAsync(string nombre)
        {
            return await _contexto.Clientes.FirstOrDefaultAsync(x => x.NombreCompleto == nombre);

        }
        public async Task<Cliente> CrearAsync(Cliente cliente)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.NombreCompleto == cliente.NombreCompleto))
                throw new ArgumentException("Ya existe un cliente con ese nombre");

            _contexto.Clientes.Add(cliente);
            await _contexto.SaveChangesAsync();

            return cliente;
        }

        public async Task ActualizarAsync(Cliente cliente)
        {
            _contexto.Clientes.Update(cliente);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(Cliente cliente)
        {
            _contexto.Clientes.Remove(cliente);
            await _contexto.SaveChangesAsync();
        }
    }
}
