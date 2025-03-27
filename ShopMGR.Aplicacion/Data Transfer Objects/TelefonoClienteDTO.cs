using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class TelefonoClienteDTO
    {
        public int IdCliente { get; set; }
        public string Telefono { get; set; }
        public string Descripcion { get; set; }
    }
}
