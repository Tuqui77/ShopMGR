using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class TrabajoRepositorio(ShopMGRDbContexto contexto) : IRepositorioConFoto
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<Trabajo> CrearAsync(Trabajo nuevoTrabajo)
        {
            _contexto.Trabajos.Add(nuevoTrabajo);
            await _contexto.SaveChangesAsync();

            return nuevoTrabajo;
        }

        public async Task<List<Foto>> AgregarFotosAsync(int idTrabajo, List<Foto> fotos)
        {
            var trabajo = await ObtenerPorIdAsync(idTrabajo) ??
                throw new KeyNotFoundException($"No existe un trabajo con el Id {idTrabajo}");

            _contexto.Fotos.AddRange(fotos);
            await _contexto.SaveChangesAsync();
            return fotos;
        }


        public async Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            var trabajoDB = await _contexto.Trabajos.FindAsync(id)
                ?? throw new KeyNotFoundException($"No existe un trabajo con el Id {id}");

            return trabajoDB;
        }

        public async Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente)
        {
            var trabajos = await _contexto.Trabajos.Where(t => t.IdCliente == idCliente).ToListAsync()
                ?? throw new KeyNotFoundException($"No se encuentran trabajos para el cliente con Id {idCliente}");

            return trabajos;
        }

        public async Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado)
        {
            var trabajos = await _contexto.Trabajos.Where(t => t.Estado == estado).ToListAsync()
                ?? throw new KeyNotFoundException($"No se encuentran trabajos con el estado {estado}");

            return trabajos;
        }

        public async Task ActualizarAsync(Trabajo entidad)
        {
            _contexto.Trabajos.Update(entidad);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(int idTrabajo)
        {
            var trabajo = await ObtenerPorIdAsync(idTrabajo);

            _contexto.Trabajos.Remove(trabajo);
            await _contexto.SaveChangesAsync();
        }
    }
}
