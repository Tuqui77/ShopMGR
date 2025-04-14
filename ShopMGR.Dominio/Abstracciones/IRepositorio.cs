using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorio<TEntidad>
    {
        public Task<TEntidad> CrearAsync(TEntidad entidad);
        public Task<TEntidad> ObtenerPorIdAsync(int id);
        public Task ActualizarAsync(TEntidad entidad);
        public Task EliminarAsync(int id);
        public Task<TEntidad> ObtenerDetallePorIdAsync(int id);
    }
}
