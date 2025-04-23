using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class TelefonoClienteRepositorio(ShopMGRDbContexto contexto) : IRepositorioConCliente<TelefonoCliente>
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<TelefonoCliente> CrearAsync(TelefonoCliente telefono)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.Id == telefono.IdCliente))
                throw new KeyNotFoundException("No existe el cliente asociado a ese Id");
            if (await _contexto.TelefonoCliente.AnyAsync(x => x.Telefono == telefono.Telefono))
                throw new InvalidOperationException($"Ya existe un teléfono con el número {telefono.Telefono}");

            _contexto.TelefonoCliente.Add(telefono);
            await _contexto.SaveChangesAsync();

            return telefono;
        }

        public async Task<TelefonoCliente> ObtenerPorIdAsync(int idTelefono)
        {
            var telefono = await _contexto.TelefonoCliente.FindAsync(idTelefono)
                ?? throw new KeyNotFoundException($"No existe un teléfono con el Id {idTelefono}");

            return telefono;
        }

        public async Task<TelefonoCliente> ObtenerDetallePorIdAsync(int id)
        {
            var telefono = await _contexto.TelefonoCliente
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException($"No existe un teléfono con el Id {id}");

            return telefono;
        }

        public async Task<List<TelefonoCliente>> ObtenerPorIdCliente(int idCliente)
        {
            var telefono = await _contexto.TelefonoCliente
                .Where(t => t.IdCliente == idCliente)
                .ToListAsync();

            return telefono;
        }

        public async Task<TelefonoCliente?> ObtenerPorNumeroAsync(string numero) //Dudo de la utilidad de esta búsqueda.
        {
            return await _contexto.TelefonoCliente.FirstOrDefaultAsync(x => x.Telefono == numero);
        }

        public async Task ActualizarAsync(TelefonoCliente telefono)
        {
            _contexto.TelefonoCliente.Update(telefono);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(int idTelefono)
        {
            var telefono = await ObtenerPorIdAsync(idTelefono);

            _contexto.TelefonoCliente.Remove(telefono);
            await _contexto.SaveChangesAsync();
        }
    }
}
