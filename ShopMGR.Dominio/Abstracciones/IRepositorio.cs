using ShopMGR.Dominio.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorio<TEntidad>
    {
        public Task<TEntidad> CrearAsync(TEntidad entidad);
        public Task<TEntidad> ObtenerPorIdAsync(int id);
        public Task ActualizarAsync(TEntidad entidad);
        public Task EliminarAsync(TEntidad entidad);
    }
}
