using Microsoft.EntityFrameworkCore;
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
    public class PresupuestoRepositorio(ShopMGRDbContexto contexto) : IRepositorio<Presupuesto>
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
                ?? throw new KeyNotFoundException("No existe un presupuesto con ese Id");

            return presupuestoDB;
        }

        //nuevo
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
        //

        public async Task ActualizarAsync(Presupuesto presupuesto)
        {
            _contexto.Presupuestos.Update(presupuesto);
            await _contexto.SaveChangesAsync();
        }

        public async Task EliminarAsync(Presupuesto entidad)
        {
            _contexto.Presupuestos.Remove(entidad);
            await _contexto.SaveChangesAsync();
        }
    }
}
