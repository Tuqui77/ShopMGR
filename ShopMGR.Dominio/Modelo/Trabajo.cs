using ShopMGR.Dominio.Enums;
using System.Text.Json.Serialization;

namespace ShopMGR.Dominio.Modelo
{
    public class Trabajo
    {
        public int Id { get; set; }
        public EstadoTrabajo estado;
        public DateTime fechaInicio;
        public Presupuesto? Presupuesto { get; set; }
        public Dictionary<float, string> HorasYDescripcion = [];
        public List<byte[]> Fotos { get; set; } = [];
        public Cliente cliente { get; set; }
    }
}
