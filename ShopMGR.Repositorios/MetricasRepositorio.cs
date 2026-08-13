using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using TipoMovimiento = ShopMGR.Dominio.Enums.TipoMovimiento;

namespace ShopMGR.Repositorios
{
    public class MetricasRepositorio(ShopMGRDbContexto contexto) : IRepositorioMetricas
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<decimal?> ObtenerIngresosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var ingresosMes = await _contexto
                .MovimientoBalance.Where(m =>
                    m.Tipo == Dominio.Enums.TipoMovimiento.Pago && m.Fecha.Year == anio && m.Fecha.Month == mes
                )
                .ToListAsync();

            return ingresosMes.Count() > 0
                ? ingresosMes.Sum(m => m.Monto)
                : null;
        }

        public async Task<float?> ObtenerHorasAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var horasTrabajadasMes = await _contexto
                .HorasYDescripcion.Where(h => h.Fecha.Month == mes && h.Fecha.Year == anio)
                .ToListAsync();

            return horasTrabajadasMes.Count() > 0
                ? horasTrabajadasMes.Sum(h => h.Horas)
                : null;
        }

        public async Task<int?> ObtenerTrabajosTerminadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var trabajosTerminadosMes = await _contexto
                .Trabajos.Where(t =>
                    t.FechaFin.HasValue && t.FechaFin.Value.Month == mes && t.FechaFin.Value.Year == anio
                )
                .ToListAsync();

            return trabajosTerminadosMes.Count() > 0
                ? trabajosTerminadosMes.Count()
                : null;
        }

        public async Task<int?> ObtenerPresupuestosCreadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var presupuestosCreadosMes = await _contexto
                .Presupuestos.Where(p => p.Fecha.Month == mes && p.Fecha.Year == anio)
                .ToListAsync();

            return presupuestosCreadosMes.Count > 0
                ? presupuestosCreadosMes.Count()
                : null;
        }

        public async Task<int?> ObtenerPresupuestosAceptadosAsync(DateOnly fecha)
        {
            var (mes, anio) = ObtenerPeríodo(fecha);
            var presupuestosAceptadosMes = await _contexto
                .Presupuestos.Where(p =>
                    p.FechaAceptado.HasValue && p.FechaAceptado.Value.Month == mes && p.FechaAceptado.Value.Year == anio
                )
                .ToListAsync();

            return presupuestosAceptadosMes.Count() > 0
                ? presupuestosAceptadosMes.Count()
                : null;
        }

        public async Task<List<DateOnly>> ObtenerMesesConDatos()
        {
            //listar horas por fecha
            var fechasHoras = await _contexto
                .HorasYDescripcion.Select(m => new DateOnly(m.Fecha.Year, m.Fecha.Month, 1))
                .Distinct()
                .ToListAsync();
            //listar movimientos tipo pago por fecha
            var fechasMovimientos = await _contexto
                .MovimientoBalance.Where(m => m.Tipo == TipoMovimiento.Pago)
                .Select(m => new DateOnly(m.Fecha.Year, m.Fecha.Month, 1))
                .Distinct()
                .ToListAsync();
            //listar trabajos terminados por fecha de fin
            var fechasTrabajosTerminados = await _contexto
                .Trabajos.Where(t => t.Estado == EstadoTrabajo.Terminado && t.FechaFin != null)
                .Select(t => new DateOnly(t.FechaFin!.Value.Year, t.FechaFin.Value.Month, 1))
                .Distinct()
                .ToListAsync();
            //listar presupuestos por fecha creacion
            var fechaPresupuestosCreados = await _contexto
                .Presupuestos.Select(p => new DateOnly(p.Fecha.Year, p.Fecha.Month, 1))
                .Distinct()
                .ToListAsync();
            //listar presupuestos aprobados por fecha de aprobación
            var fechaPresupuestosAceptados = await _contexto
                .Presupuestos.Where(p => p.Estado == EstadoPresupuesto.Aceptado && p.FechaAceptado != null)
                .Select(p => new DateOnly(p.FechaAceptado!.Value.Year, p.FechaAceptado.Value.Month, 1))
                .Distinct()
                .ToListAsync();

            var fechasConDatos = fechasHoras
                .Union(fechasMovimientos)
                .Union(fechasTrabajosTerminados)
                .Union(fechaPresupuestosCreados)
                .Union(fechaPresupuestosAceptados)
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            return fechasConDatos;
        }

        private (int mes, int anio) ObtenerPeríodo(DateOnly fecha)
        {
            int mes = fecha.Month;
            int anio = fecha.Year;

            return (mes, anio);
        }
    }
}
