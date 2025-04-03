using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Modelo
{
    public class Material
    {
        public int Id { get; set; }
        public string Descripcion { get; set; }
        public decimal Precio { get; set; }
        public float Cantidad { get; set; }

        //Relaciones
        public Presupuesto Presupuesto { get; set; }
        public int IdPresupuesto { get; set; }
    }
}
