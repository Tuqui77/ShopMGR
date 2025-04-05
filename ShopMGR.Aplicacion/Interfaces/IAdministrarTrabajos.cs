using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarTrabajos : IAdministrarEntidades<Trabajo, TrabajoDTO, ModificarTrabajo>
    {
        Task<List<Trabajo>> ObtenerPorClienteAsync(int idCliente);
        Task<List<Trabajo>> ObtenerPorEstadoAsync(EstadoTrabajo estado);
    }
}
