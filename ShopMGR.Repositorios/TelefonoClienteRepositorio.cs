using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class TelefonoClienteRepositorio
    {
        private readonly ShopMGRDbContexto _contexto;

        public TelefonoClienteRepositorio(ShopMGRDbContexto contexto)
        {
            _contexto = contexto;
        }

        public async Task<List<TelefonoCliente>> BuscarPorIdCliente(int idCliente)
        {
            var telefono = await _contexto.TelefonoCliente.Where(t => t.IdCliente == idCliente).ToListAsync();

            return telefono;
        }

        public async Task<TelefonoCliente?> ObtenerPorNumeroAsync(string numero) //Dudo de la utilidad de esta búsqueda.
        {
            return await _contexto.TelefonoCliente.FirstOrDefaultAsync(x => x.Telefono == numero);
        }

        public async Task CrearTelefonoAsync(TelefonoCliente telefono)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.Id == telefono.IdCliente))
                throw new KeyNotFoundException("No existe el cliente asociado a ese Id");

            _contexto.TelefonoCliente.Add(telefono);
            await _contexto.SaveChangesAsync();
        }
    }
}
