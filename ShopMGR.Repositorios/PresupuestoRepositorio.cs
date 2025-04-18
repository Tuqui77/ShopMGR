using Microsoft.EntityFrameworkCore;
using ShopMGR.Contexto;
using ShopMGR.Dominio.Abstracciones;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Repositorios
{
    public class PresupuestoRepositorio(ShopMGRDbContexto contexto) : IRepositorioConValorHora
    {
        private readonly ShopMGRDbContexto _contexto = contexto;

        public async Task<Presupuesto> CrearAsync(Presupuesto presupuesto)
        {
            _contexto.Presupuestos.Add(presupuesto);
            var materiales = presupuesto.Materiales;
            _contexto.Materiales.AddRange(materiales);
            await _contexto.SaveChangesAsync();

            return presupuesto;
        }

        public async Task<Presupuesto> ObtenerPorIdAsync(int idPresupuesto)
        {
            var presupuestoDB = await _contexto.Presupuestos.FindAsync(idPresupuesto)
                ?? throw new KeyNotFoundException($"No existe un presupuesto con el Id {idPresupuesto}");

            return presupuestoDB;
        }

        public async Task<Presupuesto> ObtenerDetallePorIdAsync(int id)
        {
            var presupuestoDB = await _contexto.Presupuestos
                .Include(p => p.Cliente)
                .Include(p => p.Materiales)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new KeyNotFoundException($"No existe un presupuesto con el Id {id}");

            return presupuestoDB;
        }

        public async Task<List<Presupuesto>> ObtenerPorClienteAsync(int idCliente)
        {
            var presupuestos = await _contexto.Presupuestos
                .Where(p => p.IdCliente == idCliente)
                .ToListAsync();

            return presupuestos;
        }

        public async Task<List<Presupuesto>> ObtenerPorEstadoAsync(EstadoPresupuesto estado)
        {
            var presupuestos = await _contexto.Presupuestos
                .Where(p => p.Estado == estado)
                .ToListAsync();

            return presupuestos;
        }

        public async Task ActualizarAsync(Presupuesto presupuesto)
        {
            _contexto.Presupuestos.Update(presupuesto);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(int idPresupuesto)
        {
            var presupuesto = await ObtenerPorIdAsync(idPresupuesto)
                ?? throw new KeyNotFoundException($"No existe un presupuestos con el id {idPresupuesto}");

            _contexto.Presupuestos.Remove(presupuesto);
            await _contexto.SaveChangesAsync();
        }

        public async Task ActualizarCostoHoraDeTrabajo(string nuevoCosto)
        {
            var valorHoraDeTrabajo = await _contexto.Configuraciones.Where(c => c.Clave == "ValorHoraDeTrabajo").FirstOrDefaultAsync();

            if (valorHoraDeTrabajo != null)
            {
                valorHoraDeTrabajo.Valor = nuevoCosto;
                _contexto.Configuraciones.Update(valorHoraDeTrabajo);
            }
            else
            {
                valorHoraDeTrabajo = new ConfiguracionGlobal()
                {
                    Clave = "ValorHoraDeTrabajo",
                    Valor = nuevoCosto
                };

                _contexto.Configuraciones.Add(valorHoraDeTrabajo);
            }

            await _contexto.SaveChangesAsync();
        }

        public async Task<ConfiguracionGlobal> ObtenerCostoHoraDeTrabajo()
        {
            var valorHoraDeTrabajo = await _contexto.Configuraciones
                .Where(c => c.Clave == "ValorHoraDeTrabajo")
                .FirstOrDefaultAsync()
                ?? throw new KeyNotFoundException("No existe un valor de hora de trabajo configurado");

            return valorHoraDeTrabajo;
        }
    }
}
