using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Presupuesto
    {
        private readonly List<Material> _materiales = [];

        public int Id { get; private set; }
        public string Titulo { get; private set; }
        public string? Descripcion { get; private set; }
        public double HorasEstimadas { get; private set; }
        public DateOnly Fecha { get; private set; }
        public DateOnly? FechaAceptado { get; private set; }
        public decimal CostoMateriales { get; private set; }
        public decimal CostoLabor { get; private set; }
        public decimal CostoInsumos { get; private set; }
        public decimal Total { get; private set; }
        public EstadoPresupuesto Estado { get; private set; }

        //Relaciones
        public int IdCliente { get; private set; }
        public Cliente Cliente { get; private set; } = null!;
        public Trabajo? Trabajo { get; private set; }
        public IReadOnlyCollection<Material> Materiales => _materiales;

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
            _materiales = materiales;
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
                _materiales.Clear();
                foreach (var material in materiales)
                {
                    _materiales.Add(material);
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
            CostoMateriales = _materiales.Count > 0 ? _materiales.Sum(m => (decimal)m.Cantidad * m.Precio) : 0;
            CostoLabor = (decimal)HorasEstimadas * valorHoraDeTrabajo;
            CostoInsumos = CostoLabor * 0.1m;
            Total = CostoMateriales + CostoLabor + CostoInsumos;
        }
    }
}
