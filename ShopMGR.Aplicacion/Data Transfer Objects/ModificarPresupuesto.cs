using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ModificarPresupuesto
    {
        public int? horaDeTrabajo = 10000;
        public string? Titulo { get; set; }
        public string? Descripcion { get; set; }
        public double? HorasEstimadas { get; set; }
        public EstadoPresupuesto? Estado { get; set; }

        //Relaciones
        public int? IdCliente { get; set; }
        public int? IdTrabajo { get; set; }
    }
}
