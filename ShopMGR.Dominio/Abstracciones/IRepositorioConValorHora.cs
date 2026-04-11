using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConValorHora
        : IRepositorioConEstado<Presupuesto, EstadoPresupuesto>
    {
        public Task<List<Presupuesto>> ListarPresupuestos();
        public Task ActualizarCostoHoraDeTrabajo(decimal nuevoCosto);
        public Task<decimal> ObtenerCostoHoraDeTrabajo();
    }
}
