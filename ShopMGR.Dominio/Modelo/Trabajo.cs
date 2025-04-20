using ShopMGR.Dominio.Enums;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        public int Id { get; set; }

        public EstadoTrabajo Estado { get; set; }
        public DateTime? FechaInicio { get; set; }
        public string Titulo { get; set; }

        //Relaciones
        public List<Foto> Fotos { get; set; } = [];
        public List<HorasYDescripcion> HorasDeTrabajo { get; set; } = [];
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; } 
        public Presupuesto? Presupuesto { get; set; }
        public int? IdPresupuesto { get; set; }
    }
}
