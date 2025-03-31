using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class DireccionRepositorio
    {
        private readonly ShopMGRDbContexto _contexto;

        public DireccionRepositorio(ShopMGRDbContexto contexto)
        {
            _contexto = contexto;
        }

        public async Task<List<Direccion>> BuscarPorCliente(int idCliente)
        {
            if (_contexto.Direccion.Any(x => x.IdCliente == idCliente))
                return await _contexto.Direccion.Where(x => x.IdCliente == idCliente).ToListAsync();
            else
                throw new ArgumentException("No hay ninguna dirección asociada a ese Id");
        }

        public async Task<Direccion?> ObtenerPorCalleYAlturaAsync(string calle, string altura)
        {
            return await _contexto.Direccion.FirstOrDefaultAsync(x => x.Calle == calle && x.Altura == altura);
        }

        public async Task CrearDireccionAsync(Direccion direccion)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.Id == direccion.IdCliente))
                throw new ArgumentException("No existe un cliente con ese Id");
            if (await _contexto.Direccion.AnyAsync(x => x.Calle == direccion.Calle && x.Altura == direccion.Altura))
                throw new ArgumentException("Ya existe una dirección con esa calle y altura");

            _contexto.Direccion.Add(direccion);
            await _contexto.SaveChangesAsync();
        }
    }
}
