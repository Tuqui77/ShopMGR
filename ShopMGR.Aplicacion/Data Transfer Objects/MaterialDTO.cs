using ShopMGR.Dominio.Modelo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class MaterialDTO
    {
        public int IdPresupuesto { get; set; }
        public string Descripcion { get; set; }
        public decimal Precio { get; set; }
        public float Cantidad { get; set; }

    }
}
