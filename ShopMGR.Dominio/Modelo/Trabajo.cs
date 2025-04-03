using ShopMGR.Dominio.Enums;
using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        public int Id { get; set; }
        public EstadoTrabajo estado;
        public DateTime fechaInicio;
        public Dictionary<float, string> HorasYDescripcion = [];
        public List<byte[]> Fotos { get; set; } = [];

        //Relaciones
        public Cliente Cliente { get; set; }
        public int IdCliente { get; set; }
        public Presupuesto? Presupuesto { get; set; }
        public int IdPresupuesto { get; set; }

    }
}
