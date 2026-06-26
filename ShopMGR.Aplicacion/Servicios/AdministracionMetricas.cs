using ShopMGR.Aplicacion.Interfaces;
using ShopMGR.Dominio.Abstracciones;

namespace ShopMGR.Aplicacion.Servicios
{
    public class AdministracionMetricas(IRepositorioMetricas repositorio) : IAdministracionMetricas
    {
        private readonly IRepositorioMetricas _repositorio = repositorio;

        public async Task<decimal> ObtenerIngresosAsync(DateOnly fecha)
        {
            var ingresosMes = await _repositorio.ObtenerIngresosAsync(fecha);

            return ingresosMes;
        }

        public async Task<float> ObtenerHorasAsync(DateOnly fecha)
        {
            var horasTrabajadasMes = await _repositorio.ObtenerHorasAsync(fecha);

            return horasTrabajadasMes;
        }

        public async Task<int> ObtenerTrabajosTerminadosAsync(DateOnly fecha)
        {
            var trabajosTerminadosMes = await _repositorio.ObtenerTrabajosTerminadosAsync(fecha);

            return trabajosTerminadosMes;
        }

        public async Task<int> ObtenerPresupuestosCreadosAsync(DateOnly fecha)
        {
            var presupuestosCreadosMes = await _repositorio.ObtenerPresupuestosCreadosAsync(fecha);

            return presupuestosCreadosMes;
        }

        public async Task<int> ObtenerPresupuestosAceptadosAsync(DateOnly fecha)
        {
            var presupuestosAceptadosMes = await _repositorio.ObtenerPresupuestosAceptadosAsync(fecha);

            return presupuestosAceptadosMes;
        }
    }
}
