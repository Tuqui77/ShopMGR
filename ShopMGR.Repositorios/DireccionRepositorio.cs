using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class DireccionRepositorio(ShopMGRDbContexto contexto) : IRepositorioConCliente<Direccion>
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<Direccion> CrearAsync(Direccion direccion)
        {
            if (!await _contexto.Clientes.AnyAsync(x => x.Id == direccion.IdCliente))
                throw new KeyNotFoundException($"No existe un cliente con el ID {direccion.IdCliente}");

            //Esta validación la dejo por si acaso, pero puede haber dos clientes con la misma dirección. Se puede cambiar por una alerta en la UI.
            if (await _contexto.Direccion.AnyAsync(x => x.Calle == direccion.Calle && x.Altura == direccion.Altura) &&
                direccion.Piso == null)
                throw new InvalidOperationException("Ya existe una dirección con esa calle y altura");

            _contexto.Direccion.Add(direccion);
            await _contexto.SaveChangesAsync();

            return direccion;
        }

        public async Task<Direccion> ObtenerPorIdAsync(int idDireccion)
        {
            var direccion = await _contexto.Direccion.FindAsync(idDireccion)
                ?? throw new KeyNotFoundException($"No existe una dirección con el Id {idDireccion}");

            return direccion;
        }

        public async Task<Direccion> ObtenerDetallePorIdAsync(int id)
        {
            var direccion = await _contexto.Direccion
                .Include(d => d.Cliente)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new KeyNotFoundException($"No existe una dirección con el Id {id}");

            return direccion;
        }

        public async Task<List<Direccion>> ObtenerPorIdCliente(int idCliente)
        {
            var direccion = await _contexto.Direccion
                .Include(d => d.Cliente) //Probablemente sea demasiado el cliente completo, tal vez solo el nombre sea suficiente.
                .Where(x => x.IdCliente == idCliente)
                .ToListAsync();

            return direccion;
        }

        public async Task<Direccion> ObtenerPorCalleYAlturaAsync(string calle, string altura)
        {
            var direccion = await _contexto.Direccion.FirstOrDefaultAsync(x => x.Calle == calle && x.Altura == altura)
                ?? throw new KeyNotFoundException($"No existe esa direccion en la base de datos");

            return direccion;
        }

        public async Task ActualizarAsync(Direccion direccion)
        {
            _contexto.Direccion.Update(direccion);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(int idDireccion)
        {
            var direccion = await ObtenerPorIdAsync(idDireccion);

            _contexto.Direccion.Remove(direccion);
            await _contexto.SaveChangesAsync();
        }
    }
}
