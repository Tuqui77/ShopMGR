using System.ComponentModel.DataAnnotations.Schema;
using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        public int Id { get; set; }
        public EstadoTrabajo Estado { get; set; }
        public DateOnly? FechaInicio { get; set; }
        public DateOnly? FechaFin { get; set; }
        public string Titulo { get; set; }
        public string? Descripcion { get; set; }
        public decimal? TotalLabor { get; set; }
        public float TotalHoras => HorasDeTrabajo.Sum(h => h.Horas);
        public double HorasEstimadas { get; set; }

        //Relaciones
        public List<Foto> Fotos { get; set; } = [];
        public List<HorasYDescripcion> HorasDeTrabajo { get; set; } = [];
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
        public Presupuesto? Presupuesto { get; set; }
        public int? IdPresupuesto { get; set; }
        public Trabajo() { } //Constructor para EF
        public Trabajo(string titulo, string? descripcion, int idCliente, EstadoTrabajo? estado, int? idPresupuesto)
        {
            Titulo = titulo;
            Descripcion = descripcion;
            IdCliente = idCliente;
            IdPresupuesto = idPresupuesto;
            Estado = estado ?? EstadoTrabajo.Pendiente;
        }
    }
}
