using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;

namespace ShopMGR.Repositorios
{
    public class MetricasRepositorio(ShopMGRDbContexto contexto) : IRepositorioMetricas
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<decimal> ObtenerIngresosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var ingresosMes = await _contexto
                .Trabajos.Where(t =>
                    t.FechaFin.HasValue && t.FechaFin.Value.Month == mes && t.FechaFin.Value.Year == anio
                )
                .SumAsync(t => t.TotalLabor ?? 0m);

            return ingresosMes;
        }

        public async Task<float> ObtenerHorasAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var horasTrabajadasMes = await _contexto
                .HorasYDescripcion.Where(h => h.Fecha.Month == mes && h.Fecha.Year == anio)
                .SumAsync(h => h.Horas);

            return horasTrabajadasMes;
        }

        public async Task<int> ObtenerTrabajosTerminadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var trabajosTerminadosMes = await _contexto
                .Trabajos.Where(t =>
                    t.FechaFin.HasValue && t.FechaFin.Value.Month == mes && t.FechaFin.Value.Year == anio
                )
                .CountAsync();

            return trabajosTerminadosMes;
        }

        public async Task<int> ObtenerPresupuestosCreadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var presupuestosCreadosMes = await _contexto
                .Presupuestos.Where(p => p.Fecha.Month == mes && p.Fecha.Year == anio)
                .CountAsync();

            return presupuestosCreadosMes;
        }

        public async Task<int> ObtenerPresupuestosAceptadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var presupuestosAceptadosMes = await _contexto
                .Presupuestos.Where(p =>
                    p.FechaAceptado.HasValue && p.FechaAceptado.Value.Month == mes && p.FechaAceptado.Value.Year == anio
                )
                .CountAsync();

            return presupuestosAceptadosMes;
        }

        private (int mes, int anio) ObtenerPeríodo(DateOnly fecha)
        {
            int mes = fecha.Month;
            int anio = fecha.Year;

            return (mes, anio);
        }
    }
}
