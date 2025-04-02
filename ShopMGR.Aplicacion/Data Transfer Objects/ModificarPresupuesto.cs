using ShopMGR.Dominio.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ModificarPresupuesto
    {
        public int? IdCliente { get; set; }
        public Dictionary<List<string>, (decimal precio, decimal cantidad)>? Materiales = [];
        public int? horaDeTrabajo = 10000;
        public float? HorasEstimadas { get; set; }
        public EstadoPresupuesto? Estado { get; set; }
    }
}
