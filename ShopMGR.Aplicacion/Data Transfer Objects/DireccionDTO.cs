using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class DireccionDTO
    {
        public int IdCliente { get; set; }
        public string Calle { get; set; }
        public string Altura { get; set; }
        public string? Piso { get; set; }
        public string? Departamento { get; set; }
        public string? Descripcion { get; set; }
        public string? CodigoPostal { get; set; }
        public string? MapsID { get; set; }
    }
}
