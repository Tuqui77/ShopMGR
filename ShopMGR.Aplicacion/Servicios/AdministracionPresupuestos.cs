using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Servicios
{
    class AdministracionPresupuestos
    {
        public Presupuesto CrearPresupuesto(Cliente cliente, Dictionary<List<string>, (decimal precio, decimal cantidad)> materiales, float horasDeTrabajo)
        {
            Presupuesto presupuesto = new();
            presupuesto.Cliente = cliente;
            presupuesto.Fecha = DateTime.Now;
            presupuesto.CostoMateriales = materiales.Sum(m => m.Value.precio * m.Value.cantidad);
            presupuesto.CostoLabor = presupuesto.HoraDeTrabajo * (decimal)horasDeTrabajo;
            presupuesto.CostoInsumos = presupuesto.CostoLabor * 0.1m;
            presupuesto.Total = presupuesto.CostoLabor + presupuesto.CostoInsumos + presupuesto.CostoMateriales;
            return presupuesto;
        }







    }
}
