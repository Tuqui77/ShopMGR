using ShopMGR.Dominio.Enums;
using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        public int Id { get; set; }

        public EstadoTrabajo estado;
        public DateTime fechaInicio;
        public string Titulo { get; set; }
        public List<HorasYDescripcion> HorasDeTrabajo { get; set; } = [];
        public List<string> Fotos { get; set; } = [];

        //Relaciones
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
        public Presupuesto? Presupuesto { get; set; }
        public int? IdPresupuesto { get; set; }
    }
}
