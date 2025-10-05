using ShopMGR.Dominio.Enums;

namespace ShopMGR.Aplicacion.Data_Transfer_Objects
{
    public class ModificarTrabajo
    {
        public EstadoTrabajo? Estado { get; set; }
        public string? Titulo { get; set; }
        public int? IdCliente { get; set; }
        public int? IdPresupuesto { get; set; }
        public decimal? TotalLabor { get; set; }

    }
}
