using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Dominio.Modelo
{
    public class Foto
    {
        public int Id { get; set; }
        public string Enlace { get; set; }

        //Relaciones
        public int IdTrabajo { get; set; }
        public Trabajo Trabajo { get; set; }
    }
}
