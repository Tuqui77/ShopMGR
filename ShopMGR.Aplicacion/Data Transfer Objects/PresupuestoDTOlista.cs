using ShopMGR.Dominio.Enums;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class PresupuestoDTOlista
    {
        public int Id {get; set; }
        public string Titulo { get; set; } = "";
        public string NombreCliente { get; set; } = "";
        public double HorasEstimadas { get; set; }
        public decimal Total { get; set; }
        public EstadoPresupuesto Estado { get; set; }
    }
}
