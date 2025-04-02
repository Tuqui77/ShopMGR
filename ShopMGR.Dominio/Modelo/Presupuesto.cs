using ShopMGR.Dominio.Enums;
using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Modelo
{
    public class Presupuesto
    {
        public int Id { get; set; }
        //public Dictionary<string, (decimal precio, decimal cantidad)> Materiales = [];
        public List<Material> Materiales { get; set; }
        public int horaDeTrabajo = 10000;
        public float HorasEstimadas { get; set; }
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
    }
}
