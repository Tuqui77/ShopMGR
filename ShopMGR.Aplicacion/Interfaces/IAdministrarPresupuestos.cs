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
    public interface IAdministrarPresupuestos : IAdministrarEntidades<Presupuesto, PresupuestoDTO, ModificarPresupuesto>
    {
        public Task<List<Presupuesto>> ObtenerPorClienteAsync(int idCliente);
        public Task<List<Presupuesto>> ObtenerPorEstadoAsync(EstadoPresupuesto estado);
    }
}
