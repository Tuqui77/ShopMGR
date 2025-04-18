using ShopMGR.Aplicacion.Data_Transfer_Objects;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministrarPresupuestos : IAdministrarEntidades<Presupuesto, PresupuestoDTO, ModificarPresupuesto>
    {
        public Task<List<Presupuesto>> ObtenerPorClienteAsync(int idCliente);
        public Task<List<Presupuesto>> ObtenerPorEstadoAsync(EstadoPresupuesto estado);
        public Task ActualizarCostoHoraDeTrabajo(string nuevoCosto);
        public Task<decimal> ObtenerCostoHoraDeTrabajo();
    }
}
