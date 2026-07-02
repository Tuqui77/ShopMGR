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
            Fecha = DateOnly.FromDateTime(DateTime.Now);
            Estado = EstadoPresupuesto.Pendiente;
        }

        public void Editar(
                int idCliente,
                string titulo,
                string descripcion,
                double horasEstimadas,
                List<Material> materiales,
                decimal valorHoraDeTrabajo
                )
        {
            IdCliente = idCliente;
            Titulo = titulo;
            Descripcion = descripcion;
            HorasEstimadas = horasEstimadas;

            if (materiales != null)
            {
                Materiales.Clear();
                foreach (var material in materiales)
                {
                    Materiales.Add(material);
                }
            }

            CalcularCostos(valorHoraDeTrabajo);
        }

        public void AceptarPresupuesto()
        {
            Estado = EstadoPresupuesto.Aceptado;
            FechaAceptado = DateOnly.FromDateTime(DateTime.Now);
        }

        public void RechazarPresupuesto()
        {
            Estado = EstadoPresupuesto.Rechazado;
        }

        //Método local para calcular los costos del presupuesto
        public void CalcularCostos(decimal valorHoraDeTrabajo)
        {
            CostoMateriales = Materiales.Count > 0 ? Materiales.Sum(m => (decimal)m.Cantidad * m.Precio) : 0;
            CostoLabor = (decimal)HorasEstimadas * valorHoraDeTrabajo;
            CostoInsumos = CostoLabor * 0.1m;
            Total = CostoMateriales + CostoLabor + CostoInsumos;
        }
    }
}
