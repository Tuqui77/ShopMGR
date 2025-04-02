using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarEntidades<TEntidad, TDTO, TActualizacion>// : IAdministrarClientes
    {
        public Task<TEntidad> CrearAsync(TDTO entidad);
        public Task<TEntidad> ObtenerPorIdAsync(int id);
        public Task ActualizarAsync(int id, TActualizacion entidad);
        public Task EliminarAsync(int id);
    }
}
