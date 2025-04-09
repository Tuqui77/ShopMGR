using ShopMGR.Dominio.Enums;
using ShopMGR.Dominio.Modelo;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class TrabajoDTO
    {
        public string Titulo { get; set; }
        public int IdCliente { get; set; }
        public int? IdPresupuesto { get; set; }

    }
}
