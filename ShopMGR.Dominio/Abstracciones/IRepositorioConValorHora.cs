using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Abstracciones
{
    public interface IRepositorioConValorHora : IRepositorioConEstado<Presupuesto, EstadoPresupuesto>
    {
        public Task ActualizarCostoHoraDeTrabajo(string nuevoCosto);
    }
}
