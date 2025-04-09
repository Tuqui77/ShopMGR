using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Presupuesto
    {
        public int horaDeTrabajo = 10000;
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string? Descripcion { get; set; }
        public List<Material> Materiales { get; set; }
        public double HorasEstimadas { get; set; }
        public DateTime Fecha { get; set; }
        public decimal CostoMateriales { get; set; }
        public decimal CostoLabor { get; set; }
        public decimal CostoInsumos { get; set; }
        public decimal Total { get; set; }
        public EstadoPresupuesto Estado { get; set; }

        //Relaciones
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
        public Trabajo Trabajo { get; set; }
        public int IdTrabajo { get; set; }
    }
}
