using System.ComponentModel.DataAnnotations.Schema;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        private readonly List<HorasYDescripcion> _horasDeTrabajo = [];
        public int Id { get; private set; }
        public EstadoTrabajo Estado { get; private set; }
        public DateOnly? FechaInicio { get; private set; }
        public DateOnly? FechaFin { get; private set; }
        public string Titulo { get; private set; } = null!;
        public string? Descripcion { get; private set; }
        public decimal? TotalLabor { get; private set; }
        public float TotalHoras => HorasDeTrabajo.Sum(h => h.Horas);
        public double HorasEstimadas { get; private set; } //TODO: Implementar
        public IReadOnlyCollection<HorasYDescripcion> HorasDeTrabajo => _horasDeTrabajo;

        //Relaciones
        public Cliente Cliente { get; private set; } = null!;
        public int IdCliente { get; private set; }
        public Presupuesto? Presupuesto { get; private set; }
        public int? IdPresupuesto { get; private set; }

        public Trabajo() { } //Constructor para EF

        public Trabajo(string titulo, string? descripcion, int idCliente, EstadoTrabajo? estado, int? idPresupuesto)
        {
            Titulo = titulo;
            Descripcion = descripcion;
            IdCliente = idCliente;
            IdPresupuesto = idPresupuesto;
            Estado = estado ?? EstadoTrabajo.Pendiente;
        }

        public void Editar(string titulo, string? descripcion, int idCliente)
        {
            Titulo = titulo;
            Descripcion = descripcion;
            IdCliente = idCliente;
        }

        public void IniciarTrabajo()
        {
            Estado = EstadoTrabajo.Iniciado;
            FechaInicio = DateOnly.FromDateTime(DateTime.Now);
        }

        public void TerminarTrabajo()
        {
            Estado = EstadoTrabajo.Terminado;
            FechaFin = DateOnly.FromDateTime(DateTime.Now);
        }

        public void EliminarPresupuesto(decimal costoHora)
        {
            IdPresupuesto = null;
            TotalLabor = costoHora * (decimal)TotalHoras;
        }

        public void ModificarPresupuesto(int idPresupuesto, decimal costoLabor)
        {
            IdPresupuesto = idPresupuesto;
            TotalLabor = costoLabor;
        }

        public void AgregarHoras(HorasYDescripcion horas)
        {
            _horasDeTrabajo.Add(horas);
        }

        public void AgregarHoras(HorasYDescripcion horas, decimal costoHora)
        {
            _horasDeTrabajo.Add(horas);
            TotalLabor = costoHora * (decimal)TotalHoras;
        }
    }
}
