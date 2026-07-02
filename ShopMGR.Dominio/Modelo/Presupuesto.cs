using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    //TODO: refactorizar entidad con invariables
    public class Presupuesto
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public string? Descripcion { get; set; }
        public double HorasEstimadas { get; set; }
        public DateOnly Fecha { get; set; }
        public DateOnly? FechaAceptado { get; set; }
        public decimal CostoMateriales { get; set; }
        public decimal CostoLabor { get; set; }
        public decimal CostoInsumos { get; set; }
        public decimal Total { get; set; }
        public EstadoPresupuesto Estado { get; set; }

        //Relaciones
        public int IdCliente { get; set; }
        public Cliente Cliente { get; set; }
        public Trabajo? Trabajo { get; set; }
        public List<Material> Materiales { get; set; }

        public Presupuesto() { }

        public Presupuesto(
            string titulo,
            string? descripcion,
            List<Material> materiales,
            double horasEstimadas,
            int idCliente
        )
        {
            IdCliente = idCliente;
            Titulo = titulo;
            Descripcion = descripcion;
            Materiales = materiales;
            HorasEstimadas = horasEstimadas;
        }
    }
}
