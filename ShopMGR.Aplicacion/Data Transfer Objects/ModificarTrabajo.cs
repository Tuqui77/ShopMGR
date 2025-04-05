using ShopMGR.Dominio.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ModificarTrabajo
    {
        public EstadoTrabajo? Estado { get; set; }
        public string? Titulo { get; set; }
        public int? IdCliente { get; set; }
        public int? IdPresupuesto { get; set; }
    }
}
