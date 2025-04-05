using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Repositorios
{
    public class TrabajoRepositorio(ShopMGRDbContexto contexto) : IRepositorioConEstado<Trabajo>
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public Task ActualizarAsync(Trabajo entidad)
        {
            throw new NotImplementedException();
        }

        public Task<Trabajo> CrearAsync(Trabajo entidad)
        {
            throw new NotImplementedException();
        }

        public Task EliminarAsync(Trabajo entidad)
        {
            throw new NotImplementedException();
        }

        public Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado)
        {
            throw new NotImplementedException();
        }

        public Task<Trabajo> ObtenerPorIdAsync(int id)
        {
            throw new NotImplementedException();
        }
    }
}
