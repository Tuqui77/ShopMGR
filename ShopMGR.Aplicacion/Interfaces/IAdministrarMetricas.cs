
namespace ShopMGR.Aplicacion.Interfaces
{
    public interface IAdministracionMetricas
    {
        public Task<decimal> ObtenerIngresosAsync(DateOnly fecha);
        public Task<float> ObtenerHorasAsync(DateOnly fecha);
        public Task<int> ObtenerTrabajosTerminadosAsync(DateOnly fecha);
        public Task<int> ObtenerPresupuestosCreadosAsync(DateOnly fecha);
        public Task<int> ObtenerPresupuestosAceptadosAsync(DateOnly fecha);
    }
}
