using ShopMGR.Dominio.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConEstado<TEntidad> : IRepositorio<TEntidad>
    {
        public Task<List<TEntidad>> ObtenerPorEstadoAsync();
    }
}
