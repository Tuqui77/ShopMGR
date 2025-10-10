using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class HorasYDescripcionDTO
    {
        public float Horas { get; set; }
        public string Descripcion { get; set; }
        public DateOnly Fecha { get; set; }

        //Relaciones
        public int IdTrabajo { get; set; }

    }
}
