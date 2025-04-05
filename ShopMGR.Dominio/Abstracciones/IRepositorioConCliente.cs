using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConCliente<TEntity> : IRepositorio<TEntity>
        where TEntity : class
    {
        public Task<List<TEntity>> ObtenerPorIdCliente(int idCliente);

    }
}
